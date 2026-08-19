/** Espejo de `apps/backend/src/modules/personal/domain/empleado.ts`. */
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

export interface Empleado {
  id: string;
  empresaId: string;

  // Datos personales e identificatorios
  nombre: string;
  apellido: string;
  dni: string;
  dniArchivoPath: string | null;
  cuil: string | null;
  domicilio: string | null;
  telefono: string | null;
  fechaNacimiento: string | null;
  estadoCivil: EstadoCivil | null;
  contactoEmergenciaNombre: string | null;
  contactoEmergenciaTelefono: string | null;

  // Datos laborales y contractuales
  fechaIngreso: string;
  cargoId: string | null;
  categoriaProfesional: string | null;
  convenioColectivo: string | null;
  tipoContrato: TipoContrato | null;
  modalidad: ModalidadTrabajo | null;
  lugarPrestacionTareas: string | null;
  datosBancarios: string | null;

  // Operativo (módulo de asistencia)
  nombreDispositivo: string | null;
  toleranciaMinutos: number | null;

  activo: boolean;
  createdAt: string;
  updatedAt: string;
}
