import { useMutation } from "@tanstack/react-query";

import { informeCobranzasApi } from "@/modules/informe-cobranzas/api/informe-cobranzas.api";
import { downloadBlob } from "@/shared/lib/download-blob";
import type { FiltrosInformeCobranzas } from "@/modules/informe-cobranzas/domain/informe-cobranzas.types";

/** Descarga el PDF del informe de cobranzas con los filtros actuales. */
export function useDescargarInformeCobranzasPdf() {
  return useMutation({
    mutationFn: (filtros: FiltrosInformeCobranzas) => informeCobranzasApi.descargarPdf(filtros),
    onSuccess: ({ blob, filename }) => downloadBlob(blob, filename),
  });
}

/** Igual que `useDescargarInformeCobranzasPdf`, pero exportando a Excel (.xlsx). */
export function useDescargarInformeCobranzasExcel() {
  return useMutation({
    mutationFn: (filtros: FiltrosInformeCobranzas) => informeCobranzasApi.descargarExcel(filtros),
    onSuccess: ({ blob, filename }) => downloadBlob(blob, filename),
  });
}
