import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useReactivarCargo } from "@/modules/cargos/hooks/use-reactivar-cargo";
import { ApiError } from "@/shared/api/api-response";

interface ReactivarCargoButtonProps {
  cargoId: string;
}

/** Deshace el soft-delete (ver `CargoRepository.reactivar`) — acción reversible, sin diálogo de confirmación. */
export function ReactivarCargoButton({ cargoId }: ReactivarCargoButtonProps) {
  const reactivarCargo = useReactivarCargo();

  function handleReactivar() {
    reactivarCargo.mutate(cargoId, {
      onSuccess: () => {
        toast.success("Cargo reactivado correctamente");
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo reactivar el cargo");
      },
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      title="Reactivar cargo"
      onClick={handleReactivar}
      disabled={reactivarCargo.isPending}
    >
      <RotateCcw className="size-4" />
    </Button>
  );
}
