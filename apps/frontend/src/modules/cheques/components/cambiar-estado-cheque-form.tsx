import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useActualizarEstadoCheque } from "@/modules/cheques/hooks/use-actualizar-estado-cheque";
import { EstadoCheque, ESTADO_CHEQUE_LABELS } from "@/modules/cheques/domain/cheque.types";
import type { Cheque } from "@/modules/cheques/domain/cheque.types";
import { ApiError } from "@/shared/api/api-response";

interface CambiarEstadoChequeFormProps {
  cheque: Cheque;
}

/** Cambia el estado del cheque — pide motivo obligatorio solo cuando el nuevo estado es RECHAZADO. */
export function CambiarEstadoChequeForm({ cheque }: CambiarEstadoChequeFormProps) {
  const [estado, setEstado] = useState<EstadoCheque>(cheque.estado);
  const [motivoRechazo, setMotivoRechazo] = useState(cheque.motivoRechazo ?? "");
  const actualizarEstado = useActualizarEstadoCheque();

  const huboCambio = estado !== cheque.estado;

  function handleSubmit() {
    if (estado === EstadoCheque.RECHAZADO && !motivoRechazo.trim()) {
      toast.error("Indicá el motivo del rechazo");
      return;
    }
    actualizarEstado.mutate(
      {
        id: cheque.id,
        estado,
        motivoRechazo: estado === EstadoCheque.RECHAZADO ? motivoRechazo.trim() : undefined,
      },
      {
        onSuccess: () => toast.success("Estado actualizado"),
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar el estado");
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Estado</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Estado actual</label>
          <Select value={estado} onValueChange={(v) => setEstado(v as EstadoCheque)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(EstadoCheque).map((valor) => (
                <SelectItem key={valor} value={valor}>
                  {ESTADO_CHEQUE_LABELS[valor]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {estado === EstadoCheque.RECHAZADO && (
          <div className="space-y-1">
            <label className="text-sm font-medium">Motivo del rechazo</label>
            <Textarea
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              rows={2}
              placeholder="Ej. Falta de fondos"
            />
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!huboCambio || actualizarEstado.isPending}
          className="w-fit"
        >
          {actualizarEstado.isPending ? "Guardando..." : "Guardar estado"}
        </Button>
      </CardContent>
    </Card>
  );
}
