import { Boleta } from "@/modules/boletas/domain/boleta";
import { Venta } from "@/modules/ventas/domain/venta";
import { AplicacionCobro } from "@/modules/cobros/domain/aplicacion-cobro";
import { CobroConLineas } from "@/modules/cobros/domain/cobro.repository";
import { CargoCuentaCorriente } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente";
import { calcularMontoBoleta } from "@/modules/boletas/domain/calcular-monto-boleta";
import { SaldoCliente } from "@/modules/cuenta-corriente/domain/saldo-cliente";

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Calcula el saldo de cuenta corriente de UN cliente a partir de sus datos ya
 * filtrados (boletas/ventas/aplicaciones/cobros/cargos de ESE cliente
 * puntual) — función pura, sin acceso a repositorios ni red, para poder
 * reusar exactamente la misma lógica de negocio tanto desde
 * `ObtenerSaldoCliente` (un cliente, vía queries filtradas por clienteId)
 * como desde `ObtenerSaldosClientes` (todos los clientes de la empresa de
 * una, agrupando en memoria a partir de queries a nivel empresa) sin
 * duplicarla ni arriesgar que se desincronicen.
 */
export function calcularSaldoCliente(
  clienteId: string,
  boletas: Boleta[],
  ventas: Venta[],
  aplicaciones: Pick<AplicacionCobro, "boletaId" | "monto">[],
  cobros: Pick<CobroConLineas, "activo" | "lineas">[],
  cargos: Pick<CargoCuentaCorriente, "activo" | "monto">[],
): SaldoCliente {
  const ventasPorBoleta = new Map<string, Venta[]>();
  for (const venta of ventas) {
    if (!venta.boletaId) continue;
    const arr = ventasPorBoleta.get(venta.boletaId) ?? [];
    arr.push(venta);
    ventasPorBoleta.set(venta.boletaId, arr);
  }

  const aplicadoPorBoleta = new Map<string, number>();
  for (const aplicacion of aplicaciones) {
    aplicadoPorBoleta.set(aplicacion.boletaId, (aplicadoPorBoleta.get(aplicacion.boletaId) ?? 0) + aplicacion.monto);
  }

  let saldoVencido = 0;
  let saldoPorVencer = 0;
  const ahora = Date.now();
  for (const boleta of boletas) {
    const ventasBoleta = ventasPorBoleta.get(boleta.id) ?? [];
    const { monto: montoBoleta } = calcularMontoBoleta(ventasBoleta);
    const aplicado = aplicadoPorBoleta.get(boleta.id) ?? 0;
    const saldo = redondear(montoBoleta - aplicado);
    if (saldo <= 0.01) continue;

    // Boletas sin fechaVencimiento (legado, previas a este campo) se
    // cuentan como vencidas — no hay info de plazo para asumir lo contrario.
    const vencida = boleta.fechaVencimiento ? boleta.fechaVencimiento.getTime() < ahora : true;
    if (vencida) {
      saldoVencido = redondear(saldoVencido + saldo);
    } else {
      saldoPorVencer = redondear(saldoPorVencer + saldo);
    }
  }

  // Los cargos (recargo por cheque, comisión por rechazo) no tienen fecha de
  // vencimiento propia — son una penalidad que se suma directo al vencido, se
  // espera que se cobren cuanto antes.
  for (const cargo of cargos) {
    if (!cargo.activo) continue;
    saldoVencido = redondear(saldoVencido + cargo.monto);
  }

  const totalCobrado = cobros
    .filter((c) => c.activo)
    .reduce((acc, c) => acc + c.lineas.reduce((accLinea, l) => accLinea + l.monto, 0), 0);
  const totalAplicado = aplicaciones.reduce((acc, a) => acc + a.monto, 0);
  const saldoAFavor = Math.max(0, redondear(totalCobrado - totalAplicado));

  return {
    clienteId,
    saldoVencido,
    saldoPorVencer,
    saldoTotal: redondear(saldoVencido + saldoPorVencer),
    saldoAFavor,
  };
}
