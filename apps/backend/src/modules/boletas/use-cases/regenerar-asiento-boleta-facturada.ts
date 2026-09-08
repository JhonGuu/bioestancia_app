import { GenerarAsientosAutomaticos } from "@/modules/contabilidad/use-cases/generar-asientos-automaticos.use-case";
import { EventoAsiento } from "@/modules/contabilidad/domain/regla-asiento";
import { Venta } from "@/modules/ventas/domain/venta";
import { calcularMontoBoleta } from "@/modules/boletas/domain/calcular-monto-boleta";

export interface BoletaParaAsiento {
  boletaId: string;
  empresaId: string;
  clienteId: string;
  fecha: Date;
  /** `null` cuando el caller no tiene la boleta cargada (ej. `ventas` solo tiene `venta.boletaId`) — usa el id como texto. */
  numero: string | null;
}

/**
 * Dispara (de mejor esfuerzo, nunca bloquea) el motor de asientos
 * automáticos (fase 2) para el evento BOLETA_FACTURADA, a partir del estado
 * actual de las ventas de la boleta. Lo llaman los cuatro puntos que pueden
 * cambiar si una boleta está facturada y por cuánto:
 * `modules/ventas/use-cases/set-precio-venta.use-case.ts`,
 * `modules/ventas/use-cases/update-venta-item.use-case.ts`,
 * `modules/ventas/use-cases/delete-venta.use-case.ts` y
 * `modules/boletas/use-cases/delete-boleta.use-case.ts` (`SetPrecioVentasLote`
 * queda cubierto porque solo llama a `SetPrecioVenta` en loop).
 *
 * Si la boleta no está facturada todavía (alguna venta sin precio, o no
 * quedan ventas), `calcularMontoBoleta` ya devuelve `monto: 0` — el motor no
 * genera ninguna línea y, si había un asiento automático en borrador de una
 * facturación anterior, lo borra solo (ver `GenerarAsientosAutomaticos`).
 *
 * Devuelve la advertencia del motor (si la hay) para que el caller la loguee
 * — `GenerarAsientosAutomaticos.execute()` nunca tira, así que esto tampoco
 * interrumpe la operación de negocio que lo llama.
 */
export async function regenerarAsientoBoletaFacturada(
  generarAsientosAutomaticos: GenerarAsientosAutomaticos,
  boleta: BoletaParaAsiento,
  ventasBoleta: Venta[],
): Promise<string | undefined> {
  const { monto } = calcularMontoBoleta(ventasBoleta);
  const resultado = await generarAsientosAutomaticos.execute({
    empresaId: boleta.empresaId,
    evento: EventoAsiento.BOLETA_FACTURADA,
    origenId: boleta.boletaId,
    fecha: boleta.fecha,
    descripcion: `Boleta ${boleta.numero ?? boleta.boletaId}`,
    unidades: [{ monto, clienteId: boleta.clienteId }],
  });
  return resultado.advertencia;
}
