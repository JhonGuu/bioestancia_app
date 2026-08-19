/** Ver `docs/plan-personal-asistencia.md`, punto 2 ("Modelo de datos propuesto"). */
export const EstadoCivil = {
  SOLTERO: "soltero",
  CASADO: "casado",
  DIVORCIADO: "divorciado",
  VIUDO: "viudo",
  UNION_CONVIVENCIAL: "union_convivencial",
} as const;
export type EstadoCivil = (typeof EstadoCivil)[keyof typeof EstadoCivil];

export const TipoContrato = {
  TIEMPO_INDETERMINADO: "tiempo_indeterminado",
  PLAZO_FIJO: "plazo_fijo",
  EVENTUAL: "eventual",
  TEMPORADA: "temporada",
  PASANTIA: "pasantia",
} as const;
export type TipoContrato = (typeof TipoContrato)[keyof typeof TipoContrato];

export const ModalidadTrabajo = {
  PRESENCIAL: "presencial",
  TELETRABAJO: "teletrabajo",
  HIBRIDO: "hibrido",
} as const;
export type ModalidadTrabajo = (typeof ModalidadTrabajo)[keyof typeof ModalidadTrabajo];

/**
 * Representación del Empleado en el dominio — el legajo básico (catálogo,
 * como `Proveedor`/`Frigorifico`). Agrupado en tres bloques, igual que se
 * pidió: datos personales e identificatorios, datos laborales y
 * contractuales, y campos operativos del módulo de asistencia.
 */
export interface Empleado {
  id: string;
  empresaId: string;

  // ── Datos personales e identificatorios ──
  nombre: string;
  apellido: string;
  dni: string;
  /** Ruta relativa devuelta por `FileStorage.save()` — nunca se expone directo, se sirve vía `GET /personal/empleados/:id/dni`. */
  dniArchivoPath: string | null;
  cuil: string | null;
  domicilio: string | null;
  telefono: string | null;
  fechaNacimiento: Date | null;
  estadoCivil: EstadoCivil | null;
  contactoEmergenciaNombre: string | null;
  contactoEmergenciaTelefono: string | null;

  // ── Datos laborales y contractuales ──
  fechaIngreso: Date;
  cargoId: string | null;
  categoriaProfesional: string | null;
  convenioColectivo: string | null;
  tipoContrato: TipoContrato | null;
  modalidad: ModalidadTrabajo | null;
  lugarPrestacionTareas: string | null;
  /** CBU/alias — mismo campo que ya existe en `Proveedor`. */
  datosBancarios: string | null;

  // ── Operativo (módulo de asistencia) ──
  /**
   * Nombre (o alias) tal como lo manda el lector de huellas — el matcheo
   * automático por nombre exacto no funciona (nombres truncados por el
   * dispositivo), así que este campo es el mapeo explícito por empleado.
   */
  nombreDispositivo: string | null;
  /** Tercer nivel de la cascada de tolerancia (el más específico). Null = se cae al nivel de Cargo. */
  toleranciaMinutos: number | null;

  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
