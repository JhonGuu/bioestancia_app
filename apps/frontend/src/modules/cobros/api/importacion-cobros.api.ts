import { httpClient, unwrap } from "@/shared/api/http-client";
import type {
  CargoAImportar,
  CobroAImportar,
  PreviewImportacionCobros,
  ResultadoImportacionCobros,
} from "@/modules/cobros/domain/importacion-cobros.types";

function formDataConArchivo(archivo: File): FormData {
  const formData = new FormData();
  formData.append("archivo", archivo);
  return formData;
}

export const importacionCobrosApi = {
  previsualizar(archivo: File): Promise<PreviewImportacionCobros> {
    return unwrap(
      httpClient.post("/cobros/importar/preview", formDataConArchivo(archivo), {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    );
  },

  confirmar(cobros: CobroAImportar[], cargos: CargoAImportar[]): Promise<ResultadoImportacionCobros> {
    return unwrap(httpClient.post("/cobros/importar/confirmar", { cobros, cargos }));
  },
};
