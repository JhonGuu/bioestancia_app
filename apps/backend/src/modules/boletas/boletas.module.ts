import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { BoletaController } from "@/modules/boletas/infra/http/boleta.controller";
import { BoletaValidation } from "@/modules/boletas/infra/http/validation";
import { BoletaRepositoryDrizzle } from "@/modules/boletas/infra/repository/boleta.repository";
import { CreateBoleta } from "@/modules/boletas/use-cases/create-boleta.use-case";
import { ListBoletas } from "@/modules/boletas/use-cases/list-boletas.use-case";
import { GetBoleta } from "@/modules/boletas/use-cases/get-boleta.use-case";
import { ObtenerReporteDiarioData } from "@/modules/boletas/use-cases/obtener-reporte-diario-data.use-case";
import { GenerarBoletaPdf } from "@/modules/boletas/use-cases/generar-boleta-pdf.use-case";
import { GenerarReporteDiarioPdf } from "@/modules/boletas/use-cases/generar-reporte-diario-pdf.use-case";
import { GenerarReporteDiarioExcel } from "@/modules/boletas/use-cases/generar-reporte-diario-excel.use-case";
import { UpdateBoleta } from "@/modules/boletas/use-cases/update-boleta.use-case";
import { DeleteBoleta } from "@/modules/boletas/use-cases/delete-boleta.use-case";
import { PrevisualizarImportacionBoletas } from "@/modules/boletas/use-cases/importar/previsualizar-importacion-boletas.use-case";
import { ConfirmarImportacionBoletas } from "@/modules/boletas/use-cases/importar/confirmar-importacion-boletas.use-case";

/**
 * Depende de `ventas` (VentaRepository), `compras` (CompraRepository) y
 * `clientes` (ClienteFinalRepository) — `CreateBoleta` crea las ventas de los
 * ítems de la boleta en el mismo request y valida sus referencias (tropa,
 * destino de reventa). Debe registrarse DESPUÉS de los tres en `di.ts`
 * (`clientes` ya se registra primero por su cuenta, no hace falta reordenar).
 *
 * `DeleteBoleta` también depende de `CobroRepository` (re-ajusta aplicaciones
 * FIFO) — bindeado temprano en `di.ts`, ver comentario ahí.
 */
export function registerBoletasModule(container: Container): void {
  container.bind(DI_TYPES.BoletaValidation).to(BoletaValidation);
  container.bind(DI_TYPES.BoletaRepository).to(BoletaRepositoryDrizzle);
  container.bind(DI_TYPES.CreateBoleta).to(CreateBoleta);
  container.bind(DI_TYPES.ListBoletas).to(ListBoletas);
  container.bind(DI_TYPES.GetBoleta).to(GetBoleta);
  container.bind(DI_TYPES.ObtenerReporteDiarioData).to(ObtenerReporteDiarioData);
  container.bind(DI_TYPES.GenerarBoletaPdf).to(GenerarBoletaPdf);
  container.bind(DI_TYPES.GenerarReporteDiarioPdf).to(GenerarReporteDiarioPdf);
  container.bind(DI_TYPES.GenerarReporteDiarioExcel).to(GenerarReporteDiarioExcel);
  container.bind(DI_TYPES.UpdateBoleta).to(UpdateBoleta);
  container.bind(DI_TYPES.DeleteBoleta).to(DeleteBoleta);
  container.bind(DI_TYPES.PrevisualizarImportacionBoletas).to(PrevisualizarImportacionBoletas);
  container.bind(DI_TYPES.ConfirmarImportacionBoletas).to(ConfirmarImportacionBoletas);
  container.bind(DI_TYPES.BoletaController).to(BoletaController);
  container.get(DI_TYPES.BoletaController);
}
