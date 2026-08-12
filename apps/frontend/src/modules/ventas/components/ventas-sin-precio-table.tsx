import { agruparVentasPendientesPorBoleta } from "@/modules/ventas/domain/agrupar-ventas-pendientes";
import { BoletaPendientePrecioCard } from "@/modules/ventas/components/boleta-pendiente-precio-card";
import type { Venta } from "@/modules/ventas/domain/venta.types";
import type { Boleta } from "@/modules/boletas/domain/boleta.types";
import type { Cliente } from "@/modules/clientes/domain/cliente.types";

interface BoletasPendientesPrecioProps {
  ventas: Venta[];
  clientes: Cliente[];
  boletas: Boleta[];
}

/**
 * Ventas cargadas por el operario (desde una boleta) que todavía no tienen
 * `precioKg`, agrupadas por boleta y, dentro de cada una, por categoría +
 * presentación — así administración/contable carga un precio por grupo
 * (`PATCH /ventas/precio-lote`) en vez de venta por venta, que con boletas
 * de muchos garrones se vuelve engorroso.
 */
export function BoletasPendientesPrecio({ ventas, clientes, boletas }: BoletasPendientesPrecioProps) {
  const grupos = agruparVentasPendientesPorBoleta(ventas, boletas, clientes);

  if (grupos.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No hay ventas pendientes de precio — todo está facturado.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {grupos.map((grupo) => (
        <BoletaPendientePrecioCard key={grupo.boletaId ?? `sin-boleta-${grupo.fecha}`} grupo={grupo} />
      ))}
    </div>
  );
}
