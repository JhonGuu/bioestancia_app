/**
 * Catálogo de permisos granulares del sistema. Sirve para autorización de
 * VISIBILIDAD (qué información sensible puede VER cada usuario) — una capa
 * ORTOGONAL al rol (`modules/users/domain/roles.ts`).
 *
 * Diferencia clave con el Rol:
 *   - El Rol gobierna qué ACCIONES puede hacer alguien (crear, editar,
 *     borrar) y tiene 4 valores fijos, poco frecuentes de cambiar.
 *   - El Permiso gobierna qué VISTAS/INFORMES sensibles puede VER — es
 *     100% explícito (ni siquiera el rol `admin` lo tiene por default) y el
 *     catálogo va a seguir creciendo a medida que se sumen pantallas nuevas.
 *
 * IMPORTANTE: al igual que el Rol, el Permiso es siempre relativo a una
 * empresa — vive en `usuario_empresa_permisos` (domain/usuario-empresa-permiso.repository.ts),
 * ligado a la fila de `usuario_empresas`, NO al usuario en abstracto. El mismo
 * usuario puede tener permisos distintos en cada empresa.
 *
 * Para sumar un permiso nuevo (ej. cuando se agregue una pantalla sensible):
 *   1. Agregá el valor acá.
 *   2. Sumalo a `infra/database/permiso-catalogo.ts` (metadata para la UI).
 *   3. NO hace falta migración: la columna `permiso` es `varchar`, no un
 *      enum de Postgres — así el catálogo escala sin tocar la base cada vez
 *      (ver nota en `infra/database/schema.ts`).
 *   4. Usalo en la ruta real: `permisos: [Permisos.TU_PERMISO_NUEVO]` en el
 *      `httpServer.register()` correspondiente.
 *
 * String-enum (no numérico) para que sea legible en la DB.
 */
export enum Permisos {
  /** Compras → Informes: costo vs. ingreso por tropa, márgenes, evolución de precios. */
  VER_RENTABILIDAD_COMPRAS = "ver_rentabilidad_compras",
  /** Saldos y movimientos de cuenta corriente de clientes. */
  VER_CUENTA_CORRIENTE = "ver_cuenta_corriente",
  /** Informe de cobranzas (Excel/PDF). */
  VER_INFORME_COBRANZAS = "ver_informe_cobranzas",
  /** Porcentaje de cobranza. */
  VER_PORCENTAJE_COBRANZA = "ver_porcentaje_cobranza",
  /** Cheques en cartera. */
  VER_CHEQUES = "ver_cheques",
  /** Listas de precios internas. */
  VER_LISTAS_PRECIOS = "ver_listas_precios",
  /** Liquidaciones (de compra y de faena) — una sola vista: quien ve una, ve la otra. */
  VER_LIQUIDACIONES = "ver_liquidaciones",
  /** Módulo contable completo: plan de cuentas, asientos, diario, mayores. */
  VER_CONTABILIDAD = "ver_contabilidad",
  /** Tocar la estructura contable: plan de cuentas, centros de costo, ejercicios. */
  ADMINISTRAR_PLAN_CUENTAS = "administrar_plan_cuentas",
  /** Cerrar y reabrir períodos/ejercicios — congela o libera asientos ya cargados. */
  CERRAR_PERIODOS = "cerrar_periodos",
  /** Configurar qué asientos se generan solos a partir de boletas, cobros, cheques, compras y liquidaciones. */
  ADMINISTRAR_REGLAS_ASIENTO = "administrar_reglas_asiento",
}
