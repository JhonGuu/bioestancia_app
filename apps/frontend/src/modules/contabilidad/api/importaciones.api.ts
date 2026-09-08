import { httpClient, unwrap } from "@/shared/api/http-client";
import { filenameFromContentDisposition } from "@/shared/lib/download-blob";
import type {
  AsientoAImportar,
  CuentaAImportar,
  PreviewImportacionAsientos,
  PreviewImportacionPlanCuentas,
  PreviewImportacionSaldosIniciales,
  ResultadoImportacionAsientos,
  ResultadoImportacionPlanCuentas,
  TipoPlantillaImportacion,
} from "@/modules/contabilidad/domain/importacion.types";

export interface ArchivoDescargado {
  blob: Blob;
  filename: string;
}

function formDataConArchivo(archivo: File): FormData {
  const formData = new FormData();
  formData.append("archivo", archivo);
  return formData;
}

export const importacionesApi = {
  async descargarPlantilla(tipo: TipoPlantillaImportacion): Promise<ArchivoDescargado> {
    const response = await httpClient.get(`/contabilidad/importar/${tipo}/plantilla`, { responseType: "blob" });
    return {
      blob: response.data,
      filename: filenameFromContentDisposition(response.headers, `plantilla-${tipo}.xlsx`),
    };
  },

  // ── Plan de cuentas ──────────────────────────────
  previsualizarPlanCuentas(archivo: File): Promise<PreviewImportacionPlanCuentas> {
    return unwrap(
      httpClient.post("/contabilidad/importar/plan-cuentas/preview", formDataConArchivo(archivo), {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    );
  },

  confirmarPlanCuentas(filas: CuentaAImportar[]): Promise<ResultadoImportacionPlanCuentas> {
    return unwrap(httpClient.post("/contabilidad/importar/plan-cuentas/confirmar", { filas }));
  },

  // ── Asientos ─────────────────────────────────────
  previsualizarAsientos(archivo: File): Promise<PreviewImportacionAsientos> {
    return unwrap(
      httpClient.post("/contabilidad/importar/asientos/preview", formDataConArchivo(archivo), {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    );
  },

  confirmarAsientos(asientos: AsientoAImportar[], confirmar: boolean): Promise<ResultadoImportacionAsientos> {
    return unwrap(httpClient.post("/contabilidad/importar/asientos/confirmar", { asientos, confirmar }));
  },

  // ── Saldos iniciales ─────────────────────────────
  previsualizarSaldosIniciales(archivo: File): Promise<PreviewImportacionSaldosIniciales> {
    return unwrap(
      httpClient.post("/contabilidad/importar/saldos-iniciales/preview", formDataConArchivo(archivo), {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    );
  },
};
