import { useMutation, useQueryClient } from "@tanstack/react-query";

import { authApi } from "@/modules/auth/api/auth.api";

/**
 * Cambia la contraseña del usuario autenticado e invalida `/account/me` — así
 * `mustChangePassword` se refresca a `false` y `ForcedChangePasswordScreen`
 * deja paso al resto de la app automáticamente, sin recargar la página.
 */
export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}
