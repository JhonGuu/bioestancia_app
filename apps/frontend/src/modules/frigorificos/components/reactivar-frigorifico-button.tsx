import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useReactivarFrigorifico } from "@/modules/frigorificos/hooks/use-reactivar-frigorifico";
import { ApiError } from "@/shared/api/api-response";

interface ReactivarFrigorificoButtonProps {
  frigorificoId: string;
}

/** Deshace el soft-delete (ver `FrigorificoRepository.reactivar`) — acción reversible, sin diálogo de confirmación. */
export function ReactivarFrigorificoButton({ frigorificoId }: ReactivarFrigorificoButtonProps) {
  const reactivarFrigorifico = useReactivarFrigorifico();

  function handleReactivar() {
    reactivarFrigorifico.mutate(frigorificoId, {
      onSuccess: () => {
        toast.success("Frigorífico reactivado correctamente");
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo reactivar el frigorífico");
      },
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      title="Reactivar frigorífico"
      onClick={handleReactivar}
      disabled={reactivarFrigorifico.isPending}
    >
      <RotateCcw className="size-4" />
    </Button>
  );
}
