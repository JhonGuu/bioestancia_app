import { Venta } from "@/modules/ventas/domain/venta";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";
import { CategoriaVenta } from "@/modules/ventas/domain/categoria-venta";

/**
 * Interface del repositorio de Ventas. Forma parte del DOMINIO.
 *
 * `empresaId` obligatorio en `getById`/`list` — mismo patrón que el resto de
 * los repositorios (clientes, proveedores, compras): nunca se lee sin saber de
 * qué empresa.
 *
 * `total` NO viene en `CreateVentaInput`: se calcula en el use-case
 * (`kg * precioKg`) para no confiar en un total que mande el cliente HTTP.
 */
export interface VentaRepository {
  getById(id: string, empresaId: string): Promise<Venta | null>;

  /** Lista las ventas de una empresa puntual. */
  list(empresaId: string): Promise<Venta[]>;

  /**
   * Lista las ventas de una compra puntual (todas las formas, incluida
   * `compensacion_kg`) — la usa `CerrarCompra` para reconciliar cabezas y
   * sumar kg vendidos. El filtro de `formaVenta`/garrones distintos lo hace
   * el caller, no este método.
   */
  listByCompra(compraId: string, empresaId: string): Promise<Venta[]>;

  /** Lista los ítems (ventas) de una boleta puntual — la usa `GetBoleta`. */
  listByBoleta(boletaId: string, empresaId: string): Promise<Venta[]>;

  /** Lista TODAS las ventas de un cliente puntual (sin límite de fecha) — la usa `modules/cuenta-corriente`. */
  listByCliente(clienteId: string, empresaId: string): Promise<Venta[]>;

  /**
   * Lista las ventas de un cliente en un rango de fechas (inclusive) — la usa
   * `planificacion-cabezas` para cruzar lo planificado contra lo realmente
   * vendido. Mismo criterio que `listByCompra`: devuelve todo, el filtro de
   * `formaVenta`/garrones distintos lo hace el caller.
   */
  listByClienteYRango(clienteId: string, empresaId: string, desde: Date, hasta: Date): Promise<Venta[]>;

  /**
   * Lista las ventas de TODA la empresa en un rango de fechas (inclusive) —
   * la usa `planificacion-cabezas` para detectar entregas de clientes que no
   * tienen ningún día planificado en el rango (si solo mirara los clientes
   * con plan, esas entregas quedarían invisibles). Mismo criterio que
   * `listByClienteYRango`: devuelve todo, el filtro de `formaVenta`/garrones
   * distintos lo hace el caller.
   */
  listByEmpresaYRango(empresaId: string, desde: Date, hasta: Date): Promise<Venta[]>;

  create(input: CreateVentaInput): Promise<Venta>;

  /**
   * Completa `precioKg`/`total` de una venta que se cargó sin precio (ver
   * `use-cases/set-precio-venta.use-case.ts`). No toca ningún otro campo.
   */
  setPrecio(id: string, empresaId: string, input: SetPrecioInput): Promise<Venta>;

  /**
   * Corrige los campos de UNA línea (garrón/kg/categoría/comentarios) —
   * pensado para arreglar una carga mal hecha (ver
   * `use-cases/update-venta-item.use-case.ts`). No toca `precioKg` (eso lo
   * hace `setPrecio`, tarea de administración/contable, no del operario).
   * `total` SÍ se puede pisar acá — lo recalcula el use-case cuando cambia
   * `kg` y la venta ya tenía precio cargado.
   */
  update(id: string, empresaId: string, input: UpdateVentaItemInput): Promise<Venta>;

  /**
   * Soft-delete: marca `activo=false`, no borra la fila (mismo criterio que
   * `ClienteRepository.delete`) — así no se pierde el historial ni hay que
   * tocar `AplicacionCobro`/reportes que ya referencian esta venta. Tira
   * NOT_FOUND si no existe (o no es de esta empresa).
   */
  delete(id: string, empresaId: string): Promise<void>;
}

export interface CreateVentaInput {
  empresaId: string;
  clienteId: string;
  boletaId?: string | null;
  compraId?: string | null;
  garron?: number | null;
  formaVenta: FormaVenta;
  /** Null solo para `compensacion_kg`. Puede ser `CategoriaReventa.NOVILLO` (ver `categoria-venta.ts`). */
  categoria?: CategoriaVenta | null;
  kg: number;
  /**
   * Opcional: si no se manda (flujo del operario), la venta queda
   * "pendiente de precio" — `total` tampoco se calcula hasta que se cargue.
   */
  precioKg?: number;
  total?: number;
  fecha: Date;
  clienteFinalId?: string | null;
  comentarios?: string;
}

export interface SetPrecioInput {
  precioKg: number;
  total: number;
}

export interface UpdateVentaItemInput {
  garron?: number | null;
  kg?: number;
  categoria?: CategoriaVenta | null;
  comentarios?: string | null;
  /** Recalculado por el use-case si `kg` cambia y la venta ya tenía `precioKg`. */
  total?: number | null;
}
