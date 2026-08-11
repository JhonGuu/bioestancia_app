import dotenv from "dotenv";
import path from "path";

// Carga las variables del archivo .env a process.env
// Sólo se ejecuta una vez al importar este archivo
dotenv.config({ path: path.join(process.cwd(), ".env") });

export class Env {
  /**
   * Lee una variable de entorno. Lanza si no existe.
   * Si se pasan possibleValues, valida que el valor esté entre ellos.
   */
  private static get(key: string, possibleValues?: readonly string[]): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing environment variable: ${key}`);
    }
    if (possibleValues?.length && !possibleValues.includes(value)) {
      throw new Error(
        `Invalid value for ${key}. Expected one of: ${possibleValues.join(", ")}`,
      );
    }
    return value;
  }

  static get environment(): "local" | "test" | "development" | "production" {
    return this.get("NODE_ENV", [
      "local",
      "test",
      "development",
      "production",
    ]) as "local" | "test" | "development" | "production";
  }

  static get port(): number {
    return Number(this.get("PORT"));
  }

  static get jwtSecret(): string {
    return this.get("JWT_SECRET");
  }

  static get dbUrl(): string {
    return this.get("DB_URL");
  }

  static get bcryptSalt(): number {
    return Number(this.get("BCRYPT_SALT"));
  }

  static get logLevel(): string {
    return process.env.LOG_LEVEL ?? "info";
  }

  /**
   * Variables de AFIP (WSAA/WSLSP) — a diferencia de las de arriba, son
   * OPCIONALES: no lanzan si faltan. Hasta que no se complete el trámite del
   * certificado digital ante AFIP, la app tiene que poder arrancar igual sin
   * estas variables — sencillamente el módulo de emisión de CAE queda
   * deshabilitado (ver `Env.afipHabilitado`).
   */
  private static getOptional(key: string): string | null {
    return process.env[key] || null;
  }

  /** "homologacion" (testing) o "produccion". Default "homologacion". */
  static get afipAmbiente(): "homologacion" | "produccion" {
    const value = process.env.AFIP_AMBIENTE || "homologacion";
    if (value !== "homologacion" && value !== "produccion") {
      throw new Error('AFIP_AMBIENTE tiene que ser "homologacion" o "produccion"');
    }
    return value;
  }

  /** CUIT (sin guiones) de la empresa que emite, tal como está en el certificado. */
  static get afipCuit(): string | null {
    return this.getOptional("AFIP_CUIT");
  }

  /** Ruta absoluta al certificado (.crt/.pem) emitido por AFIP para el CUIT de arriba. */
  static get afipCertPath(): string | null {
    return this.getOptional("AFIP_CERT_PATH");
  }

  /** Ruta absoluta a la clave privada (.key) con la que se generó el CSR del certificado. */
  static get afipKeyPath(): string | null {
    return this.getOptional("AFIP_KEY_PATH");
  }

  /** Punto de venta habilitado en AFIP para emitir liquidaciones por WSLSP. */
  static get afipPuntoVenta(): number | null {
    const value = this.getOptional("AFIP_WSLSP_PUNTO_VENTA");
    return value ? Number(value) : null;
  }

  /**
   * true si están cargadas las 3 variables imprescindibles para hablarle a
   * AFIP (cuit + cert + key). El punto de venta se valida aparte porque
   * puede variar por operación.
   */
  static get afipHabilitado(): boolean {
    return Boolean(this.afipCuit && this.afipCertPath && this.afipKeyPath);
  }

  /**
   * Datos del "emisor" de la liquidación WSLSP — son propios de la empresa
   * que emite (Bioestancia como frigorífico), fijos en el tiempo, así que se
   * cargan una sola vez acá en vez de en la base. Ver
   * `wslsp.client.ts#buildSolicitudAutorizarLiquidacion` para cómo se usan.
   * Todas opcionales por el mismo motivo que el resto de las AFIP_*: la app
   * tiene que poder arrancar sin certificado.
   */

  /** Carácter WSLSP de Bioestancia como emisor — 102 = "Matadero - Frigorífico" (`WSLSP_CARACTER_PORCINO`). */
  static get afipEmisorCodCaracter(): number | null {
    const value = this.getOptional("AFIP_EMISOR_COD_CARACTER");
    return value ? Number(value) : null;
  }

  /** Fecha de inicio de actividades ante AFIP del emisor, formato YYYY-MM-DD. */
  static get afipEmisorFechaInicioActividades(): string | null {
    return this.getOptional("AFIP_EMISOR_FECHA_INICIO_ACTIVIDADES");
  }

  /** Número de inscripción en Ingresos Brutos del emisor. */
  static get afipEmisorIibb(): string | null {
    return this.getOptional("AFIP_EMISOR_IIBB");
  }

  /** Número de RUCA (Registro Único de Operadores de la Cadena Agroalimentaria) del emisor. */
  static get afipEmisorNroRuca(): string | null {
    return this.getOptional("AFIP_EMISOR_NRO_RUCA");
  }

  /** Texto libre: lugar donde se realiza la operación (ej. planta/frigorífico). */
  static get afipLugarRealizacion(): string | null {
    return this.getOptional("AFIP_LUGAR_REALIZACION");
  }

  /** Código de localidad AFIP del destino (planta de Bioestancia) — se obtiene con `consultarLocalidadesPorProvincia`. */
  static get afipCodLocalidadDestino(): number | null {
    const value = this.getOptional("AFIP_LOCALIDAD_DESTINO");
    return value ? Number(value) : null;
  }

  /** Código de provincia AFIP del destino (0-24, tabla propia de AFIP — ver `WSLSP_PROVINCIAS`). */
  static get afipCodProvinciaDestino(): number | null {
    const value = this.getOptional("AFIP_PROVINCIA_DESTINO");
    return value ? Number(value) : null;
  }

  /** Código de motivo de la liquidación (`WSLSP_MOTIVO`) — default 1 = FAENA, que es el único caso de Bioestancia. */
  static get afipCodMotivo(): number {
    const value = this.getOptional("AFIP_MOTIVO");
    return value ? Number(value) : 1;
  }
}
