import { UserCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useSetUsuarioActivo } from "@/modules/usuarios/hooks/use-set-usuario-activo";
import { ApiError } from "@/shared/api/api-response";

interface ActivarUsuarioButtonProps {
  usuarioId: string;
}

/** Reactiva un usuario desactivado — acción reversible, sin diálogo de confirmación (mismo criterio que Frigoríficos). */
export function ActivarUsuarioButton({ usuarioId }: ActivarUsuarioButtonProps) {
  const setActivo = useSetUsuarioActivo();

  function handleActivar() {
    setActivo.mutate(
      { usuarioId, isActive: true },
      {
        onSuccess: () => toast.success("Usuario activado correctamente"),
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : "No se pudo activar el usuario");
        },
      },
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      title="Activar usuario"
      onClick={handleActivar}
      disabled={setActivo.isPending}
    >
      <UserCheck className="size-4" />
    </Button>
  );
}
