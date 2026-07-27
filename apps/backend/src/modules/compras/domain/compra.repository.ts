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
   * Cierra una compra: guarda el resultado de la reconciliación
   * (`use-cases/cerrar-compra.use-case.ts` hace la validación de cabezas
   * antes de llamar esto).
   */
  cerrar(id: string, empresaId: string, input: CerrarCompraData): Promise<Compra>;
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
  /**
   * Siempre llega resuelto acá (nunca undefined) — el use-case decide el
   * valor final (propio o el default del proveedor) antes de llamar a `create`.
   */
  porcentajeDesbaste: number;
  comentarios?: string;
}

export interface CerrarCompraData {
  pesoFinalVenta: number;
  rinde: number;
  fechaCierre: Date;
}
