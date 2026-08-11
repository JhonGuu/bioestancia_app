import { httpClient, unwrap } from "@/shared/api/http-client";
import type { UpdateEmpresaFormValues } from "@/modules/empresas/domain/empresa.schemas";
import type { Empresa } from "@/modules/empresas/domain/empresa.types";

export const empresasApi = {
  /** Todas las empresas del sistema — solo admin (`GET /empresas` no tiene un `getById`, ver README). */
  list(): Promise<Empresa[]> {
    return unwrap(httpClient.get("/empresas"));
  },

  /**
   * A diferencia de clientes, acá SÍ mandamos `null` explícito (no omitimos
   * la clave) cuando el campo queda vacío: el backend distingue "no me
   * mandaste este campo, no lo toques" (`undefined`) de "quiero borrarlo"
   * (`null`) — ver `UpdateEmpresaInput` en el backend. Como el form siempre
   * manda los 3 campos, esto es lo correcto para poder limpiar un valor ya
   * cargado.
   */
  update(id: string, input: UpdateEmpresaFormValues): Promise<Empresa> {
    return unwrap(
      httpClient.patch(`/empresas/${id}`, {
        cuit: input.cuit || null,
        telefono: input.telefono || null,
        direccion: input.direccion || null,
      }),
    );
  },
};
