import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fichajesApi } from "@/modules/fichajes/api/fichajes.api";
import type { TipoFichaje } from "@/modules/fichajes/domain/fichaje-import.types";

interface AgregarFichajeManualInput {
  empleadoId: string;
  momento: string;
  tipo: TipoFichaje;
}

export function useAgregarFichajeManual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ empleadoId, momento, tipo }: AgregarFichajeManualInput) =>
      fichajesApi.agregarManual(empleadoId, momento, tipo),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["jornadas", variables.empleadoId] });
    },
  });
}
