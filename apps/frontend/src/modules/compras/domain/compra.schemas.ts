import { z } from "zod";

import { CategoriaPorcino, EspecieAnimal, RazaPorcino } from "@/modules/compras/domain/compra.types";
import {
  DTE_MENSAJE_FORMATO,
  DTE_REGEX,
  REMITO_MENSAJE_FORMATO,
  REMITO_REGEX,
} from "@/modules/compras/domain/formato-documentos";

/**
 * Espejo de `CompraValidation.create` en el backend
 * (`apps/backend/src/modules/compras/infra/http/validation.ts`) — mismas
 * reglas, repetidas acá solo para dar feedback instantáneo en el form. El
 * backend vuelve a validar todo.
 *
 * `porcentajeDesbaste` queda como string (no `z.coerce.number()`) a
 * propósito: si se deja vacío tiene que viajar como "no mandado" para que el
 * backend use el default del proveedor — con coerce, `Number("")` da `0`,
 * un valor válido que pisaría ese default sin que el usuario lo haya tocado.
 */
const categoriaSchema = z.object({
  categoria: z.nativeEnum(CategoriaPorcino, { message: "Elegí una categoría" }),
  raza: z.nativeEnum(RazaPorcino).optional().or(z.literal("")),
  cabezas: z.coerce.number().int().positive("Tiene que ser mayor a 0"),
});

export const createCompraSchema = z.object({
  proveedorId: z.string().uuid("Elegí un proveedor"),
  numero: z.string().min(1, "Número requerido").max(50),
  especie: z.nativeEnum(EspecieAnimal, { message: "Elegí una especie" }),
  letra: z.string().min(1).max(5).optional().or(z.literal("")),
  fecha: z.string().min(1, "La fecha es obligatoria"),
  dte: z.string().min(1, "DTE requerido").regex(DTE_REGEX, DTE_MENSAJE_FORMATO),
  remito: z.string().min(1, "Remito requerido").regex(REMITO_REGEX, REMITO_MENSAJE_FORMATO),
  // $/kg en pie negociado con el proveedor para esta tropa — opcional.
  precioCompraKg: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) > 0), "Tiene que ser un número mayor a 0"),
  porcentajeDesbaste: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || (!isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100),
      "Tiene que ser un número entre 0 y 100",
    ),
  // Kg vivo de báscula de la tropa entera — no discriminado por categoría.
  pesoBruto: z.coerce.number().positive("Tiene que ser mayor a 0"),
  comentarios: z.string().max(255).optional().or(z.literal("")),
  categorias: z.array(categoriaSchema).min(1, "Agregá al menos una categoría"),
});

export type CreateCompraFormValues = z.infer<typeof createCompraSchema>;
export type CreateCompraCategoriaFormValues = z.infer<typeof categoriaSchema>;

/**
 * Edita una compra completa: proveedor, especie, datos generales y el
 * detalle de categorías/razas/cabezas. Espejo de `CompraValidation.update`
 * en el backend. `id` en cada línea de categoría es opcional: si viene,
 * actualiza esa línea existente; si no, se crea una nueva (ver
 * `syncForCompra` en el backend).
 */
const updateCategoriaSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  categoria: z.nativeEnum(CategoriaPorcino, { message: "Elegí una categoría" }),
  raza: z.nativeEnum(RazaPorcino).optional().or(z.literal("")),
  cabezas: z.coerce.number().int().positive("Tiene que ser mayor a 0"),
});

export const updateCompraSchema = z.object({
  proveedorId: z.string().uuid("Elegí un proveedor"),
  especie: z.nativeEnum(EspecieAnimal, { message: "Elegí una especie" }),
  numero: z.string().min(1, "Número requerido").max(50),
  letra: z.string().min(1).max(5).optional().or(z.literal("")),
  fecha: z.string().min(1, "La fecha es obligatoria"),
  dte: z.string().min(1, "DTE requerido").regex(DTE_REGEX, DTE_MENSAJE_FORMATO),
  remito: z.string().min(1, "Remito requerido").regex(REMITO_REGEX, REMITO_MENSAJE_FORMATO),
  precioCompraKg: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) > 0), "Tiene que ser un número mayor a 0"),
  porcentajeDesbaste: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || (!isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100),
      "Tiene que ser un número entre 0 y 100",
    ),
  pesoBruto: z.coerce.number().positive("Tiene que ser mayor a 0"),
  comentarios: z.string().max(255).optional().or(z.literal("")),
  categorias: z.array(updateCategoriaSchema).min(1, "Agregá al menos una categoría"),
});

export type UpdateCompraFormValues = z.infer<typeof updateCompraSchema>;
export type UpdateCompraCategoriaFormValues = z.infer<typeof updateCategoriaSchema>;
