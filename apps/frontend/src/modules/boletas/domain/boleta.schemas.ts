import { z } from "zod";

import { CategoriaPorcino } from "@/modules/compras/domain/compra.types";
import { FormaVenta } from "@/modules/ventas/domain/venta.types";

/**
 * Espejo de `BoletaValidation.create` en el backend
 * (`apps/backend/src/modules/boletas/infra/http/validation.ts`), pero
 * agrupado por tropa para la UI (`boleta-form.tsx`): una boleta puede tener
 * ítems de VARIAS tropas distintas al mismo cliente (ej. 10 animales de la
 * tropa 379-A + 20 de la 380-F) — el backend ya admite `compraId` por ítem,
 * acá solo se organiza la carga en una card por tropa. `boletas.api.ts`
 * aplana `tropas`+`novillo` al array `items` plano que espera el backend.
 */
const tropaItemSchema = z
  .object({
    formaVenta: z.enum([FormaVenta.CABEZA, FormaVenta.MEDIA_RES, FormaVenta.PULPA]),
    categoria: z.nativeEnum(CategoriaPorcino, { message: "Elegí una categoría" }),
    garron: z.string().optional().or(z.literal("")),
    kg: z.coerce.number().positive("Tiene que ser mayor a 0"),
  })
  .refine(
    (data) =>
      data.formaVenta === FormaVenta.PULPA ||
      (!!data.garron && !isNaN(Number(data.garron)) && Number(data.garron) > 0),
    { message: "Indicá el garrón", path: ["garron"] },
  );

const tropaGrupoSchema = z.object({
  compraId: z.string().uuid("Elegí una tropa"),
  items: z.array(tropaItemSchema).min(1, "Agregá al menos un ítem a esta tropa"),
});

/**
 * Reventa (Novillo, bovino) — sin tropa propia, por eso no tiene `compraId`.
 * `categoria` no hace falta pedirla: siempre es "Novillo" en este grupo (es
 * el único valor de `CategoriaReventa` hoy).
 */
const novilloItemSchema = z.object({
  formaVenta: z.enum([FormaVenta.CABEZA, FormaVenta.MEDIA_RES]),
  garron: z.string().optional().or(z.literal("")),
  /** Destino del catálogo de reventa del cliente (ver `categoria-venta.ts` y `cliente-final.types.ts`). */
  clienteFinalId: z.string().uuid().optional().or(z.literal("")),
  kg: z.coerce.number().positive("Tiene que ser mayor a 0"),
});

export const createBoletaSchema = z
  .object({
    clienteId: z.string().uuid("Elegí un cliente"),
    fecha: z.string().min(1, "La fecha es obligatoria"),
    numero: z.string().max(50).optional().or(z.literal("")),
    comentarios: z.string().max(255).optional().or(z.literal("")),
    tropas: z.array(tropaGrupoSchema),
    novillo: z.array(novilloItemSchema),
  })
  .refine((data) => data.tropas.some((t) => t.items.length > 0) || data.novillo.length > 0, {
    message: "Agregá al menos un ítem (de alguna tropa, o de Novillo)",
    path: ["tropas"],
  });

export type CreateBoletaFormValues = z.infer<typeof createBoletaSchema>;
export type TropaGrupoFormValues = z.infer<typeof tropaGrupoSchema>;
export type TropaItemFormValues = z.infer<typeof tropaItemSchema>;
export type NovilloItemFormValues = z.infer<typeof novilloItemSchema>;
