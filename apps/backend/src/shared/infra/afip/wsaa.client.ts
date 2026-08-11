import { randomUUID } from "crypto";
import { execFileSync } from "child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { injectable, inject } from "inversify";
import { parseStringPromise } from "xml2js";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Env } from "@/shared/infra/env/env";
import { Logger } from "@/shared/infra/logger/logger";
import { WsaaTicket } from "@/shared/infra/afip/wsaa-ticket";

const WSAA_URL = {
  homologacion: "https://wsaahomo.afip.gov.ar/ws/services/LoginCms",
  produccion: "https://wsaa.afip.gov.ar/ws/services/LoginCms",
} as const;

/**
 * Cliente del servicio de autenticación de AFIP (WSAA).
 *
 * Flujo (igual para cualquier web service de AFIP, no solo WSLSP):
 *  1. Armar un TRA (Ticket Request de Acceso): XML con un `uniqueId`,
 *     ventana de validez y el nombre del servicio al que se quiere acceder
 *     (`service` = "wslsp").
 *  2. Firmarlo en formato CMS/PKCS#7 con el certificado + clave privada del
 *     CUIT (el par que se tramitó en AFIP). Se delega en el binario
 *     `openssl` del sistema en vez de reimplementar CMS en JS — es el mismo
 *     approach que documenta el manual oficial de WSAA.
 *  3. Mandar ese CMS (en base64) al servicio SOAP `loginCms` de WSAA.
 *  4. AFIP devuelve un Ticket de Acceso (TA) con `token` + `sign`, válido
 *     por 12hs para ESE servicio puntual — se cachea en memoria hasta
 *     10 minutos antes de que venza, para no pedir uno nuevo en cada llamada.
 *
 * Requiere `Env.afipHabilitado` (cuit + cert + key cargados) — si no, tira
 * error explícito antes de intentar nada. Ver `shared/infra/afip/README.md`
 * para el trámite del certificado.
 */
@injectable()
export class WsaaClient {
  private cache = new Map<string, WsaaTicket>();

  constructor(@inject(DI_TYPES.Logger) private readonly logger: Logger) {}

  /**
   * Devuelve un ticket válido para `servicio` (ej. "wslsp"), reusando el
   * cacheado si todavía le quedan más de 10 minutos de vida.
   */
  async getTicket(servicio: string): Promise<WsaaTicket> {
    const cached = this.cache.get(servicio);
    const margenMs = 10 * 60 * 1000;
    if (cached && cached.expiracion.getTime() - Date.now() > margenMs) {
      return cached;
    }

    const ticket = await this.solicitarTicket(servicio);
    this.cache.set(servicio, ticket);
    return ticket;
  }

  private async solicitarTicket(servicio: string): Promise<WsaaTicket> {
    if (!Env.afipHabilitado) {
      throw new Error(
        "AFIP no está configurado (falta AFIP_CUIT/AFIP_CERT_PATH/AFIP_KEY_PATH) — " +
          "no se puede pedir un ticket a WSAA.",
      );
    }

    const tra = this.armarTra(servicio);
    const cmsBase64 = this.firmarTra(tra);
    const soapResponse = await this.llamarLoginCms(cmsBase64);
    return this.parsearTicket(soapResponse);
  }

  /** TRA: XML mínimo que pide WSAA, con ventana de validez de 10 minutos. */
  private armarTra(servicio: string): string {
    const ahora = new Date();
    const desde = new Date(ahora.getTime() - 60_000); // 1 min de margen por desfasaje de reloj
    const hasta = new Date(ahora.getTime() + 10 * 60_000);
    const fmt = (d: Date): string => d.toISOString().replace(/\.\d{3}Z$/, "-00:00");

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      "<loginTicketRequest>",
      "  <header>",
      `    <uniqueId>${Math.floor(ahora.getTime() / 1000)}</uniqueId>`,
      `    <generationTime>${fmt(desde)}</generationTime>`,
      `    <expirationTime>${fmt(hasta)}</expirationTime>`,
      "  </header>",
      `  <service>${servicio}</service>`,
      "</loginTicketRequest>",
    ].join("\n");
  }

  /** Firma el TRA como CMS/PKCS#7 DER + base64, usando `openssl smime`. */
  private firmarTra(tra: string): string {
    const dir = mkdtempSync(path.join(tmpdir(), "wsaa-"));
    try {
      const traPath = path.join(dir, `${randomUUID()}.xml`);
      const cmsPath = path.join(dir, `${randomUUID()}.cms`);
      writeFileSync(traPath, tra, "utf-8");

      execFileSync("openssl", [
        "smime",
        "-sign",
        "-signer",
        Env.afipCertPath as string,
        "-inkey",
        Env.afipKeyPath as string,
        "-outform",
        "DER",
        "-nodetach",
        "-in",
        traPath,
        "-out",
        cmsPath,
      ]);

      return readFileSync(cmsPath).toString("base64");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  /** POST SOAP 1.1 al servicio `loginCms` de WSAA. */
  private async llamarLoginCms(cmsBase64: string): Promise<string> {
    const url = WSAA_URL[Env.afipAmbiente];
    const envelope = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov">',
      "  <soapenv:Header/>",
      "  <soapenv:Body>",
      "    <wsaa:loginCms>",
      `      <wsaa:in0>${cmsBase64}</wsaa:in0>`,
      "    </wsaa:loginCms>",
      "  </soapenv:Body>",
      "</soapenv:Envelope>",
    ].join("\n");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: "loginCms",
      },
      body: envelope,
    });

    const text = await response.text();
    if (!response.ok) {
      this.logger.error({ status: response.status, body: text }, "WSAA loginCms falló");
      throw new Error(`WSAA respondió ${response.status} al pedir el ticket`);
    }
    return text;
  }

  /**
   * La respuesta SOAP trae, adentro de `loginCmsReturn`, el XML del
   * LoginTicketResponse ESCAPADO como texto (no como XML anidado) — hay que
   * parsear dos veces: el sobre SOAP, y después ese string interno.
   */
  private async parsearTicket(soapXml: string): Promise<WsaaTicket> {
    const envelope = await parseStringPromise(soapXml, { explicitArray: false, tagNameProcessors: [stripNs] });
    const inner: string | undefined =
      envelope?.Envelope?.Body?.loginCmsResponse?.loginCmsReturn;
    if (!inner) {
      throw new Error("Respuesta de WSAA con formato inesperado (sin loginCmsReturn)");
    }

    const ticketXml = await parseStringPromise(inner, { explicitArray: false });
    const credentials = ticketXml?.loginTicketResponse?.credentials;
    const expirationTime = ticketXml?.loginTicketResponse?.header?.expirationTime;
    if (!credentials?.token || !credentials?.sign || !expirationTime) {
      throw new Error("Ticket de WSAA incompleto (falta token/sign/expirationTime)");
    }

    return {
      token: credentials.token,
      sign: credentials.sign,
      expiracion: new Date(expirationTime),
    };
  }
}

/** Saca el prefijo de namespace de un tag (`soapenv:Envelope` -> `Envelope`). */
function stripNs(tag: string): string {
  return tag.includes(":") ? tag.split(":")[1] : tag;
}
