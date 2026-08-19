import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { InformeCobranzasController } from "@/modules/informe-cobranzas/infra/http/informe-cobranzas.controller";
import { InformeCobranzasValidation } from "@/modules/informe-cobranzas/infra/http/validation";
import { ObtenerInformeCobranzas } from "@/modules/informe-cobranzas/use-cases/obtener-informe-cobranzas.use-case";
import { GenerarInformeCobranzasPdf } from "@/modules/informe-cobranzas/use-cases/generar-informe-cobranzas-pdf.use-case";
import { GenerarInformeCobranzasExcel } from "@/modules/informe-cobranzas/use-cases/generar-informe-cobranzas-excel.use-case";
import { InformeCobranzasPdfGenerator } from "@/shared/infra/documents/informe-cobranzas-pdf.generator";
import { InformeCobranzasExcelGenerator } from "@/shared/infra/documents/informe-cobranzas-excel.generator";

/**
 * No tiene tabla ni repositorio propio — es una capa de agregación pura
 * sobre `empresas`, `clientes`, `cobros` y `cheques` (ver
 * `ObtenerInformeCobranzas`). Debe registrarse DESPUÉS de los cuatro en
 * `di.ts`.
 */
export function registerInformeCobranzasModule(container: Container): void {
  container.bind(DI_TYPES.InformeCobranzasValidation).to(InformeCobranzasValidation);
  container.bind(DI_TYPES.InformeCobranzasPdfGenerator).to(InformeCobranzasPdfGenerator);
  container.bind(DI_TYPES.InformeCobranzasExcelGenerator).to(InformeCobranzasExcelGenerator);
  container.bind(DI_TYPES.ObtenerInformeCobranzas).to(ObtenerInformeCobranzas);
  container.bind(DI_TYPES.GenerarInformeCobranzasPdf).to(GenerarInformeCobranzasPdf);
  container.bind(DI_TYPES.GenerarInformeCobranzasExcel).to(GenerarInformeCobranzasExcel);
  container.bind(DI_TYPES.InformeCobranzasController).to(InformeCobranzasController);
  container.get(DI_TYPES.InformeCobranzasController);
}
