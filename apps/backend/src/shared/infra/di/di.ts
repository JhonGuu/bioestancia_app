import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { JsonWebTokenProvider } from "@/shared/infra/jwt/jwt-provider";
import { PinoLogger } from "@/shared/infra/logger/logger";
import { WsaaClient } from "@/shared/infra/afip/wsaa.client";
import { WslspClient } from "@/shared/infra/afip/wslsp.client";
import { BoletaPdfGenerator } from "@/shared/infra/documents/boleta-pdf.generator";
import { ReporteDiarioPdfGenerator } from "@/shared/infra/documents/reporte-diario-pdf.generator";
import { ReporteDiarioExcelGenerator } from "@/shared/infra/documents/reporte-diario-excel.generator";
import { registerEmpresasModule } from "@/modules/empresas/empresas.module";
import { registerUsersModule } from "@/modules/users/users.module";
import { registerListasPreciosModule } from "@/modules/listas-precios/listas-precios.module";
import { registerClientesModule } from "@/modules/clientes/clientes.module";
import { registerProveedoresModule } from "@/modules/proveedores/proveedores.module";
import { registerBoletasModule } from "@/modules/boletas/boletas.module";
import { registerVentasModule } from "@/modules/ventas/ventas.module";
import { registerComprasModule } from "@/modules/compras/compras.module";
import { registerResultadoFaenaModule } from "@/modules/resultado-faena/resultado-faena.module";
import { registerLiquidacionCompraModule } from "@/modules/liquidacion-compra/liquidacion-compra.module";
import { registerPlanificacionCabezasModule } from "@/modules/planificacion-cabezas/planificacion-cabezas.module";

/**
 * Contenedor central de inyección de dependencias.
 *
 * Patrón Singleton: una sola instancia para toda la app.
 * Se accede con `DI.getInstance().container`.
 *
 * Cada módulo de dominio tiene su propia función `register<Modulo>Module(container)`
 * que registra sus dependencias. Esas funciones se invocan acá en `init()`.
 */
export class DI {
  private static instance: DI | null = null;

  readonly container: Container;

  private constructor() {
    this.container = new Container({ defaultScope: "Singleton" });
    this.init();
  }

  static getInstance(): DI {
    if (!DI.instance) {
      DI.instance = new DI();
    }
    return DI.instance;
  }

  private init(): void {
    this.registerSharedInfra();

    // Módulos de dominio. ORDEN IMPORTANTE: `users` antes que `empresas`.
    // Cada `register<Modulo>Module()` hace `container.get(<Modulo>Controller)`
    // al final para instanciar el controller de forma eager (así registra sus
    // rutas ya). Ese controller inyecta `HttpServer` (ExpressAdapter), que a su
    // vez inyecta `AuthProvider` — y `AuthProvider` lo bindea `registerUsersModule`.
    // Si `empresas` se registrara primero, su `.get()` dispararía la construcción
    // de `HttpServer` ANTES de que `AuthProvider` esté bindeado → InversifyCoreError.
    //
    // (Esto es independiente de que `usuario_empresas`, dentro de `users`,
    // referencie la tabla `empresas` en su schema de Drizzle — eso es un import
    // de TS a nivel de módulo, no depende del orden de registro en el container).
    registerUsersModule(this.container);
    registerEmpresasModule(this.container);
    registerListasPreciosModule(this.container);
    registerClientesModule(this.container);
    registerProveedoresModule(this.container);
    // `ventas` antes que `compras`: `CerrarCompra` (dentro de compras) inyecta
    // `VentaRepository` para reconciliar cabezas al cerrar una compra. Si
    // `compras` se registrara primero, su `.get()` eager fallaría con
    // "No bindings found for service VentaRepository".
    registerVentasModule(this.container);
    registerComprasModule(this.container);
    // `resultado-faena` y `liquidacion-compra` inyectan CompraRepository +
    // CompraCategoriaRepository (bindeados en `compras`) — van después.
    registerResultadoFaenaModule(this.container);
    registerLiquidacionCompraModule(this.container);
    // `boletas` inyecta VentaRepository (bindeado en `ventas`) y
    // CompraRepository (bindeado en `compras`) desde que `CreateBoleta`
    // puede crear las ventas de sus ítems en el mismo request — va después
    // de ambos.
    registerBoletasModule(this.container);
    // `planificacion-cabezas` inyecta ClienteRepository (bindeado en
    // `clientes`) y VentaRepository (bindeado en `ventas`) — va después de
    // ambos.
    registerPlanificacionCabezasModule(this.container);
    // Cuando agregues un módulo nuevo (ej. granjas, sanidad, planificación):
    // registerNuevoModulo(this.container);
  }

  private registerSharedInfra(): void {
    // Logger primero (otras deps lo usan en su constructor)
    this.container.bind(DI_TYPES.Logger).to(PinoLogger);

    // JWT provider
    this.container.bind(DI_TYPES.JWTProvider).to(JsonWebTokenProvider);

    // DB connection (Drizzle + postgres-js)
    this.container.bind(DI_TYPES.DBConnection).to(DrizzleAdapter);

    // HTTP server (Express)
    this.container.bind(DI_TYPES.HttpServer).to(ExpressAdapter);

    // AFIP (WSAA + WSLSP) — ver shared/infra/afip/README.md. Se bindean
    // siempre (no rompen el boot sin certificado: los checks de
    // `Env.afipHabilitado` viven adentro, recién se disparan al llamar un
    // método real).
    this.container.bind(DI_TYPES.WsaaClient).to(WsaaClient);
    this.container.bind(DI_TYPES.WslspClient).to(WslspClient);

    // Generadores de documentos (PDF/Excel) — ver módulo boletas.
    this.container.bind(DI_TYPES.BoletaPdfGenerator).to(BoletaPdfGenerator);
    this.container.bind(DI_TYPES.ReporteDiarioPdfGenerator).to(ReporteDiarioPdfGenerator);
    this.container.bind(DI_TYPES.ReporteDiarioExcelGenerator).to(ReporteDiarioExcelGenerator);
  }
}
