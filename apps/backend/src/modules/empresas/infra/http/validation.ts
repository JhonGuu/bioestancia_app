import { injectable } from "inversify";
import { z } from "zod";

import { Rubro } from "@/modules/empresas/domain/empresa";

@injectable()
export class EmpresaValidation {
  create = {
    body: z.object({
      razonSocial: z.string().min(1, "Razón social requerida").max(255),
      cuit: z.string().max(20).optional(),
      rubro: z.nativeEnum(Rubro),
    }),
  };
}
