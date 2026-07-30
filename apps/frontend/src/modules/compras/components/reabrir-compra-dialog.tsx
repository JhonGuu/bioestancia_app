import * as React from "react";
import { useState } from "react";
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
import { useReabrirCompra } from "@/modules/compras/hooks/use-reabrir-compra";
import { ApiError } from "@/shared/api/api-response";

interface ReabrirCompraDialogProps {
  compraId: string;
  /** Trigger custom (ej. un botón chico en una fila de tabla). Default: <Button variant="outline">Reabrir compra</Button>. */
  trigger?: React.ReactNode;
}

/**
 * Deshace el cierre de una compra: vuelve a quedar "Abierta" y se pierden
 * `pesoFinalVenta`/`rinde` (se recalculan la próxima vez que se cierre). Se
 * usa para corregir algo (una venta, un dato general de la compra) sin tener
 * que borrar y recargar todo.
 */
export function ReabrirCompraDialog({ compraId, trigger }: ReabrirCompraDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reabrirCompra = useReabrirCompra();

  function handleReabrir() {
    setError(null);
    reabrirCompra.mutate(compraId, {
      onSuccess: () => {
        toast.success("Compra reabierta correctamente");
        setOpen(false);
      },
      onError: (err) => {
        setError(err instanceof ApiError ? err.message : "No se pudo reabrir la compra");
      },
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline">Reabrir compra</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Reabrir esta compra?</DialogTitle>
          <DialogDescription>
            Vuelve a quedar "Abierta" y se pierden el peso final de venta y el rinde calculados
            (se vuelven a calcular la próxima vez que la cierres). Usalo para corregir un dato
            general de la compra o una venta antes de volver a cerrarla.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleReabrir} disabled={reabrirCompra.isPending}>
            {reabrirCompra.isPending ? "Reabriendo..." : "Confirmar reapertura"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
