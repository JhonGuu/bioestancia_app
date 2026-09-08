import { Permisos } from "@/modules/permisos/domain/permiso";

/**
 * Metadata de cada permiso para pintar la pantalla de administración
 * ("Permisos" en la ficha de usuario): agrupados por categoría, con
 * etiqueta y descripción en criollo para quien los tilda no tenga que
 * adivinar qué tapa cada código.
 *
 * `GetPermisosCatalogo` devuelve esto tal cual al frontend — así el
 * catálogo completo (código + categoría + etiqueta + descripción) vive en
 * un solo lugar y no hay que duplicarlo en el cliente.
 */
export interface PermisoCatalogoItem {
  codigo: Permisos;
  categoria: string;
  etiqueta: string;
  descripcion: string;
}

export const PERMISO_CATALOGO: PermisoCatalogoItem[] = [
  {
    codigo: Permisos.VER_RENTABILIDAD_COMPRAS,
    categoria: "Compras",
    etiqueta: "Rentabilidad de compras",
    descripcion: "Costo vs. ingreso por tropa, márgenes y evolución de precios (Compras → Informes).",
  },
  {
    codigo: Permisos.VER_LIQUIDACIONES,
    categoria: "Compras",
    etiqueta: "Liquidaciones (compra y faena)",
    descripcion: "Montos liquidados a proveedores y frigoríficos.",
  },
  {
    codigo: Permisos.VER_CUENTA_CORRIENTE,
    categoria: "Cobranzas",
    etiqueta: "Cuenta corriente de clientes",
    descripcion: "Saldos y movimientos de cuenta corriente.",
  },
  {
    codigo: Permisos.VER_INFORME_COBRANZAS,
    categoria: "Cobranzas",
    etiqueta: "Informe de cobranzas",
    descripcion: "Informe de cobranzas exportable (Excel/PDF).",
  },
  {
    codigo: Permisos.VER_PORCENTAJE_COBRANZA,
    categoria: "Cobranzas",
    etiqueta: "Porcentaje de cobranza",
    descripcion: "% de cobranza sobre lo facturado.",
  },
  {
    codigo: Permisos.VER_CHEQUES,
    categoria: "Cobranzas",
    etiqueta: "Cheques en cartera",
    descripcion: "Listado y estado de los cheques recibidos.",
  },
  {
    codigo: Permisos.VER_LISTAS_PRECIOS,
    categoria: "Ventas",
    etiqueta: "Listas de precios",
    descripcion: "Listas de precios internas de la empresa.",
  },
  {
    codigo: Permisos.VER_CONTABILIDAD,
    categoria: "Contabilidad",
    etiqueta: "Contabilidad",
    descripcion: "Plan de cuentas, asientos, libro diario y mayores. Es la información más sensible del sistema.",
  },
  {
    codigo: Permisos.ADMINISTRAR_PLAN_CUENTAS,
    categoria: "Contabilidad",
    etiqueta: "Administrar la estructura contable",
    descripcion: "Crear y modificar cuentas, centros de costo y ejercicios contables.",
  },
  {
    codigo: Permisos.CERRAR_PERIODOS,
    categoria: "Contabilidad",
    etiqueta: "Cerrar y reabrir períodos",
    descripcion: "Congelar un mes o un ejercicio entero, y volver a abrirlo.",
  },
  {
    codigo: Permisos.ADMINISTRAR_REGLAS_ASIENTO,
    categoria: "Contabilidad",
    etiqueta: "Configurar asientos automáticos",
    descripcion: "Crear y modificar las reglas que generan asientos automáticos a partir de boletas, cobros, cheques y compras.",
  },
];
