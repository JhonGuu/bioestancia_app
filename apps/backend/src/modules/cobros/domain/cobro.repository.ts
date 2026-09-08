import { Cobro } from "@/modules/cobros/domain/cobro";
import { LineaCobro } from "@/modules/cobros/domain/linea-cobro";
import { AplicacionCobro, AplicacionCobroConCliente } from "@/modules/cobros/domain/aplicacion-cobro";
import { MedioPago } from "@/modules/cobros/domain/medio-pago";
import { PaginatedResult, PaginationQuery } from "@/shared/infra/http/pagination";

/** Cobro + sus líneas — lo que devuelven `getById`/`list`/`create`. */
export interface CobroConLineas extends Cobro {
  lineas: LineaCobro[];
}

/**
 * Interface del repositorio de Cobros. Forma parte del DOMINIO.
 *
 * `empresaId` obligatorio en todos los métodos — mismo motivo que el resto
 * de los repositorios.
 */
export interface CobroRepository {
  getById(id: string, empresaId: string): Promise<CobroConLineas | null>;

  /**
   * Lista los cobros de la empresa activa, opcionalmente filtrados por cliente.
   *
   * Sin `pagination`: devuelve TODO (comportamiento histórico) — la usan
   * `porcentaje-cobranza`, `informe-cobranzas` y `cuenta-corriente` (saldo y
   * movimientos), que agregan sobre el total. Con `pagination`: devuelve una
   * página (`{items, pagination}`) — la forma que tiene que usar cualquier
   * pantalla de listado nueva.
   */
  list(empresaId: string, clienteId?: string): Promise<CobroConLineas[]>;
  list(empresaId: string, clienteId: string | undefined, pagination: PaginationQuery): Promise<PaginatedResult<CobroConLineas>>;

  /** Crea el cobro y sus líneas juntos — las líneas de cheque ya vienen con `chequeId` resuelto. */
  create(input: CreateCobroInput): Promise<CobroConLineas>;

  /** Persiste el resultado del algoritmo FIFO (`AplicarCobroFifo`) para un cobro recién creado. */
  crearAplicaciones(input: CrearAplicacionInput[]): Promise<AplicacionCobro[]>;

  /** Todas las aplicaciones de cobros ACTIVOS de un cliente — insumo de `AplicarCobroFifo` y de la cuenta corriente. */
  listAplicacionesByCliente(clienteId: string, empresaId: string): Promise<AplicacionCobro[]>;

  /**
   * Todas las aplicaciones de cobros ACTIVOS de TODA la empresa (con el
   * `clienteId` de cada una, vía join) — insumo de `ObtenerSaldosClientes`
   * para calcular el saldo de todos los clientes sin hacer N consultas
   * (una por cliente).
   */
  listAplicacionesActivasByEmpresa(empresaId: string): Promise<AplicacionCobroConCliente[]>;

  /** El cobro (con sus líneas) que contiene la línea con este `chequeId` — o `null` si ninguna línea lo referencia. */
  getByChequeId(chequeId: string, empresaId: string): Promise<CobroConLineas | null>;

  /**
   * Ajusta el `monto` de varias `AplicacionCobro` ya existentes — se usa
   * para "revertir" (parcial o totalmente) lo aplicado por FIFO cuando un
   * cheque se rechaza (`ConfirmarRechazoCheque`). `nuevoMonto <= 0` borra la
   * fila en vez de dejarla en cero.
   */
  ajustarAplicaciones(ajustes: AjusteAplicacionInput[]): Promise<void>;
}

export interface CreateLineaCobroInput {
  medioPago: MedioPago;
  monto: number;
  chequeId: string | null;
  bancoOBilletera?: string | null;
  remitente?: string | null;
}

export interface CreateCobroInput {
  empresaId: string;
  clienteId: string;
  fecha: Date;
  comentarios?: string | null;
  lineas: CreateLineaCobroInput[];
}

export interface CrearAplicacionInput {
  cobroId: string;
  boletaId: string;
  monto: number;
}

export interface AjusteAplicacionInput {
  id: string;
  nuevoMonto: number;
}
