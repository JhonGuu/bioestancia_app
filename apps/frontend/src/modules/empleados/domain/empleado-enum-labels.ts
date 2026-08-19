import { EstadoCivil, ModalidadTrabajo, TipoContrato } from "@/modules/empleados/domain/empleado.types";

export const ESTADO_CIVIL_LABELS: Record<EstadoCivil, string> = {
  [EstadoCivil.SOLTERO]: "Soltero/a",
  [EstadoCivil.CASADO]: "Casado/a",
  [EstadoCivil.DIVORCIADO]: "Divorciado/a",
  [EstadoCivil.VIUDO]: "Viudo/a",
  [EstadoCivil.UNION_CONVIVENCIAL]: "Unión convivencial",
};

export const TIPO_CONTRATO_LABELS: Record<TipoContrato, string> = {
  [TipoContrato.TIEMPO_INDETERMINADO]: "Tiempo indeterminado",
  [TipoContrato.PLAZO_FIJO]: "Plazo fijo",
  [TipoContrato.EVENTUAL]: "Eventual",
  [TipoContrato.TEMPORADA]: "Temporada",
  [TipoContrato.PASANTIA]: "Pasantía",
};

export const MODALIDAD_TRABAJO_LABELS: Record<ModalidadTrabajo, string> = {
  [ModalidadTrabajo.PRESENCIAL]: "Presencial",
  [ModalidadTrabajo.TELETRABAJO]: "Teletrabajo",
  [ModalidadTrabajo.HIBRIDO]: "Híbrido",
};

/** 0 = domingo ... 6 = sábado, igual que `Date.getDay()`. */
export const DIA_SEMANA_LABELS: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};
