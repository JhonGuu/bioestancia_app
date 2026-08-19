import { injectable } from "inversify";
import { z } from "zod";

const categoriaBody = z.object({
  compraCategoriaId: z.string().uuid("compraCategoriaId inválido"),
  kgVivoFaena: z.coerce.number().positive("kgVivoFaena tiene que ser mayor a 0"),
  kgCarne: z.coerce.number().positive("kgCarne tiene que ser mayor a 0"),
  porcentajeMagro: z.coerce.number().min(0).max(100).optional(),
  destinoComercial: z.string().max(10).optional(),
  cuartosDelantero: z.coerce.number().int().min(0).optional(),
  cuartosTrasero: z.coerce.number().int().min(0).optional(),
  // Decomiso sanitario atribuido a ESTA categoría — el total del header se
  // calcula sumando estas líneas (ver create-resultado-faena.use-case.ts),
  // no se recibe por separado.
  comisosCabezas: z.coerce.number().int().min(0).optional(),
  comisosKg: z.coerce.number().min(0).optional(),
});

const createBody = z.object({
  frigorificoId: z.string().uuid("frigorificoId inválido").optional(),
  fechaFaena: z.coerce.date(),
  numero: z.string().max(50).optional(),
  numeroAutorizacion: z.string().max(50).optional(),
  comentarios: z.string().max(255).optional(),
  categorias: z.array(categoriaBody).min(1, "Tiene que venir al menos una categoría"),
});

@injectable()
export class ResultadoFaenaValidation {
  create = {
    params: z.object({ compraId: z.string().uuid("compraId inválido") }),
    body: createBody,
  };

  getByCompra = {
    params: z.object({ compraId: z.string().uuid("compraId inválido") }),
  };
}
