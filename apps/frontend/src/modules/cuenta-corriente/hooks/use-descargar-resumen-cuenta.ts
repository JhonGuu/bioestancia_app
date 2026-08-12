import { useMutation } from "@tanstack/react-query";

import { cuentaCorrienteApi } from "@/modules/cuenta-corriente/api/cuenta-corriente.api";
import { downloadBlob } from "@/shared/lib/download-blob";

/** Descarga el PDF del resumen de cuenta de un cliente. */
export function useDescargarResumenCuentaPdf() {
  return useMutation({
    mutationFn: (clienteId: string) => cuentaCorrienteApi.descargarResumenPdf(clienteId),
    onSuccess: ({ blob, filename }) => downloadBlob(blob, filename),
  });
}

/** Igual que `useDescargarResumenCuentaPdf`, pero exportando a Excel (.xlsx). */
export function useDescargarResumenCuentaExcel() {
  return useMutation({
    mutationFn: (clienteId: string) => cuentaCorrienteApi.descargarResumenExcel(clienteId),
    onSuccess: ({ blob, filename }) => downloadBlob(blob, filename),
  });
}
