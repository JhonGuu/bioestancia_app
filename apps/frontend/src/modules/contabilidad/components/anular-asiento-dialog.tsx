import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Ban } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAnularAsiento } from "@/modules/contabilidad/hooks/use-anular-asiento";
import { EstadoAsiento } from "@/modules/contabilidad/domain/asiento.types";
import { ApiError } from "@/shared/api/api-response";

interface AnularAsientoDialogProps {
  asientoId: string;
  estado: EstadoAsiento;
}

/** Un borrador se borra directo; un confirmado se anula (mantiene su número, queda visible en el diario). */
export function AnularAsientoDialog({ asientoId, estado }: AnularAsientoDialogProps) {
  const [open, setOpen] = useState(false);
  const anular = useAnularAsiento();
  const navigate = useNavigate();
  const esBorrador = estado === EstadoAsiento.BORRADOR;

  function handleConfirmar() {
    anular.mutate(asientoId, {
      onSuccess: async (resultado) => {
        toast.success(resultado.mensaje);
        setOpen(false);
        await navigate({ to: "/app/contabilidad/asientos" });
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo anular el asiento");
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Ban />
          {esBorrador ? "Eliminar borrador" : "Anular"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{esBorrador ? "¿Eliminar este borrador?" : "¿Anular este asiento?"}</DialogTitle>
          <DialogDescription>
            {esBorrador
              ? "Nunca llegó a numerarse, así que se borra directo — no queda rastro en el diario."
              : "Mantiene su número y queda visible en el diario marcado como anulado, para que la numeración no tenga huecos."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirmar} disabled={anular.isPending}>
            {anular.isPending ? "Procesando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
