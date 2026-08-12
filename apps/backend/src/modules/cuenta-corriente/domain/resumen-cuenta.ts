import { Cliente } from "@/modules/clientes/domain/cliente";
import { Empresa } from "@/modules/empresas/domain/empresa";
import { Boleta } from "@/modules/boletas/domain/boleta";
import { CargoCuentaCorriente } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente";
import { SaldoCliente } from "@/modules/cuenta-corriente/domain/saldo-cliente";
import { MovimientoCuentaCorriente } from "@/modules/cuenta-corriente/domain/movimiento-cuenta-corriente";

/**
 * Todo lo necesario para armar el "resumen de cuenta" que se le manda a un
 * cliente (PDF/Excel) — mismo dato que ya se ve en pantalla
 * (`GET /cuenta-corriente/:clienteId/saldo` + `/movimientos`), empaquetado
 * junto con `boletas`/`cargos` para que los generadores puedan mostrar el
 * número de boleta o el tipo de cargo de cada movimiento sin otra consulta.
 */
export interface ResumenCuentaData {
  cliente: Cliente;
  empresa: Empresa;
  saldo: SaldoCliente;
  /** Más reciente primero — mismo orden que devuelve `ObtenerMovimientosCuentaCorriente`. */
  movimientos: MovimientoCuentaCorriente[];
  boletas: Boleta[];
  cargos: CargoCuentaCorriente[];
  generadoEn: Date;
}
