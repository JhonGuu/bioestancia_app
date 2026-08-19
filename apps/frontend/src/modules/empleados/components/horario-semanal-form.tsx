import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DIA_SEMANA_LABELS } from "@/modules/empleados/domain/empleado-enum-labels";
import { useHorariosEmpleado } from "@/modules/empleados/hooks/use-horarios-empleado";
import { useSetHorariosEmpleado } from "@/modules/empleados/hooks/use-set-horarios-empleado";
import { ApiError } from "@/shared/api/api-response";

interface FilaHorario {
  diaSemana: number;
  horaEntrada: string | null;
  horaSalida: string | null;
}

const DIAS_ORDENADOS = [1, 2, 3, 4, 5, 6, 0]; // lunes a domingo, más natural que empezar en domingo

function horariosVacios(): FilaHorario[] {
  return DIAS_ORDENADOS.map((diaSemana) => ({ diaSemana, horaEntrada: null, horaSalida: null }));
}

interface HorarioSemanalFormProps {
  empleadoId: string;
}

/**
 * Reemplazo completo (no hay CRUD por día — ver `HorarioEmpleadoRepository.setHorarios`
 * en el backend): se edita la grilla de los 7 días localmente y se manda todo
 * junto al guardar. Un día sin horario cargado (ambos campos vacíos) se
 * interpreta como franco.
 */
export function HorarioSemanalForm({ empleadoId }: HorarioSemanalFormProps) {
  const horariosQuery = useHorariosEmpleado(empleadoId);
  const setHorarios = useSetHorariosEmpleado(empleadoId);
  const [filas, setFilas] = useState<FilaHorario[]>(horariosVacios());

  useEffect(() => {
    if (!horariosQuery.data) return;
    const porDia = new Map(horariosQuery.data.map((h) => [h.diaSemana, h]));
    setFilas(
      DIAS_ORDENADOS.map((diaSemana) => {
        const existente = porDia.get(diaSemana);
        return {
          diaSemana,
          horaEntrada: existente?.horaEntrada ?? null,
          horaSalida: existente?.horaSalida ?? null,
        };
      }),
    );
  }, [horariosQuery.data]);

  function actualizarFila(diaSemana: number, campo: "horaEntrada" | "horaSalida", valor: string) {
    setFilas((prev) =>
      prev.map((fila) => (fila.diaSemana === diaSemana ? { ...fila, [campo]: valor || null } : fila)),
    );
  }

  function marcarFranco(diaSemana: number) {
    setFilas((prev) =>
      prev.map((fila) => (fila.diaSemana === diaSemana ? { ...fila, horaEntrada: null, horaSalida: null } : fila)),
    );
  }

  function handleGuardar() {
    setHorarios.mutate(filas, {
      onSuccess: () => toast.success("Horario actualizado correctamente"),
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo guardar el horario");
      },
    });
  }

  if (horariosQuery.isPending) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 py-6 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando horario...
      </div>
    );
  }

  if (horariosQuery.isError) {
    return <p className="text-destructive py-6 text-center text-sm">{horariosQuery.error.message}</p>;
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3">
        {filas.map((fila) => {
          const esFranco = !fila.horaEntrada && !fila.horaSalida;
          return (
            <div
              key={fila.diaSemana}
              className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[100px_1fr_1fr_auto] sm:items-center"
            >
              <span className="text-sm font-medium">{DIA_SEMANA_LABELS[fila.diaSemana]}</span>
              <div className="grid gap-1">
                <Label className="text-muted-foreground text-xs">Entrada</Label>
                <Input
                  type="time"
                  value={fila.horaEntrada ?? ""}
                  onChange={(e) => actualizarFila(fila.diaSemana, "horaEntrada", e.target.value)}
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-muted-foreground text-xs">Salida</Label>
                <Input
                  type="time"
                  value={fila.horaSalida ?? ""}
                  onChange={(e) => actualizarFila(fila.diaSemana, "horaSalida", e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant={esFranco ? "secondary" : "outline"}
                size="sm"
                onClick={() => marcarFranco(fila.diaSemana)}
                disabled={esFranco}
              >
                Marcar franco
              </Button>
            </div>
          );
        })}
      </div>

      <Button type="button" onClick={handleGuardar} disabled={setHorarios.isPending} className="w-fit">
        {setHorarios.isPending ? "Guardando..." : "Guardar horario"}
      </Button>
    </div>
  );
}
