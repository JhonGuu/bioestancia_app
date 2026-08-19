import { obtenerSemanaIso, rangoSemanaIso } from "@/shared/domain/semana-iso";
import { calcularBandaCobranza } from "@/modules/porcentaje-cobranza/domain/banda-cobranza";
import type { PorcentajeCobranzaCliente, SemanaCobranza } from "@/modules/porcentaje-cobranza/domain/porcentaje-cobranza";

/** Un movimiento ya resuelto a su efecto sobre el saldo — ver `ObtenerPorcentajeCobranza`. */
export interface MovimientoCobranza {
  fecha: Date;
  monto: number;
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/** Última semana ISO de un año (52 o 53 según el año) — el 28 de diciembre siempre cae en ella. */
function ultimaSemanaIso(anio: number): number {
  return obtenerSemanaIso(new Date(Date.UTC(anio, 11, 28))).semana;
}

function sumaAntesDe(movimientos: MovimientoCobranza[], fecha: Date): number {
  return movimientos.filter((m) => m.fecha.getTime() < fecha.getTime()).reduce((acc, m) => acc + m.monto, 0);
}

function sumaEnRango(movimientos: MovimientoCobranza[], desde: Date, hasta: Date): number {
  return movimientos
    .filter((m) => m.fecha.getTime() >= desde.getTime() && m.fecha.getTime() < hasta.getTime())
    .reduce((acc, m) => acc + m.monto, 0);
}

/**
 * Calcula, semana a semana (ISO, lunes a domingo) de UN año, el `%` de
 * cobranza de deuda vencida de un cliente — reverse-engineered de
 * "VENTAS 2026.xlsm" (hoja "Porcentaje de cobranza"). Función pura: recibe
 * los movimientos ya resueltos a su efecto sobre el saldo (no accede a
 * ningún repositorio) para poder testear/reusar sin infra.
 *
 * - `ventas`: +monto por cada boleta facturada, en su fecha.
 * - `cobros`: +monto (bruto cobrado) por cada cobro, en su fecha.
 * - `cargos`: +monto por cada cargo que además resta directo del `cobrado`
 *   de la semana en la que se aplicó — cuáles tipos de cargo entran acá lo
 *   decide el caller (`ObtenerPorcentajeCobranza`).
 *
 * El saldo de arranque de la semana 1 se calcula solo, sumando el efecto de
 * TODO lo anterior al lunes de esa semana — no hace falta cargar un "saldo
 * inicial" a mano como en el Excel, ya tenemos el historial completo.
 */
export function calcularPorcentajeCobranzaCliente(
  clienteId: string,
  anio: number,
  ventas: MovimientoCobranza[],
  cobros: MovimientoCobranza[],
  cargos: MovimientoCobranza[],
): PorcentajeCobranzaCliente {
  const inicioAnio = rangoSemanaIso({ anio, semana: 1 }).desde;

  let saldoInicio = redondear(
    sumaAntesDe(ventas, inicioAnio) - sumaAntesDe(cobros, inicioAnio) + sumaAntesDe(cargos, inicioAnio),
  );

  const semanas: SemanaCobranza[] = [];
  const totalSemanas = ultimaSemanaIso(anio);
  for (let semana = 1; semana <= totalSemanas; semana++) {
    const { desde, hasta } = rangoSemanaIso({ anio, semana });
    const hastaInclusive = new Date(hasta.getTime() - 1);

    const vendido = redondear(sumaEnRango(ventas, desde, hasta));
    const cobradoBruto = sumaEnRango(cobros, desde, hasta);
    const cargoBruto = sumaEnRango(cargos, desde, hasta);
    const cobrado = redondear(cobradoBruto - cargoBruto);

    const porcentaje = saldoInicio > 0.01 ? cobrado / saldoInicio : null;
    const banda = calcularBandaCobranza(porcentaje);
    const remanente = redondear(saldoInicio - cobrado);

    semanas.push({
      anio,
      semana,
      fechaDesde: desde,
      fechaHasta: hastaInclusive,
      vendido,
      cobrado,
      saldoInicio,
      porcentaje,
      banda,
      remanente,
    });

    saldoInicio = redondear(saldoInicio + vendido - cobrado);
  }

  return { clienteId, semanas };
}
