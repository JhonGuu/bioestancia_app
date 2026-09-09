import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { CompraController } from "@/modules/compras/infra/http/compra.controller";
import { CompraValidation } from "@/modules/compras/infra/http/validation";
import { CompraRepositoryDrizzle } from "@/modules/compras/infra/repository/compra.repository";
import { CompraCategoriaRepositoryDrizzle } from "@/modules/compras/infra/repository/compra-categoria.repository";
import { CreateCompra } from "@/modules/compras/use-cases/create-compra.use-case";
import { ListCompras } from "@/modules/compras/use-cases/list-compras.use-case";
import { GetCompra } from "@/modules/compras/use-cases/get-compra.use-case";
import { UpdateCompra } from "@/modules/compras/use-cases/update-compra.use-case";
import { CerrarCompra } from "@/modules/compras/use-cases/cerrar-compra.use-case";
import { ReabrirCompra } from "@/modules/compras/use-cases/reabrir-compra.use-case";
import { ObtenerStockTropas } from "@/modules/compras/use-cases/obtener-stock-tropas.use-case";
import { PrevisualizarImportacionCompras } from "@/modules/compras/use-cases/importar/previsualizar-importacion-compras.use-case";
import { ConfirmarImportacionCompras } from "@/modules/compras/use-cases/importar/confirmar-importacion-compras.use-case";

/**
 * Solo bindea (no instancia nada eager) — `CompraController` inyecta, vía la
 * importación histórica, `ResultadoFaenaRepository`/`LiquidacionCompraRepository`/
 * `LiquidacionFaenaRepository`, que se bindean recién en `registerResultadoFaenaModule`/
 * `registerLiquidacionCompraModule`/`registerLiquidacionFaenaModule` — esos
 * tres van DESPUÉS de este módulo (dependen de `CompraRepository`, bindeado
 * acá). Por eso la activación del controller se separó en
 * `activateComprasController`, que `di.ts` llama recién después de los tres.
 */
export function registerComprasModule(container: Container): void {
  container.bind(DI_TYPES.CompraValidation).to(CompraValidation);
  container.bind(DI_TYPES.CompraRepository).to(CompraRepositoryDrizzle);
  container.bind(DI_TYPES.CompraCategoriaRepository).to(CompraCategoriaRepositoryDrizzle);
  container.bind(DI_TYPES.CreateCompra).to(CreateCompra);
  container.bind(DI_TYPES.ListCompras).to(ListCompras);
  container.bind(DI_TYPES.GetCompra).to(GetCompra);
  container.bind(DI_TYPES.UpdateCompra).to(UpdateCompra);
  container.bind(DI_TYPES.CerrarCompra).to(CerrarCompra);
  container.bind(DI_TYPES.ReabrirCompra).to(ReabrirCompra);
  container.bind(DI_TYPES.ObtenerStockTropas).to(ObtenerStockTropas);
  // Importación histórica (carga inicial de datos) — construye directo sobre
  // los repositorios de compras/resultado de faena/liquidaciones para no
  // disparar `GenerarAsientosAutomaticos` (ver el use-case de confirmación).
  container.bind(DI_TYPES.PrevisualizarImportacionCompras).to(PrevisualizarImportacionCompras);
  container.bind(DI_TYPES.ConfirmarImportacionCompras).to(ConfirmarImportacionCompras);
  container.bind(DI_TYPES.CompraController).to(CompraController);
}

/** Ver el comentario de `registerComprasModule` — llamar DESPUÉS de registrar resultado-faena/liquidacion-compra/liquidacion-faena. */
export function activateComprasController(container: Container): void {
  container.get(DI_TYPES.CompraController);
}
