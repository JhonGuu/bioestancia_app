import { inject, injectable } from "inversify";
import { parseStringPromise } from "xml2js";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Env } from "@/shared/infra/env/env";
import { Logger } from "@/shared/infra/logger/logger";
import { WsaaClient } from "@/shared/infra/afip/wsaa.client";
import {
  AutorizarLiquidacionCompraDirectaInput,
  AutorizarLiquidacionResult,
  WSLSP_OPERACION_COMPRA_DIRECTA_PORCINA,
  WSLSP_MOTIVO,
  WslspBusinessError,
  WslspErrorItem,
} from "@/shared/infra/afip/wslsp.types";

const WSLSP_SERVICE_NAME = "wslsp";
const WSLSP_NS = "http://serviciosjava.arca.gob.ar/wslsp/";

const WSLSP_URL = {
  homologacion: "https://fwshomo.arca.gov.ar/wslsp/LspService",
  produccion: "https://serviciosjava.arca.gob.ar/wslsp/LspService",
} as const;

/**
 * Cliente del servicio WSLSP (Liquidación Sector Pecuario) de AFIP.
 *
 * Fuente: "Liquidación Sector Pecuario Web Service — LspService", manual del
 * desarrollador v2.0.3 (https://www.afip.gob.ar/ws/WSLSP/manual_wslsp_2.0.3.pdf).
 * Endpoints, namespace, y la estructura de `<auth>`/`<errores>` están
 * confirmados contra ese manual. El campo a campo del método que genera la
 * liquidación y devuelve el CAE (`generarLiquidacion` — ver el TODO en
 * `autorizarLiquidacionCompraDirecta` más abajo para el detalle de qué está
 * confirmado y qué no) se terminó de reconstruir cruzando el manual con la
 * implementación real de la librería open-source `pyafipws`, que consume
 * este mismo web service — ver `README.md` para las fuentes.
 */
@injectable()
export class WslspClient {
  constructor(
    @inject(DI_TYPES.Logger) private readonly logger: Logger,
    @inject(DI_TYPES.WsaaClient) private readonly wsaa: WsaaClient,
  ) {}

  /**
   * Health check del servicio — no requiere auth. Útil para verificar que
   * las credenciales/endpoint están bien configurados antes de emitir nada.
   */
  async dummy(): Promise<{ appserver: string; authserver: string; dbserver: string }> {
    const body = await this.call("dummy", "");
    const respuesta = body?.dummyResponse ?? body;
    return {
      appserver: respuesta?.appserver ?? "?",
      authserver: respuesta?.authserver ?? "?",
      dbserver: respuesta?.dbserver ?? "?",
    };
  }

  /**
   * Consulta el último número de comprobante autorizado para
   * cuit+puntoVenta+tipoComprobante (confirmado en el manual, sección 1.3 —
   * se usa +1 para saber qué `nroComprobante` mandar en la próxima liquidación).
   */
  async consultarUltimoNroComprobante(puntoVenta: number, tipoComprobante: number): Promise<number> {
    const auth = await this.buildAuth();
    const solicitud = `
      <solicitud>
        <puntoVenta>${puntoVenta}</puntoVenta>
        <tipoComprobante>${tipoComprobante}</tipoComprobante>
      </solicitud>`;
    const body = await this.call(
      "consultarUltimoNroComprobantePorPtoVta",
      `${auth}${solicitud}`,
    );
    const respuesta = body?.consultarUltimoNroComprobantePorPtoVtaResponse;
    this.throwIfBusinessErrors(respuesta);
    const nro = respuesta?.respuesta?.nroComprobante ?? respuesta?.nroComprobante;
    return Number(nro ?? 0);
  }

