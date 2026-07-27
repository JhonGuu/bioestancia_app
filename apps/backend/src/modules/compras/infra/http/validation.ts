import { injectable } from "inversify";
import { z } from "zod";

import { EspecieAnimal } from "@/modules/compras/domain/especie-animal";

const categoriaBody = z.object({
  categoria: z.string().min(1).max(100),
  raza: z.string().max(100).optional(),
  cabezas: z.coerce.number().int().positive("cabezas tiene que ser mayor a 0"),
  pesoBruto: z.coerce.number().positive("pesoBruto tiene que ser mayor a 0"),
});

const createBody = z.object({
  proveedorId: z.string().uuid("proveedorId inválido"),
  numero: z.string().min(1).max(50),
  especie: z.nativeEnum(EspecieAnimal).default(EspecieAnimal.PORCINO),
  letra: z.string().min(1).max(5).optional(),
  fecha: z.coerce.date(),
  dte: z.string().min(1).max(50),
  remito: z.string().min(1).max(50),
  // Opcional: si no se manda, se usa el porcentajeDesbaste por defecto del proveedor.
  porcentajeDesbaste: z.coerce.number().min(0).max(100).optional(),
  comentarios: z.string().max(255).optional(),
  // El remito/DTE real ya viene separado por categoría/raza — al menos una línea.
  categorias: z.array(categoriaBody).min(1, "Tiene que venir al menos una categoría"),
});

@injectable()
export class CompraValidation {
  create = { body: createBody };

  getById = {
    params: z.object({
      id: z.string().uuid("Id inválido"),
    }),
  };

  cerrar = {
    params: z.object({
      id: z.string().uuid("Id inválido"),
    }),
  };
}
