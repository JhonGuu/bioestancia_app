import { z } from "zod";

import { registry } from "@/shared/infra/openapi/registry";
import { apiResponseSchema, empresaIdHeaderSchema } from "@/shared/infra/openapi/common";

const rentabilidadTropaSchema = z.object({
  compraId: z.string().uuid(),
  numero: z.string(),
  letra: z.string().nullable(),
  fecha: z.string().datetime(),
  proveedorId: z.string().uuid(),
  cerrada: z.boolean(),
  costoCompra: z.number().nullable(),
  costoFaena: z.number().nullable(),
  costoTotal: z.number().nullable(),
  ingresoVenta: z.number(),
  ganancia: z.number().nullable(),
  rentabilidadPorcentaje: z.number().nullable(),
});

export function registerInformesComprasOpenApi(): void {
  registry.registerPath({
    method: "get",
    path: "/compras/informes/rentabilidad",
    tags: ["Informes de compras"],
    summary:
      "Rentabilidad de cada tropa: costo (liquidación de compra al proveedor + liquidación de " +
      "faena al frigorífico) vs. ingreso de venta de la carne. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema },
    responses: {
      200: {
        description: "OK",
        content: {
          "application/json": { schema: apiResponseSchema(z.array(rentabilidadTropaSchema)) },
        },
      },
      403: { description: "No sos admin/contable de la empresa activa" },
    },
  });
}
