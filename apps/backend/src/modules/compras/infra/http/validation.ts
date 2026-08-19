import { injectable } from "inversify";
import { z } from "zod";

import { EspecieAnimal } from "@/modules/compras/domain/especie-animal";
import { CategoriaPorcino } from "@/modules/compras/domain/categoria-porcino";
import { RazaPorcino } from "@/modules/compras/domain/raza-porcino";

// Espejo de `apps/frontend/src/modules/compras/domain/formato-documentos.ts`
// — DTE y remito identifican unívocamente la tropa comprada, así que se
// valida el formato exacto acá también (el frontend enmascara el input,
// pero el backend es la última línea de defensa).
const DTE_REGEX = /^\d{9}-\d$/;
const REMITO_REGEX = /^\d{4}-\d{6}$/;
const DTE_MENSAJE_FORMATO = "dte tiene que tener el formato 032369757-4";
const REMITO_MENSAJE_FORMATO = "remito tiene que tener el formato 0001-008226";

const categoriaBody = z.object({
  categoria: z.nativeEnum(CategoriaPorcino),
  raza: z.nativeEnum(RazaPorcino).optional(),
  cabezas: z.coerce.number().int().positive("cabezas tiene que ser mayor a 0"),
});

const createBody = z.object({
  proveedorId: z.string().uuid("proveedorId inválido"),
  numero: z.string().min(1).max(50),
  especie: z.nativeEnum(EspecieAnimal).default(EspecieAnimal.PORCINO),
  letra: z.string().min(1).max(5).optional(),
  fecha: z.coerce.date(),
  dte: z.string().regex(DTE_REGEX, DTE_MENSAJE_FORMATO),
  remito: z.string().regex(REMITO_REGEX, REMITO_MENSAJE_FORMATO),
  // $/kg en pie negociado con el proveedor para esta tropa (sin IVA) — opcional.
  precioCompraKg: z.coerce.number().positive("precioCompraKg tiene que ser mayor a 0").optional(),
  // Opcional: si no se manda, se usa el porcentajeDesbaste por defecto del proveedor.
  porcentajeDesbaste: z.coerce.number().min(0).max(100).optional(),
  // Kg vivo de báscula de la tropa entera — no discriminado por categoría.
  pesoBruto: z.coerce.number().positive("pesoBruto tiene que ser mayor a 0"),
  comentarios: z.string().max(255).optional(),
  // El remito/DTE real ya viene separado por categoría/raza — al menos una línea.
  categorias: z.array(categoriaBody).min(1, "Tiene que venir al menos una categoría"),
});

// Edita cualquier campo de la compra, incluido el detalle de categorías: si
// `categorias` viene, reemplaza (sincroniza) el detalle completo — las
// líneas con `id` se actualizan, las que ya no vienen se borran, y las que
// no traen `id` se crean.
const updateCategoriaBody = z.object({
  id: z.string().uuid("id de categoría inválido").optional(),
  categoria: z.nativeEnum(CategoriaPorcino),
  raza: z.nativeEnum(RazaPorcino).optional(),
  cabezas: z.coerce.number().int().positive("cabezas tiene que ser mayor a 0"),
});

const updateBody = z.object({
  proveedorId: z.string().uuid("proveedorId inválido").optional(),
  especie: z.nativeEnum(EspecieAnimal).optional(),
  numero: z.string().min(1).max(50).optional(),
  letra: z.string().min(1).max(5).optional(),
  fecha: z.coerce.date().optional(),
  dte: z.string().regex(DTE_REGEX, DTE_MENSAJE_FORMATO).optional(),
  remito: z.string().regex(REMITO_REGEX, REMITO_MENSAJE_FORMATO).optional(),
  // Nullable para poder borrar un precio ya cargado, no solo dejarlo vacío al no mandarlo.
  precioCompraKg: z.coerce.number().positive("precioCompraKg tiene que ser mayor a 0").nullable().optional(),
  porcentajeDesbaste: z.coerce.number().min(0).max(100).optional(),
  pesoBruto: z.coerce.number().positive("pesoBruto tiene que ser mayor a 0").optional(),
  comentarios: z.string().max(255).optional(),
  categorias: z.array(updateCategoriaBody).min(1, "Tiene que venir al menos una categoría").optional(),
});

@injectable()
export class CompraValidation {
  create = { body: createBody };

  getById = {
    params: z.object({
      id: z.string().uuid("Id inválido"),
    }),
  };

  update = {
    params: z.object({
      id: z.string().uuid("Id inválido"),
    }),
    body: updateBody,
  };

  cerrar = {
    params: z.object({
      id: z.string().uuid("Id inválido"),
    }),
  };

  reabrir = {
    params: z.object({
      id: z.string().uuid("Id inválido"),
    }),
  };
}
