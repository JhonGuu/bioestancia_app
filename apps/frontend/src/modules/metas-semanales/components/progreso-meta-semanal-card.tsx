import { CheckCircle2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { nombreCliente, type Cliente } from "@/modules/clientes/domain/cliente.types";
import type { ProgresoMetaSemanal } from "@/modules/metas-semanales/domain/progreso-meta-semanal.types";

interface ProgresoMetaSemanalCardProps {
  progreso: ProgresoMetaSemanal;
  cliente?: Cliente;
}

/** Una barra de progreso por cliente: cuántas cabezas lleva comprando esta semana ISO contra su meta. */
export function ProgresoMetaSemanalCard({ progreso, cliente }: ProgresoMetaSemanalCardProps) {
  const porcentaje = Math.min(100, Math.round((progreso.cabezasCompradas / progreso.metaCabezasSemanales) * 100));

  return (
    <Card
      className={cn(
        progreso.cumplida && "border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/15",
      )}
    >
      <CardContent className="flex flex-col gap-2 py-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">{cliente ? nombreCliente(cliente) : "Cliente"}</span>
          {progreso.cumplida && (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
              Meta cumplida
            </span>
          )}
        </div>

        <div className="bg-muted h-2.5 w-full overflow-hidden rounded-full">
          <div
            className={cn("h-full rounded-full transition-all", progreso.cumplida ? "bg-emerald-500" : "bg-primary")}
            style={{ width: `${porcentaje}%` }}
          />
        </div>

        <p className="text-muted-foreground text-xs">
          {progreso.cabezasCompradas} / {progreso.metaCabezasSemanales} cabezas — semana {progreso.semana} del{" "}
          {progreso.anio}
        </p>
      </CardContent>
    </Card>
  );
}
