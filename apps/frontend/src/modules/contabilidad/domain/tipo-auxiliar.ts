/** Espejo de `apps/backend/src/modules/contabilidad/domain/tipo-auxiliar.ts`. */
export const TipoAuxiliar = {
  NINGUNO: "ninguno",
  CLIENTE: "cliente",
  PROVEEDOR: "proveedor",
  EMPLEADO: "empleado",
  FRIGORIFICO: "frigorifico",
  CUENTA_FONDOS: "cuenta_fondos",
  CHEQUE: "cheque",
} as const;
export type TipoAuxiliar = (typeof TipoAuxiliar)[keyof typeof TipoAuxiliar];

export const TIPO_AUXILIAR_LABELS: Record<TipoAuxiliar, string> = {
  [TipoAuxiliar.NINGUNO]: "Ninguno",
  [TipoAuxiliar.CLIENTE]: "Cliente",
  [TipoAuxiliar.PROVEEDOR]: "Proveedor",
  [TipoAuxiliar.EMPLEADO]: "Empleado",
  [TipoAuxiliar.FRIGORIFICO]: "Frigorífico",
  [TipoAuxiliar.CUENTA_FONDOS]: "Cuenta de fondos",
  [TipoAuxiliar.CHEQUE]: "Cheque",
};
