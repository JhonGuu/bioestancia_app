import { Empresa } from "@/modules/empresas/domain/empresa";
import { DetalleLineaCobro } from "@/modules/cobros/domain/detalle-linea-cobro";
import { MedioPago } from "@/modules/cobros/domain/medio-pago";

/**
 * Una línea de cobro (transferencia, efectivo, cheque, etc.) de UN cliente
 * cualquiera de la empresa — el mismo dato que ya arma `construirDetalleLineas`
 * (ver `modules/cobros/domain/detalle-linea-cobro.ts`) para la cuenta
 * corriente de un cliente puntual, pero acá con el cliente identificado
 * (`clienteId`/`clienteNombre`) y la fecha del cobro, porque este informe
 * mezcla TODOS los clientes de la empresa en una sola línea de tiempo — es lo
 * que le permite a administración cruzar "todo lo que entró" contra lo que
 * efectivamente se depositó/acreditó, sin entrar cliente por cliente.
 */
export interface LineaInformeCobranza extends DetalleLineaCobro {
  cobroId: string;
  fecha: Date;
  clienteId: string;
  clienteNombre: string;
  comentarios: string | null;
}

/** Total y cantidad de líneas de un medio de pago puntual — para el resumen arriba del listado. */
export interface TotalPorMedioPago {
  medioPago: MedioPago;
  cantidad: number;
  total: number;
}

/**
 * El informe completo: línea de tiempo de TODAS las líneas de cobro de la
 * empresa en el rango pedido (o de siempre, si no se filtró), más viejo
 * primero, con los totales por medio de pago y el total general ya
 * calculados — pensado para controlar que "lo que se cobró" (transferencias,
 * efectivo, cheques) esté completo y coincida con lo depositado.
 */
export interface InformeCobranzas {
  empresa: Empresa;
  /** `null` si no se filtró ese extremo — ver `ObtenerInformeCobranzas`. */
  desde: Date | null;
  hasta: Date | null;
  /** `null` si no se filtró por medio de pago (se incluyen todos). */
  medioPagoFiltrado: MedioPago | null;
  lineas: LineaInformeCobranza[];
  totalesPorMedioPago: TotalPorMedioPago[];
  totalGeneral: number;
  generadoEn: Date;
}
