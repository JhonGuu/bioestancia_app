import { useState } from "react";
import { Sprout } from "lucide-react";
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
import { useSembrarPlanCuentas } from "@/modules/contabilidad/hooks/use-sembrar-plan-cuentas";
import { ApiError } from "@/shared/api/api-response";

/**
 * Siembra el catálogo base (~90 cuentas estándar para una empresa comercial).
 * Nunca duplica ni pisa: si ya hay cuentas, solo completa las que falten del
 * catálogo — se puede apretar de nuevo sin miedo.
 */
export function SembrarPlanCuentasButton({ hayAlgunaCuenta }: { hayAlgunaCuenta: boolean }) {
  const [open, setOpen] = useState(false);
  const sembrar = useSembrarPlanCuentas();

  function handleConfirmar() {
    sembrar.mutate(true, {
      onSuccess: (resultado) => {
        toast.success(
          resultado.creadas > 0
            ? `Se agregaron ${resultado.creadas} cuentas del catálogo base`
            : "El plan ya tiene todas las cuentas del catálogo base",
        );
        setOpen(false);
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo sembrar el plan de cuentas");
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sprout />
          {hayAlgunaCuenta ? "Completar con catálogo base" : "Sembrar catálogo base"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sembrar catálogo base</DialogTitle>
          <DialogDescription>
            Carga el plan de cuentas estándar para una empresa comercial (~90 cuentas, jerárquico, con
            monetaria/no-monetaria y auxiliares ya clasificados). No duplica ni pisa cuentas existentes —
            si el plan ya tiene algunas, solo agrega las que falten. Después se puede editar y agregar
            cuentas libremente.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar} disabled={sembrar.isPending}>
            {sembrar.isPending ? "Sembrando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
