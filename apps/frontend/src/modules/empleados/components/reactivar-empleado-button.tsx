import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useReactivarEmpleado } from "@/modules/empleados/hooks/use-reactivar-empleado";
import { ApiError } from "@/shared/api/api-response";

interface ReactivarEmpleadoButtonProps {
  empleadoId: string;
}

/** Deshace el soft-delete (ver `EmpleadoRepository.reactivar`) — acción reversible, sin diálogo de confirmación. */
export function ReactivarEmpleadoButton({ empleadoId }: ReactivarEmpleadoButtonProps) {
  const reactivarEmpleado = useReactivarEmpleado();

  function handleReactivar() {
    reactivarEmpleado.mutate(empleadoId, {
      onSuccess: () => {
        toast.success("Empleado reactivado correctamente");
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo reactivar el empleado");
      },
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      title="Reactivar empleado"
      onClick={handleReactivar}
      disabled={reactivarEmpleado.isPending}
    >
      <RotateCcw className="size-4" />
    </Button>
  );
}
