/**
 * Códigos WSLSP confirmados contra el manual oficial (v2.0.3, sección 2.7 —
 * "Consultar Operaciones" / "Consultar Tipos de Comprobante") y, para lo que
 * el manual no llegó a cubrir, contra dos fuentes externas de referencia
 * (ver `README.md` de esta carpeta para el detalle de cada fuente):
 *   - pyafipws (github.com/reingart/pyafipws, `wslsp.py`) — librería open
 *     source LGPL que implementa este mismo web service, con el armado real
 *     de la solicitud SOAP.
 *   - Wiki de SistemasAgiles (sistemasagiles.com.ar/trac/wiki/LiquidacionSectorPecuario)
 *     — documentación de esa misma librería, con tablas de códigos.
 *
 * Son los que aplican a la "Liquidación de Compra Directa" porcina, que es
 * lo único que usa Bioestancia (compra a criaderos, nunca venta directa ni
 * hacienda).
 *
 * Si el día de mañana se necesita otro tipo de operación (ej. venta directa),
 * sumar el código acá — no hay que tocar el resto del cliente.
 */
export const WSLSP_OPERACION_COMPRA_DIRECTA_PORCINA = 105;

export const WSLSP_TIPO_COMPROBANTE_PORCINO = {
  LIQUIDACION_COMPRA_DIRECTA_A: 186,
  LIQUIDACION_COMPRA_DIRECTA_B: 188,
  LIQUIDACION_COMPRA_DIRECTA_C: 189,
} as const;

/** Ver `Proveedor.codigoAfip` (`modules/proveedores/domain/codigo-afip-porcino.ts`). */
export const WSLSP_CARACTER_PORCINO = {
  PRODUCTORES_CRIADORES_COMERCIALES: 100,
  INVERNADORES: 101,
  MATADERO_FRIGORIFICO: 102,
  MATARIFES_ABASTECEDORES: 103,
  CONSIGNATARIOS_COMISIONISTAS_HACIENDA: 104,
  CONSIGNATARIOS_DIRECTOS: 105,
  CONSIGNATARIOS_COMISIONISTAS_CARNES: 106,
} as const;

/**
 * Código de "motivo" de la liquidación (`datosLiquidacion.codMotivo`) — tabla
 * única, no separada por especie. Bioestancia siempre compra para faenar, así
 * que en la práctica solo se usa `FAENA`. Confirmado contra la wiki de
 * SistemasAgiles.
 */
export const WSLSP_MOTIVO = {
  FAENA: 1,
  INVERNADA: 2,
  REPRODUCCION: 3,
  CRIA: 4,
  REMATE_DE_CARNE: 5,
  FAENA_Y_VENTA_DE_CARNE_POR_CUENTA_Y_ORDEN: 6,
} as const;

/**
 * Códigos de provincia AFIP (0-24) — son propios de este web service, NO son
 * los códigos INDEC habituales (ahí "Buenos Aires" es distinto de "Capital
 * Federal" pero el 0/1 están invertidos respecto a otras tablas de AFIP).
 * Confirmado contra la wiki de SistemasAgiles. Se usan tanto para
 * `codProvinciaProcedencia` (provincia del proveedor/criadero) como para
 * `codProvinciaDestino` (provincia de la planta de Bioestancia, ver
 * `Env.afipCodProvinciaDestino`).
 */
export const WSLSP_PROVINCIAS: Record<number, string> = {
  0: "CAP. FEDERAL",
  1: "BUENOS AIRES",
  2: "CATAMARCA",
  3: "CORDOBA",
  4: "CORRIENTES",
  5: "ENTRE RIOS",
  6: "JUJUY",
  7: "MENDOZA",
  8: "LA RIOJA",
  9: "SALTA",
  10: "SAN JUAN",
  11: "SAN LUIS",
  12: "SANTA FE",
  13: "SGO. DEL ESTERO",
  14: "TUCUMAN",
  16: "CHACO",
  17: "CHUBUT",
  18: "FORMOSA",
  19: "MISIONES",
  20: "NEUQUEN",
  21: "LA PAMPA",
  22: "RIO NEGRO",
  23: "SANTA CRUZ",
  24: "TIER. DEL FUEGO",
};

