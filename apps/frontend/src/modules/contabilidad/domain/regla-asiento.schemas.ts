import { z } from "zod";

/** Espejo de `lineaReglaAsiento` en `ContabilidadValidation` (backend). */
const lineaReglaAsientoSchema = z.object({
  lado: z.enum(["debe", "haber"]),
  cuentaId: z.string().uuid("Elegí una cuenta"),
  expresion: z.string().min(1, "Elegí qué importe usa esta línea"),
  auxiliarResolver: z.enum(["cliente", "proveedor", "frigorifico", "cheque"]).nullish(),
});

/**
 * Espejo de `crearReglaAsiento`/`actualizarReglaAsiento` en el backend.
 * `evento` va en el schema (no solo por fuera) para que el form lo maneje
 * como cualquier otro campo — igual que `tipo` en `asientoSchema` —, pero
 * queda deshabilitado en la UI una vez creada la regla (no es editable ahí).
 *
 * `medioPago` no existe en el backend: es un campo puramente de UI, solo
 * relevante cuando `evento === COBRO_REGISTRADO`, que el form-dialog arma
 * como `condicion: {medioPago: ...}` (o `null` si queda vacío) al enviar.
 */
export const reglaAsientoSchema = z.object({
  evento: z.string().min(1, "Elegí un evento"),
  nombre: z.string().min(1, "El nombre es obligatorio").max(150),
  activa: z.boolean(),
  prioridad: z.coerce.number().int(),
  medioPago: z.string().optional(),
  lineas: z.array(lineaReglaAsientoSchema).min(1, "La regla necesita al menos una línea"),
});
export type ReglaAsientoFormValues = z.infer<typeof reglaAsientoSchema>;
