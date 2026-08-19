import { injectable } from "inversify";
import { z } from "zod";

import { obtenerSemanaIso } from "@/shared/domain/semana-iso";

/** `anio`/`semana` opcionales en el query — si no vienen, el controller default a la semana ISO actual (ver `cabezas.controller.ts`). */
const filtrosQuery = z.object({
  anio: z.coerce.number().int().min(2000).max(2100).optional(),
  semana: z.coerce.number().int().min(1).max(53).optional(),
});

@injectable()
export class CabezasValidation {
  get = { query: filtrosQuery };
}

/** Semana ISO por defecto si no se manda `anio`/`semana` en el query — "esta semana". */
export function semanaPorDefecto(): { anio: number; semana: number } {
  return obtenerSemanaIso(new Date());
}