/**
 * Datos que YA tenemos en nuestro dominio y que hacen falta para armar la
 * solicitud de `generarLiquidacion` (antes `AutorizarLiquidacion` — ver el
 * hallazgo documentado en `README.md`). Los nombres acá son los nuestros; el
 * mapeo a la estructura real de AFIP (`emisor`/`receptor`/`datosLiquidacion`/
 * `itemDetalleLiquidacion`) vive en
 * `WslspClient.buildSolicitudAutorizarLiquidacion`.
 *
 * ⚠️ Los campos marcados "SIN CONFIRMAR" abajo son gaps reales que quedan
 * pendientes — no se inventaron valores para ellos, ver README.
 */
export interface AutorizarLiquidacionCompraDirectaInput {
  puntoVenta: number;
  nroComprobante: number;
  /** `WSLSP_TIPO_COMPROBANTE_PORCINO.LIQUIDACION_COMPRA_DIRECTA_{A,B,C}`. */
  tipoComprobante: number;
  fecha: Date;
  /** CUIT del vendedor (proveedor/criadero) sin guiones. */
  cuitVendedor: string;
  /** Código de carácter del vendedor — `WSLSP_CARACTER_PORCINO` (va en `receptor.codCaracter`). */
  caracterVendedor: number;
  renspaVendedor: string | null;
  /**
   * Localidad/provincia de procedencia (de dónde salen los animales, según
   * AFIP esto es el establecimiento del proveedor). SIN CONFIRMAR de dónde
   * sale este dato en nuestro dominio — `Proveedor` hoy tiene `provincia`
   * como texto libre, no el código AFIP. Si no se manda, se omite del XML
   * (la solicitud le va a fallar a AFIP con ese campo obligatorio ausente).
   */
  codLocalidadProcedencia?: number;
  codProvinciaProcedencia?: number;
  categorias: {
    /** Código de categoría porcina (`categoriaPorcina` del manual, ej. 520304 = Capón). */
    codigoCategoria: number;
    cabezas: number;
    kgVivo: number;
    precioPorKg: number;
    porcentajeIva: number;
    /**
     * SIN CONFIRMAR: código de raza (`raza.codRaza`) — WSLSP lo pide en
     * el ítem sin default conocido, y la lista de razas porcinas
     * (5201-5299) no tiene un código "sin especificar". Bioestancia no
     * registra raza por categoría hoy. Hasta que se resuelva esto (manual
     * pág. 70-75 o WSDL en homologación) queda `null` acá y el cliente NO
     * arma el `<raza>` real, así que la liquidación real todavía no se
     * puede emitir con este código.
     */
    codigoRaza?: number | null;
    /**
     * SIN CONFIRMAR: código de "tipo de liquidación" (`tipoLiquidacion`) —
     * ninguna de las dos fuentes externas documenta la tabla de códigos.
     * El único ejemplo real visto (bovino/hacienda) usa `1`, pero no hay
     * garantía de que sea el mismo valor para porcino/compra directa.
     */
    tipoLiquidacion?: number | null;
    /** Número de tropa, si aplica — opcional según el esquema real. */
    nroTropa?: number | null;
  }[];
  importeNeto: number;
}

export interface AutorizarLiquidacionResult {
  cae: string;
  fechaVencimientoCae: Date;
  /** Número de comprobante confirmado por AFIP (debería coincidir con el enviado). */
  nroComprobante: number;
  /** PDF de la liquidación en base64, si AFIP lo devolvió (algunos métodos lo omiten en error 550, no bloqueante). */
  pdfBase64: string | null;
}

export interface WslspErrorItem {
  codigo: string;
  descripcion: string;
}

/** Error de negocio/formato devuelto por AFIP dentro de `<errores>` (no bloquea el SOAP en sí, pero rechaza la operación). */
export class WslspBusinessError extends Error {
  constructor(public readonly errores: WslspErrorItem[]) {
    super(errores.map((e) => `[${e.codigo}] ${e.descripcion}`).join(" | "));
    this.name = "WslspBusinessError";
  }
}
