import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { importacionComprasApi } from "@/modules/compras/api/importacion-compras.api";
import type { CompraAImportar } from "@/modules/compras/domain/importacion-compras.types";

export function useConfirmarImportacionCompras() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: (compras: CompraAImportar[]) => importacionComprasApi.confirmar(compras),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["compras", empresaActiva?.empresaId] });
      void queryClient.invalidateQueries({ queryKey: ["proveedores", empresaActiva?.empresaId] });
      void queryClient.invalidateQueries({ queryKey: ["frigorificos", empresaActiva?.empresaId] });
    },
  });
}
