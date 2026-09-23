import { injectable } from "inversify";
import { z } from "zod";

import { esCuitValido, esPatenteValida } from "@/modules/transportes/domain/documento-transporte";
import { TipoVehiculo } from "@/modules/transportes/domain/vehiculo";

const cuit = z
  .string()
  .trim()
  .refine(esCuitValido, "CUIT/CUIL inválido: tienen que ser 11 dígitos con dígito verificador correcto");

const patente = z
  .string()
  .trim()
  .refine(esPatenteValida, "Patente inválida: formato esperado ABC123 o AB123CD");

/** Fecha sin hora, "AAAA-MM-DD". */
const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida: formato esperado AAAA-MM-DD")
  .refine((valor) => !Number.isNaN(Date.parse(valor)), "Fecha inválida");

const telefono = z.string().trim().min(1).max(30);

const transportistaBody = z.object({
  nombre: z.string().trim().min(1).max(255),
  cuit,
  telefono: telefono.optional(),
  esPropio: z.boolean().optional(),
});

const choferBody = z.object({
  transportistaId: z.string().uuid("Id de transportista inválido").optional(),
  nombre: z.string().trim().min(1).max(100),
  apellido: z.string().trim().min(1).max(100),
  cuit,
  dni: z.string().trim().min(1).max(20).optional(),
  telefono: telefono.optional(),
  licenciaVencimiento: fecha.optional(),
});

const vehiculoBody = z.object({
  transportistaId: z.string().uuid("Id de transportista inválido").optional(),
  tipo: z.nativeEnum(TipoVehiculo),
  patente,
  descripcion: z.string().trim().min(1).max(255).optional(),
  rtoVencimiento: fecha.optional(),
  seguroVencimiento: fecha.optional(),
  habilitacionAnimalesVencimiento: fecha.optional(),
});

const transporteClienteBody = z.object({
  choferIds: z.array(z.string().uuid("Id de chofer inválido")).max(500),
  vehiculoIds: z.array(z.string().uuid("Id de vehículo inválido")).max(500),
});

const idParams = z.object({ id: z.string().uuid("Id inválido") });
const listQuery = z.object({ estado: z.enum(["activos", "inactivos", "todos"]).optional() });

@injectable()
export class TransporteValidation {
  transportista = {
    create: { body: transportistaBody },
    update: { params: idParams, body: transportistaBody },
  };

  chofer = {
    create: { body: choferBody },
    update: { params: idParams, body: choferBody },
  };

  vehiculo = {
    create: { body: vehiculoBody },
    update: { params: idParams, body: vehiculoBody },
  };

  list = { query: listQuery };
  byId = { params: idParams };

  /** Choferes y vehículos autorizados de un cliente (`:id` es el id del cliente). */
  transporteCliente = {
    get: { params: idParams },
    set: { params: idParams, body: transporteClienteBody },
  };
}
