import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { importacionCobrosApi } from "@/modules/cobros/api/importacion-cobros.api";
import type { CargoAImportar, CobroAImportar } from "@/modules/cobros/domain/importacion-cobros.types";

export function useConfirmarImportacionCobros() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: ({ cobros, cargos }: { cobros: CobroAImportar[]; cargos: CargoAImportar[] }) =>
      importacionCobrosApi.confirmar(cobros, cargos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cobros", empresaActiva?.empresaId] });
      void queryClient.invalidateQueries({ queryKey: ["cargos-cuenta-corriente", empresaActiva?.empresaId] });
      void queryClient.invalidateQueries({ queryKey: ["clientes", empresaActiva?.empresaId] });
    },
  });
}
