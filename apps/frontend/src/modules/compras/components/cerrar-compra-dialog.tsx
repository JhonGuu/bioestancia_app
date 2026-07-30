import * as React from "react";
import { useState } from "react";
import { Loader2 } from "lucide-react";
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
import { useCerrarCompra } from "@/modules/compras/hooks/use-cerrar-compra";
import { useCompra } from "@/modules/compras/hooks/use-compra";
import { totalCabezas } from "@/modules/compras/domain/compra.types";
import { ApiError } from "@/shared/api/api-response";

interface CerrarCompraDialogProps {
  compraId: string;
  /** Trigger custom (ej. un botón chico en una fila de tabla). Default: <Button>Cerrar compra</Button>. */
  trigger?: React.ReactNode;
}

/**
 * El cierre reconcilia cabezas vendidas (garrones distintos en `ventas`)
 * contra cabezas compradas — si no coinciden EXACTO, el backend rechaza el
 * cierre con un mensaje puntual. Ese mensaje se muestra inline en el diálogo
 * (no solo como toast) porque suele requerir ir a corregir una venta antes
 * de reintentar.
 *
 * Las cabezas compradas se traen recién al abrir el diálogo (`enabled:
 * open`) — así este componente sirve tanto en la página de detalle (que ya
 * tiene el detalle cargado) como en cada fila de la tabla de listado (que
 * NO trae categorías, para no hacer un N+1 al renderizar la lista entera).
 */
export function CerrarCompraDialog({ compraId, trigger }: CerrarCompraDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cerrarCompra = useCerrarCompra();
  const compraQuery = useCompra(compraId, { enabled: open });
  const cabezasCompradas = compraQuery.data ? totalCabezas(compraQuery.data.categorias) : null;

  function handleCerrar() {
    setError(null);
    cerrarCompra.mutate(compraId, {
      onSuccess: () => {
        toast.success("Compra cerrada correctamente");
        setOpen(false);
      },
      onError: (err) => {
        setError(err instanceof ApiError ? err.message : "No se pudo cerrar la compra");
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
      <DialogTrigger asChild>{trigger ?? <Button>Cerrar compra</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Cerrar esta compra?</DialogTitle>
          <DialogDescription>
            {compraQuery.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-3.5 animate-spin" />
                Calculando cabezas compradas...
              </span>
            ) : (
              <>
                Se van a reconciliar las {cabezasCompradas} cabezas compradas contra las cabezas
                efectivamente vendidas (garrones distintos en ventas) y, si coinciden, se calcula
                el rinde. Si no coinciden, el cierre se rechaza — revisá las ventas cargadas para
                esta compra antes de reintentar.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCerrar} disabled={cerrarCompra.isPending || compraQuery.isPending}>
            {cerrarCompra.isPending ? "Cerrando..." : "Confirmar cierre"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
