import { injectable } from "inversify";
import { z } from "zod";

import { optionalPaginationQuerySchema } from "@/shared/infra/http/pagination";
import { MedioPago, esMedioPagoCheque } from "@/modules/cobros/domain/medio-pago";

const lineaBody = z
  .object({
    medioPago: z.nativeEnum(MedioPago),
    monto: z.coerce.number().positive("El monto tiene que ser mayor a 0"),
    // Solo obligatorios si medioPago es CHEQUE/ECHEQ — ver refine abajo.
    numeroCheque: z.string().max(50).optional(),
    bancoCheque: z.string().max(100).optional(),
    cuitLibradorCheque: z.string().max(20).optional(),
    titularCheque: z.string().max(150).optional(),
    fechaEmisionCheque: z.coerce.date().optional(),
    fechaPagoCheque: z.coerce.date().optional(),
    // Solo con TRANSFERENCIA_BANCO/BILLETERA_VIRTUAL — texto libre, no obligatorios.
    bancoOBilletera: z.string().max(100).optional(),
    remitente: z.string().max(150).optional(),
  })
  .refine(
    (data) =>
      !esMedioPagoCheque(data.medioPago) ||
      (data.numeroCheque && data.bancoCheque && data.fechaEmisionCheque && data.fechaPagoCheque),
    {
      message: "Faltan datos del cheque (número, banco, fecha de emisión y fecha de pago)",
      path: ["numeroCheque"],
    },
  );

const createBody = z.object({
  clienteId: z.string().uuid("clienteId inválido"),
  fecha: z.coerce.date(),
  comentarios: z.string().max(255).optional(),
  lineas: z.array(lineaBody).min(1, "El cobro necesita al menos una línea"),
});

// `page`/`limit` opcionales a propósito, igual que en el resto de los
// módulos: sin ninguno de los dos, GET /cobros devuelve todo (compatibilidad
// con pantallas viejas que agregan sobre el total). Pasando cualquiera de
// los dos, devuelve `{items, pagination}` (respetando `clienteId` si vino).
const listQuery = z.object({
  clienteId: z.string().uuid().optional(),
  ...optionalPaginationQuerySchema.shape,
});

const idParams = z.object({
  id: z.string().uuid("Id inválido"),
});

const chequeIdParams = z.object({
  chequeId: z.string().uuid("chequeId inválido"),
});

const confirmarRecargoBody = z.object({
  monto: z.coerce.number().positive("El monto tiene que ser mayor a 0").optional(),
});

const confirmarRechazoBody = z.object({
  comision: z.coerce.number().min(0, "El monto no puede ser negativo").optional(),
  /** El cliente canceló el cheque el mismo día — omite la comisión aunque `comision` no venga. */
  sinComision: z.coerce.boolean().optional(),
});

@injectable()
export class CobroValidation {
  create = { body: createBody };

  list = { query: listQuery };

  getById = { params: idParams };

  sugerenciaRecargoCheque = { params: chequeIdParams };

  confirmarRecargoCheque = { params: chequeIdParams, body: confirmarRecargoBody };

  sugerenciaRechazoCheque = { params: chequeIdParams };

  confirmarRechazoCheque = { params: chequeIdParams, body: confirmarRechazoBody };
}
