import { z } from "zod";

/**
 * Espejo de `ResultadoFaenaValidation.create` en el backend
 * (`apps/backend/src/modules/resultado-faena/infra/http/validation.ts`).
 *
 * Todos los numéricos quedan como `string` (no `z.coerce.number()`) — mismo
 * criterio que `precioCompraKg`/`porcentajeDesbaste` en `compra.schemas.ts`:
 * así un campo opcional sin tocar viaja como "" y no como un número inválido,
 * y el backend los vuelve a coercionar con su propio `z.coerce.number()`.
 */
const categoriaFaenaSchema = z.object({
  compraCategoriaId: z.string().uuid(),
  kgVivoFaena: z
    .string()
    .min(1, "Requerido")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Tiene que ser mayor a 0"),
  kgCarne: z
    .string()
    .min(1, "Requerido")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Tiene que ser mayor a 0"),
  porcentajeMagro: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || (!isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100),
      "Tiene que ser un número entre 0 y 100",
    ),
  destinoComercial: z.string().max(10).optional().or(z.literal("")),
  cuartosDelantero: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || (Number.isInteger(Number(v)) && Number(v) >= 0), "Tiene que ser un entero ≥ 0"),
  cuartosTrasero: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || (Number.isInteger(Number(v)) && Number(v) >= 0), "Tiene que ser un entero ≥ 0"),
  // Decomiso sanitario atribuido a ESTA categoría — el header ya no se carga
  // aparte, se calcula en el server sumando estas líneas (ver
  // create-resultado-faena.use-case.ts en el backend).
  comisosCabezas: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || (Number.isInteger(Number(v)) && Number(v) >= 0), "Tiene que ser un entero ≥ 0"),
  comisosKg: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0), "Tiene que ser ≥ 0"),
});

export const createResultadoFaenaSchema = z.object({
  frigorificoId: z.string().uuid().optional().or(z.literal("")),
  fechaFaena: z.string().min(1, "La fecha es obligatoria"),
  numero: z.string().max(50).optional().or(z.literal("")),
  numeroAutorizacion: z.string().max(50).optional().or(z.literal("")),
  comentarios: z.string().max(255).optional().or(z.literal("")),
  categorias: z.array(categoriaFaenaSchema).min(1, "La compra no tiene categorías cargadas"),
});

export type CreateResultadoFaenaFormValues = z.infer<typeof createResultadoFaenaSchema>;
export type CreateResultadoFaenaCategoriaFormValues = z.infer<typeof categoriaFaenaSchema>;
