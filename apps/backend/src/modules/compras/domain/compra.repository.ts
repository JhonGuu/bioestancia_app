import { Compra } from "@/modules/compras/domain/compra";
import { EspecieAnimal } from "@/modules/compras/domain/especie-animal";

/**
 * Interface del repositorio de Compras. Forma parte del DOMINIO.
 *
 * `empresaId` es obligatorio en `getById` y `list` — mismo patrón que
 * `ClienteRepository`/`ProveedorRepository`: una compra siempre pertenece a
 * una empresa, y nunca se lee sin saber de cuál.
 */
export interface CompraRepository {
  getById(id: string, empresaId: string): Promise<Compra | null>;

  /** Lista las compras de una empresa puntual. */
  list(empresaId: string): Promise<Compra[]>;

  create(input: CreateCompraInput): Promise<Compra>;

  /**
   * Actualiza los campos escalares de una compra (proveedor, especie, datos
   * generales — no el detalle de categorías, eso lo maneja
   * `CompraCategoriaRepository.syncForCompra`). `use-cases/update-compra.use-case.ts`
   * bloquea esto si la compra ya está cerrada.
   */
  update(id: string, empresaId: string, input: UpdateCompraData): Promise<Compra>;

  /**
   * Cierra una compra: guarda el resultado de la reconciliación
   * (`use-cases/cerrar-compra.use-case.ts` hace la validación de cabezas
   * antes de llamar esto).
   */
  cerrar(id: string, empresaId: string, input: CerrarCompraData): Promise<Compra>;

  /**
   * Deshace el cierre de una compra: vuelve a `cerrada: false` y limpia
   * `fechaCierre`/`pesoFinalVenta`/`rinde` (se vuelven a calcular la próxima
   * vez que se cierre).
   */
  reabrir(id: string, empresaId: string): Promise<Compra>;
}

export interface CreateCompraInput {
  empresaId: string;
  proveedorId: string;
  numero: string;
  especie: EspecieAnimal;
  letra?: string;
  fecha: Date;
  dte: string;
  remito: string;
  /** $/kg en pie negociado para esta tropa — ver `domain/compra.ts`. */
  precioCompraKg?: number;
  /**
   * Siempre llega resuelto acá (nunca undefined) — el use-case decide el
   * valor final (propio o el default del proveedor) antes de llamar a `create`.
   */
  porcentajeDesbaste: number;
  /** Kg vivo de báscula de la tropa entera (sin discriminar por categoría). */
  pesoBruto: number;
  /**
   * Siempre llega resuelto acá (nunca undefined) — el use-case lo calcula
   * (`pesoBruto × (1 - porcentajeDesbaste/100)`) antes de llamar a `create`.
   */
  pesoNeto: number;
  comentarios?: string;
}

export interface CerrarCompraData {
  pesoFinalVenta: number;
  rinde: number;
  fechaCierre: Date;
}

export interface UpdateCompraData {
  proveedorId?: string;
  especie?: EspecieAnimal;
  numero?: string;
  letra?: string | null;
  fecha?: Date;
  dte?: string;
  remito?: string;
  precioCompraKg?: number | null;
  porcentajeDesbaste?: number;
  pesoBruto?: number;
  /** Siempre llega recalculado acá si `pesoBruto` o `porcentajeDesbaste` cambiaron. */
  pesoNeto?: number;
  comentarios?: string | null;
}
