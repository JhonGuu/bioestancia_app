import { injectable } from "inversify";
import { z } from "zod";

import { optionalPaginationQuerySchema } from "@/shared/infra/http/pagination";
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

// ─────────────────── Importación de compras/tropas históricas ───────────────────
// A diferencia de `categoriaBody`/`createBody` (carga manual, hacia adelante),
// NO reusa `DTE_REGEX`/`REMITO_REGEX`: los datos históricos reales no
// respetan ese formato (ej. remitos "026-0293" en vez de "0026-000293") y la
// prioridad acá es fidelidad a lo que pasó, no formato de carga nueva — ver
// `previsualizar-importacion-compras.use-case.ts`.
const categoriaCompraAImportarBody = z.object({
  categoria: z.nativeEnum(CategoriaPorcino),
  cabezas: z.number().int().positive(),
});

const compraAImportarBody = z.object({
  fila: z.number().int().positive(),
  numero: z.string().min(1),
  proveedorNombre: z.string().min(1),
  proveedorId: z.string().uuid().nullable(),
  frigorificoNombre: z.string().min(1).nullable(),
  frigorificoId: z.string().uuid().nullable(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "fecha tiene que tener formato AAAA-MM-DD"),
  fechaFaena: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "fechaFaena tiene que tener formato AAAA-MM-DD"),
  dte: z.string().min(1),
  remito: z.string().min(1),
  precioCompraKg: z.number().positive(),
  pesoBruto: z.number().positive(),
  pesoNeto: z.number().positive(),
  porcentajeDesbaste: z.number().min(0).max(100),
  categorias: z.array(categoriaCompraAImportarBody).min(1),
  kgVivoTotalFaena: z.number().positive(),
  kgCarneTotalFaena: z.number().positive(),
  numeroComprobanteLiquidacion: z.string().min(1),
  porcentajeIvaLiquidacion: z.number().min(0).max(100),
  montoFaenaTotal: z.number().min(0),
  rentabilidadReferenciaExcel: z.string().nullable(),
});

const confirmarImportacionComprasBody = z.object({
  compras: z.array(compraAImportarBody),
});

@injectable()
export class CompraValidation {
  create = { body: createBody };

  previsualizarImportacion = {};

  confirmarImportacion = { body: confirmarImportacionComprasBody };

  /**
   * `page`/`limit` opcionales a propósito: sin ninguno de los dos, GET
   * /compras devuelve todo (compatibilidad con pantallas viejas que agregan
   * sobre el total). Pasando cualquiera de los dos, devuelve
   * `{items, pagination}`.
   */
  list = { query: optionalPaginationQuerySchema };

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