  /**
   * Autoriza una "Liquidación de Compra Directa" (porcina) y devuelve el
   * CAE. Esto es lo que reemplaza el paso manual de cargarla en la web de
   * AFIP.
   *
   * ⚠️ TODO ANTES DE USAR CONTRA AFIP (aunque sea homologación) — ver el
   * detalle completo con fuentes en `README.md`. Resumen:
   *
   * CONFIRMADO (contra el manual oficial + código real de la librería
   * open-source pyafipws, que implementa este mismo web service):
   *   - El método SOAP real es `generarLiquidacion`, NO `autorizarLiquidacion`
   *     como estaba antes acá (hallazgo importante: con el nombre viejo esto
   *     iba a fallar el 100% de las veces).
   *   - La estructura anidada real: `solicitud = {codOperacion, emisor,
   *     receptor, datosLiquidacion, itemDetalleLiquidacion[], guia[], dte[],
   *     tributo[], gasto[], datosAdicionales}`.
   *   - La respuesta trae el CAE bajo `liquidacion.cabecera.cae` (no plano
   *     como estaba antes).
   *   - Los campos que arma este método más abajo.
   *
   * SIN CONFIRMAR (gaps reales, no se inventaron valores):
   *   - `codLocalidadProcedencia`/`codProvinciaProcedencia`: de dónde salen
   *     estos códigos en nuestro dominio (Proveedor no los tiene hoy).
   *   - `raza.codRaza` por ítem: WSLSP lo pide sin default conocido y no
   *     registramos raza por categoría — mientras no se resuelva, el
   *     `<itemDetalleLiquidacion>` de una categoría sin `codigoRaza` cargado
   *     tira un error acá mismo (antes de llamar a AFIP) en vez de mandar un
   *     valor inventado.
   *   - `tipoLiquidacion` por ítem: no se encontró la tabla de códigos en
   *     ninguna fuente disponible.
   *   - Si `operador` (comisionista intermediario) hace falta para código de
   *     operación 105 — no se mandó por no estar confirmado que aplique.
   */
  async autorizarLiquidacionCompraDirecta(
    input: AutorizarLiquidacionCompraDirectaInput,
  ): Promise<AutorizarLiquidacionResult> {
    const auth = await this.buildAuth();
    const solicitud = this.buildSolicitudAutorizarLiquidacion(input);
    const body = await this.call("generarLiquidacion", `${auth}${solicitud}`);
    const respuesta = body?.generarLiquidacionResponse;
    this.throwIfBusinessErrors(respuesta);

    const liquidacion = respuesta?.respuesta?.liquidacion ?? respuesta?.liquidacion;
    const cabecera = liquidacion?.cabecera ?? liquidacion;
    if (!cabecera?.cae) {
      this.logger.error({ respuesta }, "WSLSP generarLiquidacion sin CAE en la respuesta");
      throw new Error(
        "AFIP no devolvió CAE — revisar el mapeo de `buildSolicitudAutorizarLiquidacion` " +
          "contra el WSDL/manual (ver TODO en wslsp.client.ts)",
      );
    }

    return {
      cae: cabecera.cae,
      fechaVencimientoCae: new Date(cabecera.fechaVencimientoCae ?? cabecera.fechaVencimiento),
      nroComprobante: Number(cabecera.nroComprobante ?? input.nroComprobante),
      pdfBase64: respuesta?.pdf ?? null,
    };
  }

  // ────────────────────────────────────────────────────────────────

