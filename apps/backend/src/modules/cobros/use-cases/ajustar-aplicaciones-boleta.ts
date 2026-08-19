import { CobroRepository } from "@/modules/cobros/domain/cobro.repository";
import { calcularAjustesReversionBoleta } from "@/modules/cobros/domain/revertir-aplicaciones";

export interface AjustarAplicacionesBoletaInput {
  boletaId: string;
  clienteId: string;
  empresaId: string;
  /** Monto REAL de la boleta después de editarla o borrarla — `0` si se borró entera. */
  nuevoMontoMax: number;
}

/**
 * Función (no una clase inyectable — ver comentario en `di.ts` sobre por qué)
 * que usan `ventas`/`boletas` después de editar/borrar una venta o una
 * boleta entera: si lo que ya se había aplicado (FIFO) contra esa boleta
 * puntual quedó por encima de lo que la boleta realmente vale ahora, revierte
 * el exceso — la plata de más queda como saldo a favor del cliente.
 *
 * No hace nada (no llama al repositorio) si no hace falta ajustar nada.
 */
export async function ajustarAplicacionesBoleta(
  cobroRepository: CobroRepository,
  input: AjustarAplicacionesBoletaInput,
): Promise<void> {
  const aplicaciones = await cobroRepository.listAplicacionesByCliente(input.clienteId, input.empresaId);
  const deLaBoleta = aplicaciones.filter((a) => a.boletaId === input.boletaId);
  const ajustes = calcularAjustesReversionBoleta(deLaBoleta, input.nuevoMontoMax);
  if (ajustes.length > 0) {
    await cobroRepository.ajustarAplicaciones(ajustes);
  }
}
