import { useMutation } from "@tanstack/react-query";

import { fichajesApi } from "@/modules/fichajes/api/fichajes.api";
import type {
  AliasDispositivoConfirmar,
  FilaFichajeConfirmar,
} from "@/modules/fichajes/domain/fichaje-import.types";

interface ConfirmarImportacionInput {
  filas: FilaFichajeConfirmar[];
  alias?: AliasDispositivoConfirmar[];
}

export function useConfirmarImportacionFichajes() {
  return useMutation({
    mutationFn: ({ filas, alias }: ConfirmarImportacionInput) =>
      fichajesApi.confirmarImportacion(filas, alias),
  });
}
