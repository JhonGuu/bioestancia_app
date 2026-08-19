/**
 * Rubro de la empresa. Determina qué módulos de negocio tienen sentido para ella
 * (ej. `faena` solo aplica a frigorífico), pero NO restringe el schema —
 * las tablas de negocio siempre llevan `empresaId` y listo.
 */
export enum Rubro {
  FRIGORIFICO = "frigorifico",
  REVENDEDORA = "revendedora",
}

/**
 * Representación de una Empresa en el dominio.
 *
 * Bioestancia (matadero/frigorífico) y El Meridiano (revendedora de medias reses)
 * son las dos empresas iniciales, pero el modelo no está atado a esas dos:
 * cualquier módulo de negocio nuevo se filtra por `empresaId`, nunca por rubro.
 */
export interface Empresa {
  id: string;
  razonSocial: string;
  cuit: string | null;
  /** Teléfono de contacto — se muestra en el encabezado del PDF de boleta. */
  telefono: string | null;
  /** Dirección — se muestra en el encabezado del PDF de boleta. */
  direccion: string | null;
  /**
   * Minutos de tolerancia para llegadas tarde — nivel más general de la
   * cascada de tolerancia del módulo Personal (Empleado > Cargo > Empresa,
   * ver `docs/plan-personal-asistencia.md` punto 3). Null = sin tolerancia
   * configurada a nivel empresa (el cálculo de jornada trata eso como 0).
   */
  toleranciaTardanzaMinutos: number | null;
  rubro: Rubro;
  activa: boolean;
  createdAt: Date;
  updatedAt: Date;
}
