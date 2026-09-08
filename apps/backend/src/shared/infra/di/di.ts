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
import { ResumenCuentaPdfGenerator } from "@/shared/infra/documents/resumen-cuenta-pdf.generator";
import { ResumenCuentaExcelGenerator } from "@/shared/infra/documents/resumen-cuenta-excel.generator";
import { LocalFileStorage } from "@/shared/infra/storage/local-file-storage";
import { registerEmpresasModule } from "@/modules/empresas/empresas.module";
import { registerUsersModule } from "@/modules/users/users.module";
import { registerListasPreciosModule } from "@/modules/listas-precios/listas-precios.module";
import { registerClientesModule } from "@/modules/clientes/clientes.module";
import { registerProveedoresModule } from "@/modules/proveedores/proveedores.module";
import { registerFrigorificosModule } from "@/modules/frigorificos/frigorificos.module";
import { registerBoletasModule } from "@/modules/boletas/boletas.module";
import { registerVentasModule } from "@/modules/ventas/ventas.module";
import { registerComprasModule } from "@/modules/compras/compras.module";
import { registerResultadoFaenaModule } from "@/modules/resultado-faena/resultado-faena.module";
import { registerLiquidacionCompraModule } from "@/modules/liquidacion-compra/liquidacion-compra.module";
import { registerLiquidacionFaenaModule } from "@/modules/liquidacion-faena/liquidacion-faena.module";
import { registerInformesComprasModule } from "@/modules/informes-compras/informes-compras.module";
import { registerPlanificacionCabezasModule } from "@/modules/planificacion-cabezas/planificacion-cabezas.module";
import { registerChequesModule } from "@/modules/cheques/cheques.module";
import { registerCargosCuentaCorrienteModule } from "@/modules/cargos-cuenta-corriente/cargos-cuenta-corriente.module";
import { registerCobrosModule } from "@/modules/cobros/cobros.module";
import { registerCuentaCorrienteModule } from "@/modules/cuenta-corriente/cuenta-corriente.module";
import { registerMetasSemanalesModule } from "@/modules/metas-semanales/metas-semanales.module";
import { registerPorcentajeCobranzaModule } from "@/modules/porcentaje-cobranza/porcentaje-cobranza.module";
import { registerPersonalModule } from "@/modules/personal/personal.module";
import { registerInformeCobranzasModule } from "@/modules/informe-cobranzas/informe-cobranzas.module";
import { registerCabezasModule } from "@/modules/cabezas/cabezas.module";
import { registerContabilidadModule } from "@/modules/contabilidad/contabilidad.module";
import { registerPermisosModule } from "@/modules/permisos/permisos.module";
import { CobroRepositoryDrizzle } from "@/modules/cobros/infra/repository/cobro.repository";
import { UsuarioEmpresaPermisoRepositoryDrizzle } from "@/modules/permisos/infra/repository/usuario-empresa-permiso.repository";

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
    // `UsuarioEmpresaPermisoRepository` se bindea ACÁ (suelto, antes de
    // `users`) por el mismo motivo que `CobroRepository` más abajo:
    // `UsersAuthProvider` (dentro de `users`) inyecta este repo para resolver
    // rol + permisos juntos en cada request, y `UserController` se instancia
    // eager al final de `registerUsersModule()` — si el repo no está bindeado
    // ANTES de esa línea, revienta con "No bindings found". Solo necesita
    // `DBConnection`, así que es seguro bindearlo acá.
    this.container.bind(DI_TYPES.UsuarioEmpresaPermisoRepository).to(UsuarioEmpresaPermisoRepositoryDrizzle);
    registerUsersModule(this.container);
    registerEmpresasModule(this.container);
    registerListasPreciosModule(this.container);
    registerClientesModule(this.container);
    registerProveedoresModule(this.container);
    // `frigorificos` no depende de otros módulos (solo DBConnection) — se
    // podría registrar en cualquier punto, va acá junto a los otros catálogos
    // porque `resultado-faena` (más abajo) referencia `frigorificoId`.
    registerFrigorificosModule(this.container);
    // `CobroRepository` se bindea ACÁ (suelto, antes de `cobros` como módulo
    // completo) porque `boletas`/`ventas` necesitan ajustar `AplicacionCobro`
    // cuando se edita/borra una venta o boleta ya cobrada (ver
    // `use-cases/ajustar-aplicaciones-boleta.ts` en `modules/cobros/domain`) —
    // sin este bind temprano, `registerCobrosModule()` (que va después de
    // `boletas`/`ventas` porque a su vez depende de sus repos) generaría una
    // dependencia circular en el orden de registro. `CobroRepositoryDrizzle`
    // solo necesita `DBConnection`, no otro repo — es seguro bindearlo acá.
    this.container.bind(DI_TYPES.CobroRepository).to(CobroRepositoryDrizzle);
    // `contabilidad` va acá (adelantado desde el final, fase 2): el motor de
    // asientos automáticos (`GenerarAsientosAutomaticos`) ahora lo inyectan
    // `ventas`, `compras`, `liquidacion-compra`, `liquidacion-faena`,
    // `boletas`, `cheques`, `cargos-cuenta-corriente` y `cobros` para
    // generar el asiento en el mismo request que crea/edita el documento de
    // origen — tiene que estar bindeado ANTES de que cualquiera de esos
    // módulos haga su `.get()` eager de controller. `contabilidad` en sí
    // solo depende de infra compartida (DBConnection + Logger), así que es
    // seguro adelantarlo acá.
    registerContabilidadModule(this.container);
    // `ventas` antes que `compras`: `CerrarCompra` (dentro de compras) inyecta
    // `VentaRepository` para reconciliar cabezas al cerrar una compra. Si
    // `compras` se registrara primero, su `.get()` eager fallaría con
    // "No bindings found for service VentaRepository".
    registerVentasModule(this.container);
    registerComprasModule(this.container);
    // `resultado-faena`, `liquidacion-compra` y `liquidacion-faena` inyectan
    // CompraRepository + CompraCategoriaRepository (bindeados en `compras`)
    // — van después. Los tres son independientes entre sí.
    registerResultadoFaenaModule(this.container);
    registerLiquidacionCompraModule(this.container);
    registerLiquidacionFaenaModule(this.container);
    // `boletas` inyecta VentaRepository (bindeado en `ventas`) y
    // CompraRepository (bindeado en `compras`) desde que `CreateBoleta`
    // puede crear las ventas de sus ítems en el mismo request — va después
    // de ambos.
    registerBoletasModule(this.container);
    // `informes-compras` compone CompraRepository + LiquidacionCompraRepository
    // + LiquidacionFaenaRepository + VentaRepository al vuelo (sin tabla
    // propia) — va después de que los cuatro ya estén bindeados.
    registerInformesComprasModule(this.container);
    // `planificacion-cabezas` inyecta ClienteRepository (bindeado en
    // `clientes`) y VentaRepository (bindeado en `ventas`) — va después de
    // ambos.
    registerPlanificacionCabezasModule(this.container);
    // `cheques` no depende de otros módulos (solo DBConnection) — se podría
    // registrar en cualquier punto, va acá porque `cobros` lo necesita.
    registerChequesModule(this.container);
    // `cargos-cuenta-corriente` inyecta ClienteRepository (bindeado en
    // `clientes`) y referencia la tabla `cheques` en su schema — va después
    // de `cheques`. `cobros` lo necesita para confirmar recargo/comisión.
    registerCargosCuentaCorrienteModule(this.container);
    // `cobros` inyecta ClienteRepository (bindeado en `clientes`),
    // BoletaRepository (bindeado en `boletas`), VentaRepository (bindeado en
    // `ventas`), ChequeRepository (bindeado en `cheques`), y
    // CargoCuentaCorrienteRepository (bindeado en `cargos-cuenta-corriente`,
    // ambos arriba) — va después de todos.
    registerCobrosModule(this.container);
    // `cuenta-corriente` no tiene repositorio propio — agrega clientes +
    // boletas + ventas + cobros + cargos al vuelo (ver `ObtenerSaldoCliente`)
    // — va después de todos.
    registerCuentaCorrienteModule(this.container);
    // `metas-semanales` no tiene repositorio propio — agrega clientes +
    // ventas al vuelo, mismo criterio que `cuenta-corriente` — va después de ambos.
    registerMetasSemanalesModule(this.container);
    // `porcentaje-cobranza` no tiene repositorio propio — agrega clientes +
    // boletas + ventas + cobros + cargos al vuelo, mismo criterio que
    // `cuenta-corriente` — va después de todos esos.
    registerPorcentajeCobranzaModule(this.container);
    // `personal` (Cargo/Empleado/HorarioEmpleado) no depende de otros
    // módulos de negocio (solo DBConnection + FileStorage, bindeado en
    // `registerSharedInfra`) — puede ir en cualquier punto.
    registerPersonalModule(this.container);
    // `informe-cobranzas` no tiene repositorio propio — agrega empresas +
    // clientes + cobros + cheques al vuelo, mismo criterio que
    // `cuenta-corriente` — va después de todos esos.
    registerInformeCobranzasModule(this.container);
    registerCabezasModule(this.container);
    // `permisos` inyecta UserRepository + UsuarioEmpresaRepository
    // (bindeados en `users`) para resolver el acceso al que cuelgan los
    // permisos — va después de `users`. No depende de ningún otro módulo.
    registerPermisosModule(this.container);
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
    this.container.bind(DI_TYPES.ResumenCuentaPdfGenerator).to(ResumenCuentaPdfGenerator);
    this.container.bind(DI_TYPES.ResumenCuentaExcelGenerator).to(ResumenCuentaExcelGenerator);

    // Almacenamiento de archivos subidos (ej. copia de DNI del legajo de
    // Empleado) — implementación en disco local, ver `LocalFileStorage`.
    this.container.bind(DI_TYPES.FileStorage).to(LocalFileStorage);
  }
}
