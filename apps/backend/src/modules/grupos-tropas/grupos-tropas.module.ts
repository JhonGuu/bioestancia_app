import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { GrupoTropasController } from "@/modules/grupos-tropas/infra/http/grupo-tropas.controller";
import { GrupoTropasValidation } from "@/modules/grupos-tropas/infra/http/validation";
import { GrupoTropasRepositoryDrizzle } from "@/modules/grupos-tropas/infra/repository/grupo-tropas.repository";
import { CrearGrupoTropas } from "@/modules/grupos-tropas/use-cases/crear-grupo-tropas.use-case";
import { ListGruposTropas } from "@/modules/grupos-tropas/use-cases/list-grupos-tropas.use-case";
import { GetGrupoTropas } from "@/modules/grupos-tropas/use-cases/get-grupo-tropas.use-case";
import { CerrarGrupoTropas } from "@/modules/grupos-tropas/use-cases/cerrar-grupo-tropas.use-case";
import { ReabrirGrupoTropas } from "@/modules/grupos-tropas/use-cases/reabrir-grupo-tropas.use-case";

/**
 * Depende de `CompraRepository`/`CompraCategoriaRepository`/`UpdateCompra`
 * (módulo `compras`) y de `VentaRepository` (módulo `ventas`) — por eso se
 * registra DESPUÉS de `registerComprasModule` en `di.ts`. A su vez, `CerrarCompra`/
 * `ReabrirCompra` (del módulo `compras`) dependen de `GrupoTropasRepository`
 * (bindeado acá) — como `CompraController` recién se instancia en
 * `activateComprasController` (llamado DESPUÉS de este módulo en `di.ts`),
 * el orden cierra sin problema.
 */
export function registerGruposTropasModule(container: Container): void {
  container.bind(DI_TYPES.GrupoTropasValidation).to(GrupoTropasValidation);
  container.bind(DI_TYPES.GrupoTropasRepository).to(GrupoTropasRepositoryDrizzle);
  container.bind(DI_TYPES.CrearGrupoTropas).to(CrearGrupoTropas);
  container.bind(DI_TYPES.ListGruposTropas).to(ListGruposTropas);
  container.bind(DI_TYPES.GetGrupoTropas).to(GetGrupoTropas);
  container.bind(DI_TYPES.CerrarGrupoTropas).to(CerrarGrupoTropas);
  container.bind(DI_TYPES.ReabrirGrupoTropas).to(ReabrirGrupoTropas);
  container.bind(DI_TYPES.GrupoTropasController).to(GrupoTropasController);
  container.get(DI_TYPES.GrupoTropasController);
}
