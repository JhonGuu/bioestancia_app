import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";

import { registry } from "@/shared/infra/openapi/registry";
import { registerUsersOpenApi } from "@/modules/users/infra/http/user.openapi";
import { registerEmpresasOpenApi } from "@/modules/empresas/infra/http/empresa.openapi";
import { registerListasDePreciosOpenApi } from "@/modules/listas-precios/infra/http/lista-de-precios.openapi";
import { registerClientesOpenApi } from "@/modules/clientes/infra/http/cliente.openapi";
import { registerProveedoresOpenApi } from "@/modules/proveedores/infra/http/proveedor.openapi";
import { registerFrigorificosOpenApi } from "@/modules/frigorificos/infra/http/frigorifico.openapi";
import { registerBoletasOpenApi } from "@/modules/boletas/infra/http/boleta.openapi";
import { registerVentasOpenApi } from "@/modules/ventas/infra/http/venta.openapi";
import { registerComprasOpenApi } from "@/modules/compras/infra/http/compra.openapi";
import { registerResultadoFaenaOpenApi } from "@/modules/resultado-faena/infra/http/resultado-faena.openapi";
import { registerLiquidacionCompraOpenApi } from "@/modules/liquidacion-compra/infra/http/liquidacion-compra.openapi";
import { registerLiquidacionFaenaOpenApi } from "@/modules/liquidacion-faena/infra/http/liquidacion-faena.openapi";
import { registerInformesComprasOpenApi } from "@/modules/informes-compras/infra/http/informes-compras.openapi";
import { registerPlanificacionCabezasOpenApi } from "@/modules/planificacion-cabezas/infra/http/planificacion-cabezas.openapi";
import { registerChequesOpenApi } from "@/modules/cheques/infra/http/cheque.openapi";
import { registerCargosCuentaCorrienteOpenApi } from "@/modules/cargos-cuenta-corriente/infra/http/cargo-cuenta-corriente.openapi";
import { registerCobrosOpenApi } from "@/modules/cobros/infra/http/cobro.openapi";
import { registerCuentaCorrienteOpenApi } from "@/modules/cuenta-corriente/infra/http/cuenta-corriente.openapi";
import { registerMetasSemanalesOpenApi } from "@/modules/metas-semanales/infra/http/metas-semanales.openapi";
import { registerPorcentajeCobranzaOpenApi } from "@/modules/porcentaje-cobranza/infra/http/porcentaje-cobranza.openapi";
import { registerPersonalOpenApi } from "@/modules/personal/infra/http/personal.openapi";
import { registerInformeCobranzasOpenApi } from "@/modules/informe-cobranzas/infra/http/informe-cobranzas.openapi";
import { registerCabezasOpenApi } from "@/modules/cabezas/infra/http/cabezas.openapi";

let pathsRegistered = false;

/**
 * Arma el documento OpenAPI 3.0 completo a partir de los paths que cada
 * módulo registra en `registry` (ver `<modulo>.openapi.ts`).
 *
 * Cuando agregues un módulo nuevo con endpoints (ej. ventas, sanidad),
 * sumá acá su `register<Modulo>OpenApi()`.
 */
export function generateOpenApiDocument() {
  if (!pathsRegistered) {
    registerUsersOpenApi();
    registerEmpresasOpenApi();
    registerListasDePreciosOpenApi();
    registerClientesOpenApi();
    registerProveedoresOpenApi();
    registerFrigorificosOpenApi();
    registerBoletasOpenApi();
    registerVentasOpenApi();
    registerComprasOpenApi();
    registerResultadoFaenaOpenApi();
    registerLiquidacionCompraOpenApi();
    registerLiquidacionFaenaOpenApi();
    registerInformesComprasOpenApi();
    registerPlanificacionCabezasOpenApi();
    registerChequesOpenApi();
    registerCargosCuentaCorrienteOpenApi();
    registerCobrosOpenApi();
    registerCuentaCorrienteOpenApi();
    registerMetasSemanalesOpenApi();
    registerPorcentajeCobranzaOpenApi();
    registerPersonalOpenApi();
    registerInformeCobranzasOpenApi();
    registerCabezasOpenApi();
    pathsRegistered = true;
  }

  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Bioestancia API",
      version: "1.0.0",
      description:
        "API del backend de Bioestancia (matadero/frigorífico) y El Meridiano (revendedora de medias reses). " +
        "Los endpoints de negocio requieren, además del JWT, el header `X-Empresa-Id` con la empresa activa " +
        "(validado contra `usuario_empresas`) — ver la sección 'Modelo multi-empresa' del README del backend.",
    },
    servers: [{ url: "/api" }],
  });
}