  private buildSolicitudAutorizarLiquidacion(input: AutorizarLiquidacionCompraDirectaInput): string {
    const itemsSinRaza = input.categorias.filter((c) => !c.codigoRaza || !c.tipoLiquidacion);
    if (itemsSinRaza.length > 0) {
      throw new Error(
        "No se puede armar la liquidación WSLSP: faltan `codigoRaza`/`tipoLiquidacion` en " +
          `${itemsSinRaza.length} categoría(s) — ver el TODO en ` +
          "`autorizarLiquidacionCompraDirecta` (wslsp.client.ts) antes de cargar estos datos.",
      );
    }

    const items = input.categorias
      .map(
        (c) => `
          <itemDetalleLiquidacion>
            <cuitCliente>${input.cuitVendedor}</cuitCliente>
            <codCategoria>${c.codigoCategoria}</codCategoria>
            <tipoLiquidacion>${c.tipoLiquidacion}</tipoLiquidacion>
            <cantidadCabezas>${c.cabezas}</cantidadCabezas>
            <cantidadKgVivo>${c.kgVivo}</cantidadKgVivo>
            <precioUnitario>${c.precioPorKg}</precioUnitario>
            <alicuotaIVA>${c.porcentajeIva}</alicuotaIVA>
            <raza>
              <codRaza>${c.codigoRaza}</codRaza>
            </raza>
            ${c.nroTropa ? `<nroTropa>${c.nroTropa}</nroTropa>` : ""}
          </itemDetalleLiquidacion>`,
      )
      .join("");

    const emisor = `
        <emisor>
          <tipoComprobante>${input.tipoComprobante}</tipoComprobante>
          <puntoVenta>${input.puntoVenta}</puntoVenta>
          <nroComprobante>${input.nroComprobante}</nroComprobante>
          ${Env.afipEmisorCodCaracter ? `<codCaracter>${Env.afipEmisorCodCaracter}</codCaracter>` : ""}
          ${Env.afipEmisorFechaInicioActividades ? `<fechaInicioActividades>${Env.afipEmisorFechaInicioActividades}</fechaInicioActividades>` : ""}
          ${Env.afipEmisorIibb ? `<iibb>${Env.afipEmisorIibb}</iibb>` : ""}
          ${Env.afipEmisorNroRuca ? `<nroRUCA>${Env.afipEmisorNroRuca}</nroRUCA>` : ""}
        </emisor>`;

    // `receptor` = la contraparte del emisor en esta liquidación — el
    // proveedor/criadero al que se le compra (confirmado por el nombre del
    // campo `codCaracter` compartiendo tabla con `Proveedor.codigoAfip`).
    const receptor = `
        <receptor>
          <codCaracter>${input.caracterVendedor}</codCaracter>
        </receptor>`;

    const datosLiquidacion = `
        <datosLiquidacion>
          <fechaComprobante>${input.fecha.toISOString().slice(0, 10)}</fechaComprobante>
          <fechaOperacion>${input.fecha.toISOString().slice(0, 10)}</fechaOperacion>
          ${Env.afipLugarRealizacion ? `<lugarRealizacion>${Env.afipLugarRealizacion}</lugarRealizacion>` : ""}
          <codMotivo>${Env.afipCodMotivo ?? WSLSP_MOTIVO.FAENA}</codMotivo>
          ${input.codLocalidadProcedencia ? `<codLocalidadProcedencia>${input.codLocalidadProcedencia}</codLocalidadProcedencia>` : ""}
          ${input.codProvinciaProcedencia ? `<codProvinciaProcedencia>${input.codProvinciaProcedencia}</codProvinciaProcedencia>` : ""}
          ${Env.afipCodLocalidadDestino ? `<codLocalidadDestino>${Env.afipCodLocalidadDestino}</codLocalidadDestino>` : ""}
          ${Env.afipCodProvinciaDestino ? `<codProvinciaDestino>${Env.afipCodProvinciaDestino}</codProvinciaDestino>` : ""}
        </datosLiquidacion>`;

    return `
      <solicitud>
        <codOperacion>${WSLSP_OPERACION_COMPRA_DIRECTA_PORCINA}</codOperacion>
        ${emisor}
        ${receptor}
        ${datosLiquidacion}
        ${items}
      </solicitud>`;
  }

  private async buildAuth(): Promise<string> {
    const ticket = await this.wsaa.getTicket(WSLSP_SERVICE_NAME);
    if (!Env.afipCuit) {
      throw new Error("AFIP_CUIT no configurado");
    }
    return `
      <auth>
        <token>${ticket.token}</token>
        <sign>${ticket.sign}</sign>
        <cuit>${Env.afipCuit}</cuit>
      </auth>`;
  }

  /** Recorre `<errores><error>` (ver sección 2.4 del manual) y tira si hay alguno. */
  private throwIfBusinessErrors(respuesta: unknown): void {
    const errores = (respuesta as { errores?: { error?: unknown } } | undefined)?.errores?.error;
    if (!errores) return;

    const lista = Array.isArray(errores) ? errores : [errores];
    const items: WslspErrorItem[] = lista.map((e: { codigo?: string; descripcion?: string }) => ({
      codigo: e.codigo ?? "?",
      descripcion: e.descripcion ?? "error sin descripción",
    }));
    throw new WslspBusinessError(items);
  }

  /** POST SOAP 1.1 genérico al servicio WSLSP, devuelve el `<Body>` ya parseado (sin namespaces). */
  private async call(method: string, innerXml: string): Promise<Record<string, any>> {
    const url = WSLSP_URL[Env.afipAmbiente];
    const envelope = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsl="${WSLSP_NS}">`,
      "  <soapenv:Header/>",
      "  <soapenv:Body>",
      `    <wsl:${method}>${innerXml}</wsl:${method}>`,
      "  </soapenv:Body>",
      "</soapenv:Envelope>",
    ].join("\n");

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/xml; charset=utf-8", SOAPAction: method },
      body: envelope,
    });
    const text = await response.text();

    if (!response.ok) {
      this.logger.error({ method, status: response.status, body: text }, "WSLSP request falló");
      throw new Error(`WSLSP (${method}) respondió ${response.status}`);
    }

    const parsed = await parseStringPromise(text, { explicitArray: false, tagNameProcessors: [stripNs] });
    return parsed?.Envelope?.Body ?? {};
  }
}

function stripNs(tag: string): string {
  return tag.includes(":") ? tag.split(":")[1] : tag;
}
