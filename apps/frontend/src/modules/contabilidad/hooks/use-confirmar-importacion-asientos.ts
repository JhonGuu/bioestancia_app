import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { importacionesApi } from "@/modules/contabilidad/api/importaciones.api";
import type { AsientoAImportar } from "@/modules/contabilidad/domain/importacion.types";

export function useConfirmarImportacionAsientos() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: ({ asientos, confirmar }: { asientos: AsientoAImportar[]; confirmar: boolean }) =>
      importacionesApi.confirmarAsientos(asientos, confirmar),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["contabilidad", "asientos", empresaActiva?.empresaId] });
    },
  });
}
