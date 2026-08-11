import { injectable } from "inversify";
import { z } from "zod";

import { Rubro } from "@/modules/empresas/domain/empresa";

@injectable()
export class EmpresaValidation {
  create = {
    body: z.object({
      razonSocial: z.string().min(1, "Razón social requerida").max(255),
      cuit: z.string().max(20).optional(),
      telefono: z.string().max(50).optional(),
      direccion: z.string().max(255).optional(),
      rubro: z.nativeEnum(Rubro),
    }),
  };

  update = {
    params: z.object({ id: z.string().uuid("Id inválido") }),
    body: z.object({
      cuit: z.string().max(20).nullable().optional(),
      telefono: z.string().max(50).nullable().optional(),
      direccion: z.string().max(255).nullable().optional(),
    }),
  };
}
