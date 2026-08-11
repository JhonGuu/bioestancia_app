import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Env } from "@/shared/infra/env/env";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { WslspClient } from "@/shared/infra/afip/wslsp.client";
import { WSLSP_TIPO_COMPROBANTE_PORCINO } from "@/shared/infra/afip/wslsp.types";
import { CATEGORIA_PORCINO_WSLSP } from "@/shared/infra/afip/categoria-porcino-wslsp.map";
import { LiquidacionCompraRepository } from "@/modules/liquidacion-compra/domain/liquidacion-compra.repository";
import { LiquidacionCompra } from "@/modules/liquidacion-compra/domain/liquidacion-compra";
import { CompraRepository } from "@/modules/compras/domain/compra.repository";
import { CompraCategoriaRepository } from "@/modules/compras/domain/compra-categoria.repository";
import { ProveedorRepository } from "@/modules/proveedores/domain/proveedor.repository";
import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";

export interface EmitirCaeLiquidacionCompraInput {
  empresaId: string;
  compraId: string;
}

/**
 * Le pide el CAE a AFIP (WSLSP) para una liquidación de compra que ya está
 * cargada en el sistema, y completa `numeroComprobante`/`cae`/
 * `fechaVencimientoCae` con la respuesta — reemplaza el paso manual de
 * cargarla en la web de AFIP y copiar el CAE a mano.
 *
 * Precondiciones:
 *  - La compra tiene que tener ya una `LiquidacionCompra` creada
 *    (`CreateLiquidacionCompra`) con sus categorías facturadas.
 *  - Esa liquidación todavía no tiene CAE (no se puede pedir dos veces).
 *  - AFIP tiene que estar configurado (`Env.afipHabilitado`) — si no, 501.
 *  - El proveedor de la compra tiene que tener `cuit` y `codigoAfip` cargados.
 *
 * ⚠️ Hoy este use-case todavía NO puede completar una emisión real: le manda
 * a `WslspClient.autorizarLiquidacionCompraDirecta` categorías sin
 * `codigoRaza`/`tipoLiquidacion` (no tenemos esos datos en el dominio
 * todavía — ver el TODO en `wslsp.client.ts`), así que ese método corta con
 * un error claro antes de llamar a AFIP. El resto del flujo (orquestación,
 * guardado, manejo de errores) ya está armado para no tener que tocarlo de
 * nuevo cuando se carguen esos datos.
 */
@injectable()
export class EmitirCaeLiquidacionCompra {
  constructor(
    @inject(DI_TYPES.LiquidacionCompraRepository)
    private readonly liquidacionCompraRepository: LiquidacionCompraRepository,
    @inject(DI_TYPES.CompraRepository) private readonly compraRepository: CompraRepository,
    @inject(DI_TYPES.CompraCategoriaRepository)
    private readonly compraCategoriaRepository: CompraCategoriaRepository,
    @inject(DI_TYPES.ProveedorRepository) private readonly proveedorRepository: ProveedorRepository,
    @inject(DI_TYPES.WslspClient) private readonly wslspClient: WslspClient,
  ) {}

