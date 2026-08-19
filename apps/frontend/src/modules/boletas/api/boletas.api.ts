import { httpClient, unwrap } from "@/shared/api/http-client";
import { filenameFromContentDisposition } from "@/shared/lib/download-blob";
import type { CreateBoletaFormValues } from "@/modules/boletas/domain/boleta.schemas";
import type { Boleta, BoletaConVentas } from "@/modules/boletas/domain/boleta.types";
import { CategoriaReventa } from "@/modules/ventas/domain/categoria-venta";
import { FormaVenta } from "@/modules/ventas/domain/venta.types";

export interface ArchivoDescargado {
  blob: Blob;
  filename: string;
}

export const boletasApi = {
  list(): Promise<Boleta[]> {
    return unwrap(httpClient.get("/boletas"));
  },

  getById(id: string): Promise<BoletaConVentas> {
    return unwrap(httpClient.get(`/boletas/${id}`));
  },

  /** Aplana `tropas`/`novillo` (agrupados para la UI) al array `items` plano que espera el backend. */
  create(input: CreateBoletaFormValues): Promise<BoletaConVentas> {
    const itemsDeTropas = input.tropas.flatMap((tropa) =>
      tropa.items.map((item) => ({
        compraId: tropa.compraId,
        garron: item.garron ? Number(item.garron) : undefined,
        formaVenta: item.formaVenta,
        categoria: item.categoria,
        kg: item.kg,
      })),
    );
    const itemsDeNovillo = input.novillo.map((item) => ({
      garron: item.garron ? Number(item.garron) : undefined,
      formaVenta: item.formaVenta,
      categoria: CategoriaReventa.NOVILLO,
      clienteFinalId: item.clienteFinalId || undefined,
      kg: item.kg,
    }));
    // El operario tipea la magnitud en positivo (ver `CompensacionesCard`);
    // una compensación siempre resta, así que se manda ya en negativo acá —
    // un solo lugar que lo hace, no hay que confiar en que cada línea
    // individual tenga el signo correcto.
    const itemsDeCompensaciones = input.compensaciones.map((item) => ({
      formaVenta: FormaVenta.COMPENSACION_KG,
      kg: -Math.abs(item.kg),
      comentarios: item.comentarios || undefined,
    }));

    const payload = {
      clienteId: input.clienteId,
      fecha: input.fecha,
      numero: input.numero || undefined,
      comentarios: input.comentarios || undefined,
      items: [...itemsDeTropas, ...itemsDeNovillo, ...itemsDeCompensaciones],
    };
    return unwrap(httpClient.post("/boletas", payload));
  },

  /** PDF de una boleta puntual, con diseño tipo formulario de papel físico. */
  async descargarPdf(id: string): Promise<ArchivoDescargado> {
    const response = await httpClient.get(`/boletas/${id}/pdf`, { responseType: "blob" });
    return {
      blob: response.data,
      filename: filenameFromContentDisposition(response.headers, "boleta.pdf"),
    };
  },

  /** PDF con todas las boletas de la empresa en `fecha` (YYYY-MM-DD), agrupadas por cliente. */
  async descargarReporteDiarioPdf(fecha: string): Promise<ArchivoDescargado> {
    const response = await httpClient.get("/boletas/reporte-diario/pdf", {
      params: { fecha },
      responseType: "blob",
    });
    return {
      blob: response.data,
      filename: filenameFromContentDisposition(response.headers, `reporte-diario-${fecha}.pdf`),
    };
  },

  /** Igual que `descargarReporteDiarioPdf`, pero en Excel (.xlsx). */
  async descargarReporteDiarioExcel(fecha: string): Promise<ArchivoDescargado> {
    const response = await httpClient.get("/boletas/reporte-diario/excel", {
      params: { fecha },
      responseType: "blob",
    });
    return {
      blob: response.data,
      filename: filenameFromContentDisposition(response.headers, `reporte-diario-${fecha}.xlsx`),
    };
  },

  /** Corrige fecha/número/comentarios de una boleta ya cargada — para arreglar una carga mal hecha. */
  update(
    id: string,
    input: { fecha?: string; numero?: string | null; comentarios?: string | null },
  ): Promise<Boleta> {
    return unwrap(httpClient.patch(`/boletas/${id}`, input));
  },

  /** Borra (soft-delete) la boleta entera y sus ventas. */
  delete(id: string): Promise<void> {
    return unwrap(httpClient.delete(`/boletas/${id}`));
  },
};
