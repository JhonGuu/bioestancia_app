import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
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
import { useConfirmarAsiento } from "@/modules/contabilidad/hooks/use-confirmar-asiento";
import { ApiError } from "@/shared/api/api-response";

/** Pasa el borrador a firme y le asigna el número correlativo del ejercicio — recién ahí consume numeración. */
export function ConfirmarAsientoButton({ asientoId }: { asientoId: string }) {
  const [open, setOpen] = useState(false);
  const confirmar = useConfirmarAsiento();

  function handleConfirmar() {
    confirmar.mutate(asientoId, {
      onSuccess: (asiento) => {
        toast.success(`Asiento confirmado con el N° ${asiento.numero}`);
        setOpen(false);
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo confirmar el asiento");
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <CheckCircle2 />
          Confirmar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Confirmar este asiento?</DialogTitle>
          <DialogDescription>
            Pasa a firme y consume el próximo número correlativo del ejercicio. Se puede seguir editando
            mientras el período esté abierto.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar} disabled={confirmar.isPending}>
            {confirmar.isPending ? "Confirmando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
