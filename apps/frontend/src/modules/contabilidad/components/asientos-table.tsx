import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ESTADO_ASIENTO_LABELS,
  EstadoAsiento,
  TIPO_ASIENTO_LABELS,
  TipoAsiento,
  calcularTotales,
  type Asiento,
} from "@/modules/contabilidad/domain/asiento.types";

export function AsientosTable({ asientos }: { asientos: Asiento[] }) {
  if (asientos.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No hay asientos que coincidan con estos filtros.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>N°</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead className="text-right">Debe</TableHead>
          <TableHead className="text-right">Haber</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {asientos.map((asiento) => {
          const totales = calcularTotales(asiento.lineas);
          return (
            <TableRow key={asiento.id} className="hover:bg-accent/50">
              <TableCell>
                <Link
                  to="/app/contabilidad/asientos/$asientoId"
                  params={{ asientoId: asiento.id }}
                  className="block font-medium hover:underline"
                >
                  {asiento.numero ?? "Borrador"}
                </Link>
              </TableCell>
              <TableCell>{new Date(asiento.fecha).toLocaleDateString("es-AR", { timeZone: "UTC" })}</TableCell>
              <TableCell className="max-w-64 truncate">{asiento.descripcion}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <span>{TIPO_ASIENTO_LABELS[asiento.tipo]}</span>
                  {asiento.tipo === TipoAsiento.AUTOMATICO && asiento.estado === EstadoAsiento.BORRADOR && (
                    <Badge
                      variant="outline"
                      className="border-amber-500 text-amber-700 dark:text-amber-400"
                      title="Generado automáticamente — todavía sin confirmar"
                    >
                      <AlertTriangle className="size-3" />
                      Revisar
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right font-mono text-xs">{totales.debe.toFixed(2)}</TableCell>
              <TableCell className="text-right font-mono text-xs">{totales.haber.toFixed(2)}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    asiento.estado === EstadoAsiento.CONFIRMADO
                      ? "default"
                      : asiento.estado === EstadoAsiento.ANULADO
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {ESTADO_ASIENTO_LABELS[asiento.estado]}
                </Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
