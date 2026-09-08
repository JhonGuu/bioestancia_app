import { useState } from "react";
import { Lock, LockOpen } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  EstadoEjercicio,
  EstadoPeriodo,
  MES_LABELS,
  type EjercicioConPeriodos,
  type Periodo,
} from "@/modules/contabilidad/domain/ejercicio.types";
import { useCambiarEstadoEjercicio } from "@/modules/contabilidad/hooks/use-cambiar-estado-ejercicio";
import { useCambiarEstadoPeriodo } from "@/modules/contabilidad/hooks/use-cambiar-estado-periodo";
import { ApiError } from "@/shared/api/api-response";

interface EjercicioCardProps {
  ejercicio: EjercicioConPeriodos;
  puedeCerrar: boolean;
}

/**
 * Cerrar un período congela sus asientos: es la única barrera dura del
 * sistema — el resto es editable. Cerrar el ejercicio cierra en cascada
 * todos sus períodos abiertos; reabrirlo NO reabre los períodos solo, para
 * que reabrir un mes puntual sea siempre una decisión consciente.
 */
export function EjercicioCard({ ejercicio, puedeCerrar }: EjercicioCardProps) {
  const abierto = ejercicio.estado === EstadoEjercicio.ABIERTO;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">
              {ejercicio.nombre} <span className="text-muted-foreground font-normal">— N° {ejercicio.numero}</span>
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              {new Date(ejercicio.fechaInicio).toLocaleDateString("es-AR", { timeZone: "UTC" })} al{" "}
              {new Date(ejercicio.fechaFin).toLocaleDateString("es-AR", { timeZone: "UTC" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={abierto ? "default" : "secondary"}>{abierto ? "Abierto" : "Cerrado"}</Badge>
            {puedeCerrar && <CambiarEstadoEjercicioDialog ejercicio={ejercicio} />}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {ejercicio.periodos.map((periodo) => (
            <PeriodoBadge key={periodo.id} periodo={periodo} puedeCerrar={puedeCerrar} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CambiarEstadoEjercicioDialog({ ejercicio }: { ejercicio: EjercicioConPeriodos }) {
  const [open, setOpen] = useState(false);
  const cambiarEstado = useCambiarEstadoEjercicio();
  const abierto = ejercicio.estado === EstadoEjercicio.ABIERTO;
  const nuevoEstado = abierto ? EstadoEjercicio.CERRADO : EstadoEjercicio.ABIERTO;

  function handleConfirmar() {
    cambiarEstado.mutate(
      { id: ejercicio.id, estado: nuevoEstado },
      {
        onSuccess: () => {
          toast.success(abierto ? "Ejercicio cerrado — se cerraron también sus períodos abiertos" : "Ejercicio reabierto");
          setOpen(false);
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : "No se pudo cambiar el estado del ejercicio");
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {abierto ? <Lock className="size-4" /> : <LockOpen className="size-4" />}
          {abierto ? "Cerrar ejercicio" : "Reabrir ejercicio"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{abierto ? "¿Cerrar el ejercicio?" : "¿Reabrir el ejercicio?"}</DialogTitle>
          <DialogDescription>
            {abierto
              ? "Se cierran también todos sus períodos que sigan abiertos — dejan de aceptar asientos nuevos hasta que se reabran."
              : "El ejercicio vuelve a estar abierto, pero sus períodos siguen cerrados hasta que los reabras uno por uno."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar} disabled={cambiarEstado.isPending}>
            {cambiarEstado.isPending ? "Guardando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PeriodoBadge({ periodo, puedeCerrar }: { periodo: Periodo; puedeCerrar: boolean }) {
  const [open, setOpen] = useState(false);
  const cambiarEstado = useCambiarEstadoPeriodo();
  const abierto = periodo.estado === EstadoPeriodo.ABIERTO;
  const nuevoEstado = abierto ? EstadoPeriodo.CERRADO : EstadoPeriodo.ABIERTO;
  const etiqueta = `${MES_LABELS[periodo.mes - 1]?.slice(0, 3)} ${String(periodo.anio).slice(2)}`;

  if (!puedeCerrar) {
    return (
      <Badge variant={abierto ? "outline" : "secondary"} className="font-normal">
        {etiqueta}
      </Badge>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "rounded-md border px-2 py-1 text-xs font-medium transition-colors",
            abierto ? "hover:bg-accent" : "bg-muted text-muted-foreground",
          )}
        >
          {etiqueta}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {abierto ? "¿Cerrar" : "¿Reabrir"} {MES_LABELS[periodo.mes - 1]} {periodo.anio}?
          </DialogTitle>
          <DialogDescription>
            {abierto
              ? "Deja de aceptar asientos nuevos o ediciones hasta que lo reabras — es la única barrera dura del sistema."
              : "Vuelve a aceptar asientos. El ejercicio tiene que estar abierto para poder reabrir un período."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() =>
              cambiarEstado.mutate(
                { id: periodo.id, estado: nuevoEstado },
                {
                  onSuccess: () => {
                    toast.success(abierto ? "Período cerrado" : "Período reabierto");
                    setOpen(false);
                  },
                  onError: (err) => {
                    toast.error(err instanceof ApiError ? err.message : "No se pudo cambiar el estado del período");
                  },
                },
              )
            }
            disabled={cambiarEstado.isPending}
          >
            {cambiarEstado.isPending ? "Guardando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
