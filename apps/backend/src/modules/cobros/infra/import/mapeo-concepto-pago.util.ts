import { MedioPago } from "@/modules/cobros/domain/medio-pago";
import { TipoCargo } from "@/modules/cargos-cuenta-corriente/domain/tipo-cargo";
import { CeldaCruda, normalizarEncabezado } from "@/modules/contabilidad/infra/import/excel-reader.util";

export type ConceptoPagoMapeado =
  | { tipo: "cobro"; medioPago: MedioPago }
  | {
      tipo: "cargo";
      tipoCargo: TipoCargo;
      signoEsperado: "positivo" | "cualquiera";
      /** Un importe en cero no es error para este concepto — se salta en silencio (ver "Saldo inicial" más abajo). */
      permiteCero?: boolean;
      /** Marca las filas "Saldo inicial" (corte 2025-12-28) para que el use-case y el frontend las distingan del resto de los cargos. */
      esSaldoInicial?: boolean;
    };

/**
 * Catálogo cerrado de "Concepto" (filas `Tipo: Pago` de la hoja de cada
 * cliente de `VENTAS 2026.xlsm`) — verificado corriendo el importador contra
 * las 80 hojas reales, exactamente 14 valores (ver `plan-carga-inicial-datos.md`,
 * tabla "Mapeo Concepto/Medio de pago → dominio"). Un valor fuera de esta
 * lista frena la fila con un error en vez de adivinarse.
 *
 * `signoEsperado` en los cargos: la planilla trae el importe positivo para
 * casi todos ("aumenta la deuda"), salvo "Ajuste por diferencia" que puede
 * ir para cualquier lado (decisión #6 — `CargoCuentaCorriente.monto` admite
 * negativos solo para `TipoCargo.OTRO`). Los conceptos que mapean a "cobro"
 * siempre esperan el importe en negativo (reduce la deuda) — se valida en el
 * use-case, no acá.
 */
const CONCEPTOS_PAGO: Array<{ concepto: string; mapeado: ConceptoPagoMapeado }> = [
  { concepto: "Efectivo", mapeado: { tipo: "cobro", medioPago: MedioPago.EFECTIVO } },
  { concepto: "Transferencia", mapeado: { tipo: "cobro", medioPago: MedioPago.TRANSFERENCIA_BANCO } },
  { concepto: "Cheque", mapeado: { tipo: "cobro", medioPago: MedioPago.CHEQUE } },
  { concepto: "Cheque electrónico", mapeado: { tipo: "cobro", medioPago: MedioPago.ECHEQ } },
  { concepto: "Compensación", mapeado: { tipo: "cobro", medioPago: MedioPago.COMPENSACION } },
  { concepto: "Retenciones", mapeado: { tipo: "cobro", medioPago: MedioPago.RETENCION } },
  // "Pago" genérico (sin medio especificado en la fila) — decisión #10: entra como Efectivo.
  { concepto: "Pago", mapeado: { tipo: "cobro", medioPago: MedioPago.EFECTIVO } },
  {
    concepto: "Recargo por cheque",
    mapeado: { tipo: "cargo", tipoCargo: TipoCargo.RECARGO_CHEQUE, signoEsperado: "positivo" },
  },
  {
    concepto: "Cheque Rechazado",
    mapeado: { tipo: "cargo", tipoCargo: TipoCargo.CHEQUE_RECHAZADO, signoEsperado: "positivo" },
  },
  {
    concepto: "Comisión Rechazo",
    mapeado: { tipo: "cargo", tipoCargo: TipoCargo.COMISION_RECHAZO, signoEsperado: "positivo" },
  },
  { concepto: "Gasoil", mapeado: { tipo: "cargo", tipoCargo: TipoCargo.OTRO, signoEsperado: "positivo" } },
  { concepto: "Empleados", mapeado: { tipo: "cargo", tipoCargo: TipoCargo.OTRO, signoEsperado: "positivo" } },
  // Ajuste post-control de saldo — puede ir "para los dos lados" (decisión #6).
  {
    concepto: "Ajuste por diferencia",
    mapeado: { tipo: "cargo", tipoCargo: TipoCargo.OTRO, signoEsperado: "cualquiera" },
  },
  // Fila de corte 2025-12-28 — decisión de Juan Jose: se carga como un cargo
  // sintético más (tipo OTRO) fechado 2025-12-28, igual que "Ajuste por
  // diferencia" (puede ir para cualquier lado, y un saldo en $0 no es error,
  // simplemente no genera cargo — ver plan de carga inicial, Etapa 4).
  {
    concepto: "Saldo inicial",
    mapeado: { tipo: "cargo", tipoCargo: TipoCargo.OTRO, signoEsperado: "cualquiera", permiteCero: true, esSaldoInicial: true },
  },
];

const CONCEPTO_PAGO_MAP: Record<string, ConceptoPagoMapeado> = Object.fromEntries(
  CONCEPTOS_PAGO.map(({ concepto, mapeado }) => [normalizarEncabezado(concepto), mapeado]),
);

export function mapearConceptoPago(texto: CeldaCruda): ConceptoPagoMapeado | null {
  return CONCEPTO_PAGO_MAP[normalizarEncabezado(texto)] ?? null;
}
