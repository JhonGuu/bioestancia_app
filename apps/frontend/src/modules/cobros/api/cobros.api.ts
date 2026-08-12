import { httpClient, unwrap } from "@/shared/api/http-client";
import type { CreateCobroFormValues } from "@/modules/cobros/domain/cobro.schemas";
import type { CobroConLineas } from "@/modules/cobros/domain/cobro.types";
import { esMedioPagoCheque } from "@/modules/cobros/domain/cobro.types";

export const cobrosApi = {
  list(clienteId?: string): Promise<CobroConLineas[]> {
    return unwrap(httpClient.get("/cobros", { params: clienteId ? { clienteId } : undefined }));
  },

  getById(id: string): Promise<CobroConLineas> {
    return unwrap(httpClient.get(`/cobros/${id}`));
  },

  /** Las líneas CHEQUE/ECHEQ solo mandan los campos de cheque (el resto se omite). */
  create(input: CreateCobroFormValues): Promise<CobroConLineas> {
    const payload = {
      clienteId: input.clienteId,
      fecha: input.fecha,
      comentarios: input.comentarios || undefined,
      lineas: input.lineas.map((linea) => ({
        medioPago: linea.medioPago,
        monto: linea.monto,
        ...(esMedioPagoCheque(linea.medioPago)
          ? {
              numeroCheque: linea.numeroCheque || undefined,
              bancoCheque: linea.bancoCheque || undefined,
              cuitLibradorCheque: linea.cuitLibradorCheque || undefined,
              titularCheque: linea.titularCheque || undefined,
              fechaEmisionCheque: linea.fechaEmisionCheque || undefined,
              fechaPagoCheque: linea.fechaPagoCheque || undefined,
            }
          : {}),
      })),
    };
    return unwrap(httpClient.post("/cobros", payload));
  },
};
