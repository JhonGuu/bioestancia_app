import { z } from "zod";

import { RespaldoAsiento, TipoAsiento } from "@/modules/contabilidad/domain/asiento.types";
import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";

/** Espejo de `lineaAsiento` en `ContabilidadValidation` del backend. */
export const lineaAsientoSchema = z.object({
  cuentaId: z.string().min(1, "Elegí una cuenta"),
  debe: z.coerce.number().min(0, "No puede ser negativo").default(0),
  haber: z.coerce.number().min(0, "No puede ser negativo").default(0),
  detalle: z.string().max(255).optional().or(z.literal("")),
  auxiliarTipo: z.nativeEnum(TipoAuxiliar).optional(),
  auxiliarId: z.string().optional().or(z.literal("")),
  centroCostoId: z.string().optional().or(z.literal("")),
});
export type LineaAsientoFormValues = z.infer<typeof lineaAsientoSchema>;

/** Espejo de `crearAsiento`/`actualizarAsiento` en `ContabilidadValidation` del backend. */
export const asientoSchema = z.object({
  fecha: z.string().min(1, "Elegí una fecha"),
  descripcion: z.string().min(1, "Poné una descripción").max(255),
  tipo: z.nativeEnum(TipoAsiento).optional(),
  respaldo: z.nativeEnum(RespaldoAsiento).optional(),
  lineas: z.array(lineaAsientoSchema).min(2, "El asiento tiene que tener al menos dos líneas"),
});
export type AsientoFormValues = z.infer<typeof asientoSchema>;
