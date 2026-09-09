import { httpClient, unwrap } from "@/shared/api/http-client";
import type {
  CompraAImportar,
  PreviewImportacionCompras,
  ResultadoImportacionCompras,
} from "@/modules/compras/domain/importacion-compras.types";

function formDataConArchivo(archivo: File): FormData {
  const formData = new FormData();
  formData.append("archivo", archivo);
  return formData;
}

export const importacionComprasApi = {
  previsualizar(archivo: File): Promise<PreviewImportacionCompras> {
    return unwrap(
      httpClient.post("/compras/importar/preview", formDataConArchivo(archivo), {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    );
  },

  confirmar(compras: CompraAImportar[]): Promise<ResultadoImportacionCompras> {
    return unwrap(httpClient.post("/compras/importar/confirmar", { compras }));
  },
};
