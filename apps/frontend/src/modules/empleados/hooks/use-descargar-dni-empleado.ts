import { useMutation } from "@tanstack/react-query";

import { empleadosApi } from "@/modules/empleados/api/empleados.api";
import { downloadBlob } from "@/shared/lib/download-blob";

/** Descarga la copia digitalizada del DNI (PDF/JPG/PNG, según lo que se haya subido). */
export function useDescargarDniEmpleado() {
  return useMutation({
    mutationFn: (id: string) => empleadosApi.descargarDni(id),
    onSuccess: ({ blob, filename }) => downloadBlob(blob, filename),
  });
}
