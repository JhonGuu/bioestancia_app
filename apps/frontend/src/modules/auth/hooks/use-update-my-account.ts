import { useMutation, useQueryClient } from "@tanstack/react-query";

import { authApi } from "@/modules/auth/api/auth.api";

/**
 * Guarda los datos personales del usuario autenticado e invalida `/account/me`
 * para que el nombre del menú del sidebar y el resto de la app se refresquen.
 */
export function useUpdateMyAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.updateMyAccount,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}