  async execute(input: EmitirCaeLiquidacionCompraInput): Promise<LiquidacionCompra> {
    if (!Env.afipHabilitado) {
      throw new ApiError(
        "AFIP todavía no está configurado en este ambiente (falta el certificado digital) — " +
          "ver apps/backend/src/shared/infra/afip/README.md",
        Code.NOT_IMPLEMENTED,
      );
    }
    const puntoVenta = Env.afipPuntoVenta;
    if (!puntoVenta) {
      throw new ApiError("Falta configurar AFIP_WSLSP_PUNTO_VENTA", Code.BAD_REQUEST);
    }

    const liquidacion = await this.liquidacionCompraRepository.getByCompraId(
      input.compraId,
      input.empresaId,
    );
    if (!liquidacion) {
      throw new ApiError("Esta compra todavía no tiene una liquidación cargada", Code.NOT_FOUND);
    }
    if (liquidacion.cae) {
      throw new ApiError("Esta liquidación ya tiene CAE asignado", Code.BAD_REQUEST);
    }

    const compra = await this.compraRepository.getById(input.compraId, input.empresaId);
    if (!compra) {
      throw new ApiError("Compra no encontrada", Code.NOT_FOUND);
    }

    const proveedor = await this.proveedorRepository.getById(compra.proveedorId, input.empresaId);
    if (!proveedor) {
      throw new ApiError("Proveedor de la compra no encontrado", Code.NOT_FOUND);
    }
    // Se extraen a variables locales (no se vuelve a leer `proveedor.*` más
    // abajo): con `strictNullChecks`, TS no garantiza que un chequeo de
    // arriba siga valiendo después de un `await` intermedio.
    const cuitVendedor = proveedor.cuit;
    const codigoAfip = proveedor.codigoAfip;
    const renspaVendedor = proveedor.renspa;
    const condicionFiscal = proveedor.condicionFiscal;
    if (!cuitVendedor) {
      throw new ApiError("El proveedor de esta compra no tiene CUIT cargado", Code.BAD_REQUEST);
    }
    if (!codigoAfip) {
      throw new ApiError(
        "El proveedor de esta compra no tiene código AFIP (carácter WSLSP) cargado",
        Code.BAD_REQUEST,
      );
    }

    const categorias = await this.compraCategoriaRepository.listByCompra(input.compraId);
    const categoriasFacturadas = categorias.filter(
      (c) => c.importeBruto !== null && c.precioKg !== null && c.porcentajeIva !== null,
    );
    if (categoriasFacturadas.length === 0) {
      throw new ApiError(
        "La liquidación no tiene categorías facturadas — revisar CreateLiquidacionCompra",
        Code.BAD_REQUEST,
      );
    }

    // Carácter WSLSP viene como "100 - Productores/..." — nos quedamos con el número.
    const caracterVendedor = Number(codigoAfip.split(" - ")[0]);

    // A/B/C según condición fiscal del proveedor (best-effort — confirmar
    // regla real contra el manual: hoy todo proveedor de Bioestancia es RI o
    // Monotributo, nunca se vio el caso "B").
    const tipoComprobante =
      condicionFiscal === CondicionFiscal.RESPONSABLE_INSCRIPTO
        ? WSLSP_TIPO_COMPROBANTE_PORCINO.LIQUIDACION_COMPRA_DIRECTA_A
        : WSLSP_TIPO_COMPROBANTE_PORCINO.LIQUIDACION_COMPRA_DIRECTA_C;

    const ultimoNro = await this.wslspClient.consultarUltimoNroComprobante(puntoVenta, tipoComprobante);
    const nroComprobante = ultimoNro + 1;

    const resultado = await this.wslspClient.autorizarLiquidacionCompraDirecta({
      puntoVenta,
      nroComprobante,
      tipoComprobante,
      fecha: liquidacion.fecha,
      cuitVendedor,
      caracterVendedor,
      renspaVendedor,
      importeNeto: liquidacion.importeNeto,
      // TODO: `Proveedor` todavía no guarda el código AFIP de
      // localidad/provincia de procedencia — sin esto, `buildSolicitud...`
      // arma la liquidación sin esos campos y AFIP la va a rechazar. Ver
      // TODO en wslsp.client.ts.
      categorias: categoriasFacturadas.map((c) => ({
        codigoCategoria: CATEGORIA_PORCINO_WSLSP[c.categoria],
        cabezas: c.cabezas,
        kgVivo: c.kgVivoFaena as number,
        precioPorKg: c.precioKg as number,
        porcentajeIva: c.porcentajeIva as number,
        // TODO: no tenemos raza ni tipoLiquidacion en el dominio todavía —
        // ver TODO en wslsp.client.ts. Mientras estén en `null`,
        // `autorizarLiquidacionCompraDirecta` corta antes de llamar a AFIP.
        codigoRaza: null,
        tipoLiquidacion: null,
      })),
    });

    return this.liquidacionCompraRepository.updateCae(liquidacion.id, input.empresaId, {
      numeroComprobante: String(resultado.nroComprobante).padStart(8, "0"),
      cae: resultado.cae,
      fechaVencimientoCae: resultado.fechaVencimientoCae,
    });
  }
}
