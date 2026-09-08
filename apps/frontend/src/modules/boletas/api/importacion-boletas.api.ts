import { httpClient, unwrap } from "@/shared/api/http-client";
import type {
  BoletaAImportar,
  PreviewImportacionBoletas,
  ResultadoImportacionBoletas,
} from "@/modules/boletas/domain/importacion-boletas.types";

function formDataConArchivo(archivo: File): FormData {
  const formData = new FormData();
  formData.append("archivo", archivo);
  return formData;
}

export const importacionBoletasApi = {
  previsualizar(archivo: File): Promise<PreviewImportacionBoletas> {
    return unwrap(
      httpClient.post("/boletas/importar/preview", formDataConArchivo(archivo), {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    );
  },

  confirmar(boletas: BoletaAImportar[]): Promise<ResultadoImportacionBoletas> {
    return unwrap(httpClient.post("/boletas/importar/confirmar", { boletas }));
  },
};
