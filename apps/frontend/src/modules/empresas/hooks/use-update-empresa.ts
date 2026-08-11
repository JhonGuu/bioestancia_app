import { useMutation, useQueryClient } from "@tanstack/react-query";

import { empresasApi } from "@/modules/empresas/api/empresas.api";
import type { UpdateEmpresaFormValues } from "@/modules/empresas/domain/empresa.schemas";

/** Edita cuit/teléfono/dirección de una empresa e invalida el listado. */
export function useUpdateEmpresa(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateEmpresaFormValues) => empresasApi.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["empresas"] });
    },
  });
}
