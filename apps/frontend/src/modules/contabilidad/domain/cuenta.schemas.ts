import { z } from "zod";

import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import { TipoCuenta } from "@/modules/contabilidad/domain/tipo-cuenta";

/** Espejo de `ContabilidadValidation.crearCuenta` en el backend. */
export const cuentaSchema = z.object({
  codigo: z.string().min(1, "El código es obligatorio").max(20),
  nombre: z.string().min(1, "El nombre es obligatorio").max(150),
  tipo: z.nativeEnum(TipoCuenta, { message: "Elegí un tipo de cuenta" }),
  parentId: z.string().optional().or(z.literal("")),
  imputable: z.boolean(),
  monetaria: z.boolean(),
  requiereAuxiliar: z.nativeEnum(TipoAuxiliar),
});
export type CuentaFormValues = z.infer<typeof cuentaSchema>;
/**
 * Payload real que espera la API: `parentId` viaja como `null` para "sin padre"
 * (una cuenta raíz), mientras que en el form es `string | undefined` (RHF no
 * maneja bien `null` en un input controlado). Se separan los dos tipos acá.
 */
export type CuentaPayload = Omit<CuentaFormValues, "parentId"> & { parentId?: string | null };
