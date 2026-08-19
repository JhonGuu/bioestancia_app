import { injectable } from "inversify";
import { z } from "zod";

import { TipoFichaje } from "@/modules/personal/domain/fichaje";

const manualBody = z.object({
  empleadoId: z.string().uuid(),
  momento: z.coerce.date(),
  tipo: z.nativeEnum(TipoFichaje),
});

const confirmarBody = z.object({
  filas: z
    .array(
      z.object({
        empleadoId: z.string().uuid(),
        momento: z.coerce.date(),
        tipo: z.nativeEnum(TipoFichaje),
      }),
    )
    .min(1, "No hay filas para importar"),
  alias: z
    .array(
      z.object({
        empleadoId: z.string().uuid(),
        nombreDispositivo: z.string().min(1).max(100),
      }),
    )
    .optional(),
});

@injectable()
export class FichajeValidation {
  /** El archivo se valida en el handler (multer + `Code.BAD_REQUEST` manual) — acá no hay body JSON. */
  previsualizar = {};
  confirmar = { body: confirmarBody };
  manual = { body: manualBody };
}
