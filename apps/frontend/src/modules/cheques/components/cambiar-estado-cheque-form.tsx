import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useActualizarEstadoCheque } from "@/modules/cheques/hooks/use-actualizar-estado-cheque";
import { EstadoCheque, ESTADO_CHEQUE_LABELS } from "@/modules/cheques/domain/cheque.types";
import type { Cheque } from "@/modules/cheques/domain/cheque.types";
import { ApiError } from "@/shared/api/api-response";
import { hoyISO } from "@/shared/lib/date";

interface CambiarEstadoChequeFormProps {
  cheque: Cheque;
}

/**
 * Cambia el estado del cheque — pide motivo obligatorio solo cuando el nuevo
 * estado es RECHAZADO, y a quién/cuándo se endosó solo cuando es
 * ENDOSADO_A_TERCEROS.
 */
export function CambiarEstadoChequeForm({ cheque }: CambiarEstadoChequeFormProps) {
  const [estado, setEstado] = useState<EstadoCheque>(cheque.estado);
  const [motivoRechazo, setMotivoRechazo] = useState(cheque.motivoRechazo ?? "");
  const [endosadoA, setEndosadoA] = useState(cheque.endosadoA ?? "");
  const [fechaEndoso, setFechaEndoso] = useState(cheque.fechaEndoso?.slice(0, 10) ?? hoyISO());
  const actualizarEstado = useActualizarEstadoCheque();

  const huboCambio = estado !== cheque.estado;

  function handleSubmit() {
    if (estado === EstadoCheque.RECHAZADO && !motivoRechazo.trim()) {
      toast.error("Indicá el motivo del rechazo");
      return;
    }
    if (estado === EstadoCheque.ENDOSADO_A_TERCEROS && (!endosadoA.trim() || !fechaEndoso)) {
      toast.error("Indicá a quién y cuándo se endosó");
      return;
    }
    actualizarEstado.mutate(
      {
        id: cheque.id,
        estado,
        motivoRechazo: estado === EstadoCheque.RECHAZADO ? motivoRechazo.trim() : undefined,
        endosadoA: estado === EstadoCheque.ENDOSADO_A_TERCEROS ? endosadoA.trim() : undefined,
        fechaEndoso: estado === EstadoCheque.ENDOSADO_A_TERCEROS ? fechaEndoso : undefined,
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

        {estado === EstadoCheque.ENDOSADO_A_TERCEROS && (
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">Endosado a</label>
              <Input
                value={endosadoA}
                onChange={(e) => setEndosadoA(e.target.value)}
                placeholder="A quién se endosó"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Fecha de endoso</label>
              <Input type="date" value={fechaEndoso} onChange={(e) => setFechaEndoso(e.target.value)} />
            </div>
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
