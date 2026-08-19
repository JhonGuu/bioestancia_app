import { PeriodoBalance } from "@/modules/balance-horas/domain/balance-horas.types";

export const PERIODO_BALANCE_LABELS: Record<PeriodoBalance, string> = {
  [PeriodoBalance.SEMANAL]: "Semanal",
  [PeriodoBalance.QUINCENAL]: "Quincenal",
  [PeriodoBalance.MENSUAL]: "Mensual",
};
