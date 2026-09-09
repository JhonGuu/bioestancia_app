import { GrupoTropas } from "@/modules/grupos-tropas/domain/grupo-tropas";

/**
 * Interface del repositorio de Grupos de tropas. Forma parte del DOMINIO.
 *
 * `empresaId` es obligatorio en `getById`/`list` — mismo patrón que
 * `CompraRepository`: un grupo siempre pertenece a una empresa.
 */
export interface GrupoTropasRepository {
  getById(id: string, empresaId: string): Promise<GrupoTropas | null>;

  list(empresaId: string): Promise<GrupoTropas[]>;

  create(input: CreateGrupoTropasInput): Promise<GrupoTropas>;

  /**
   * Cierra el grupo: guarda el resultado de la reconciliación agregada
   * (`use-cases/cerrar-grupo-tropas.use-case.ts` hace la validación de
   * cabezas — sumada sobre todas las tropas miembro — antes de llamar esto).
   */
  cerrar(id: string, empresaId: string, input: CerrarGrupoTropasData): Promise<GrupoTropas>;

  /**
   * Deshace el cierre del grupo: vuelve a `cerrado: false` y limpia
   * `fechaCierre`/`pesoFinalVentaTotal`/`rinde`/`alertaSuperavit`.
   */
  reabrir(id: string, empresaId: string): Promise<GrupoTropas>;
}

export interface CreateGrupoTropasInput {
  empresaId: string;
  nombre?: string;
  pesoBrutoTotal: number;
  pesoNetoTotal: number;
  comentarios?: string;
}

export interface CerrarGrupoTropasData {
  pesoFinalVentaTotal: number;
  rinde: number;
  alertaSuperavit: boolean;
  fechaCierre: Date;
}
