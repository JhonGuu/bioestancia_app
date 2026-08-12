import type { Venta } from "@/modules/ventas/domain/venta.types";
import type { Boleta } from "@/modules/boletas/domain/boleta.types";
import type { Cliente } from "@/modules/clientes/domain/cliente.types";

/**
 * Un grupo de ventas pendientes de precio dentro de una boleta, agrupadas
 * por categoría + presentación — el precio se pacta así (ej. "Capón cabeza"
 * a un precio, "Chancha cabeza" a otro), no venta por venta. Se cargan
 * todas juntas con `PATCH /ventas/precio-lote`.
 */
export interface GrupoPrecioPendiente {
  clave: string;
  categoria: string | null;
  formaVenta: Venta["formaVenta"];
  ventas: Venta[];
  totalKg: number;
}

/** Todas las ventas pendientes de precio de UNA boleta (o sin boleta), agrupadas por categoría/presentación. */
export interface BoletaPendientePrecio {
  boletaId: string | null;
  boleta: Boleta | null;
  cliente: Cliente | null;
  /** Fecha de referencia para ordenar — la de la boleta, o la de la primera venta si no hay boleta. */
  fecha: string;
  grupos: GrupoPrecioPendiente[];
}

const SIN_BOLETA = "__sin_boleta__";

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Agrupa las ventas pendientes de precio (activas, `precioKg === null`) por
 * boleta y, dentro de cada boleta, por categoría+presentación — pensado
 * para que administración/contable cargue un precio por grupo en vez de
 * venta por venta (que con 10-15 garrones por boleta se vuelve engorroso).
 * Orden: boletas más viejas primero (las que antes hay que facturar).
 */
export function agruparVentasPendientesPorBoleta(
  ventas: Venta[],
  boletas: Boleta[],
  clientes: Cliente[],
): BoletaPendientePrecio[] {
  const boletasPorId = new Map(boletas.map((b) => [b.id, b]));
  const clientesPorId = new Map(clientes.map((c) => [c.id, c]));

  const pendientes = ventas.filter((v) => v.activo && v.precioKg === null);

  const porBoleta = new Map<string, Venta[]>();
  for (const venta of pendientes) {
    const clave = venta.boletaId ?? SIN_BOLETA;
    const arr = porBoleta.get(clave) ?? [];
    arr.push(venta);
    porBoleta.set(clave, arr);
  }

  const resultado: BoletaPendientePrecio[] = [];
  for (const [claveBoleta, ventasBoleta] of porBoleta) {
    const boletaId = claveBoleta === SIN_BOLETA ? null : claveBoleta;
    const boleta = boletaId ? (boletasPorId.get(boletaId) ?? null) : null;
    const clienteId = boleta?.clienteId ?? ventasBoleta[0]?.clienteId;
    const cliente = clienteId ? (clientesPorId.get(clienteId) ?? null) : null;

    const porGrupo = new Map<string, Venta[]>();
    for (const venta of ventasBoleta) {
      const clave = `${venta.categoria ?? "sin-categoria"}__${venta.formaVenta}`;
      const arr = porGrupo.get(clave) ?? [];
      arr.push(venta);
      porGrupo.set(clave, arr);
    }

    const grupos: GrupoPrecioPendiente[] = [...porGrupo.entries()].map(([clave, ventasGrupo]) => ({
      clave,
      categoria: ventasGrupo[0].categoria,
      formaVenta: ventasGrupo[0].formaVenta,
      ventas: ventasGrupo,
      totalKg: redondear(ventasGrupo.reduce((acc, v) => acc + v.kg, 0)),
    }));

    resultado.push({
      boletaId,
      boleta,
      cliente,
      fecha: boleta?.fecha ?? ventasBoleta[0].fecha,
      grupos,
    });
  }

  resultado.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  return resultado;
}
