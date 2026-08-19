export const PeriodoBalance = {
  SEMANAL: "semanal",
  QUINCENAL: "quincenal",
  MENSUAL: "mensual",
} as const;
export type PeriodoBalance = (typeof PeriodoBalance)[keyof typeof PeriodoBalance];

export interface BalanceHorasEmpleado {
  empleadoId: string;
  empleadoNombre: string;
  cargoNombre: string | null;
  horasNormales: number;
  horasExtra: number;
  cantidadFaltas: number;
  cantidadLlegadasTarde: number;
  cantidadMarcacionesIncompletas: number;
}

export interface BalanceHoras {
  periodo: PeriodoBalance;
  /** "YYYY-MM-DD", inclusive. */
  desde: string;
  /** "YYYY-MM-DD", inclusive. */
  hasta: string;
  empleados: BalanceHorasEmpleado[];
}
