import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { importacionBoletasApi } from "@/modules/boletas/api/importacion-boletas.api";
import type { BoletaAImportar } from "@/modules/boletas/domain/importacion-boletas.types";

export function useConfirmarImportacionBoletas() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: (boletas: BoletaAImportar[]) => importacionBoletasApi.confirmar(boletas),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["boletas", empresaActiva?.empresaId] });
      void queryClient.invalidateQueries({ queryKey: ["clientes", empresaActiva?.empresaId] });
    },
  });
}
