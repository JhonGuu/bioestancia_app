import { Badge } from "@/components/ui/badge";
import { estadoVencimiento, formatearFecha } from "@/modules/transportes/domain/documento-transporte";

/**
 * Fecha de vencimiento con su estado: en rojo si ya venció, en gris con
 * "por vencer" si vence dentro de los próximos 30 días. Sin fecha, un guion.
 */
export function VencimientoBadge({ fecha }: { fecha: string | null }) {
  if (!fecha) return <span className="text-muted-foreground">—</span>;
  const estado = estadoVencimiento(fecha);

  return (
    <span className="inline-flex items-center gap-2">
      {formatearFecha(fecha)}
      {estado === "vencido" && <Badge variant="destructive">Vencido</Badge>}
      {estado === "por_vencer" && <Badge variant="secondary">Por vencer</Badge>}
    </span>
  );
}
