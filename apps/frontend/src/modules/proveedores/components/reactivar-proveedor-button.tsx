import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useReactivarProveedor } from "@/modules/proveedores/hooks/use-reactivar-proveedor";
import { ApiError } from "@/shared/api/api-response";

interface ReactivarProveedorButtonProps {
  proveedorId: string;
}

/** Deshace el soft-delete (ver `ProveedorRepository.reactivar`) — acción reversible, sin diálogo de confirmación. */
export function ReactivarProveedorButton({ proveedorId }: ReactivarProveedorButtonProps) {
  const reactivarProveedor = useReactivarProveedor();

  function handleReactivar() {
    reactivarProveedor.mutate(proveedorId, {
      onSuccess: () => {
        toast.success("Proveedor reactivado correctamente");
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo reactivar el proveedor");
      },
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      title="Reactivar proveedor"
      onClick={handleReactivar}
      disabled={reactivarProveedor.isPending}
    >
      <RotateCcw className="size-4" />
    </Button>
  );
}
