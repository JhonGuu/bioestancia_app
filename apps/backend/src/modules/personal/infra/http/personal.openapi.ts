import { z } from "zod";

import { registry } from "@/shared/infra/openapi/registry";
import { apiResponseSchema, empresaIdHeaderSchema } from "@/shared/infra/openapi/common";
import { CargoValidation } from "@/modules/personal/infra/http/cargo.validation";
import { EmpleadoValidation } from "@/modules/personal/infra/http/empleado.validation";
import { FichajeValidation } from "@/modules/personal/infra/http/fichaje.validation";
import { JornadaValidation } from "@/modules/personal/infra/http/jornada.validation";
import { BalanceHorasValidation } from "@/modules/personal/infra/http/balance-horas.validation";

const cargoValidation = new CargoValidation();
const empleadoValidation = new EmpleadoValidation();
const fichajeValidation = new FichajeValidation();
const jornadaValidation = new JornadaValidation();
const balanceHorasValidation = new BalanceHorasValidation();

const cargoSchema = z.object({
  id: z.string().uuid(),
  empresaId: z.string().uuid(),
  nombre: z.string(),
  toleranciaMinutos: z.number().int().nullable(),
  activo: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const empleadoSchema = z.object({
  id: z.string().uuid(),
  empresaId: z.string().uuid(),
  nombre: z.string(),
  apellido: z.string(),
  dni: z.string(),
  dniArchivoPath: z.string().nullable(),
  cuil: z.string().nullable(),
  domicilio: z.string().nullable(),
  telefono: z.string().nullable(),
  fechaNacimiento: z.string().datetime().nullable(),
  estadoCivil: z.string().nullable(),
  contactoEmergenciaNombre: z.string().nullable(),
  contactoEmergenciaTelefono: z.string().nullable(),
  fechaIngreso: z.string().datetime(),
  cargoId: z.string().uuid().nullable(),
  categoriaProfesional: z.string().nullable(),
  convenioColectivo: z.string().nullable(),
  tipoContrato: z.string().nullable(),
  modalidad: z.string().nullable(),
  lugarPrestacionTareas: z.string().nullable(),
  datosBancarios: z.string().nullable(),
  nombreDispositivo: z.string().nullable(),
  toleranciaMinutos: z.number().int().nullable(),
  activo: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const horarioEmpleadoSchema = z.object({
  id: z.string().uuid(),
  empleadoId: z.string().uuid(),
  diaSemana: z.number().int().min(0).max(6),
  horaEntrada: z.string().nullable(),
  horaSalida: z.string().nullable(),
});

const filaFichajeMatcheadaSchema = z.object({
  empleadoId: z.string().uuid(),
  empleadoNombre: z.string(),
  momento: z.string().datetime(),
  tipo: z.enum(["entrada", "salida"]),
});

const grupoFichajeSinMatchSchema = z.object({
  nombreDispositivo: z.string(),
  cantidad: z.number().int(),
  primerMomento: z.string().datetime(),
  filas: z.array(z.object({ momento: z.string().datetime(), tipo: z.enum(["entrada", "salida"]) })),
});

const previewImportacionFichajesSchema = z.object({
  totalFilas: z.number().int(),
  filasConError: z.number().int(),
  duplicadosDescartados: z.number().int(),
  matcheadas: z.array(filaFichajeMatcheadaSchema),
  sinMatch: z.array(grupoFichajeSinMatchSchema),
});

const resultadoConfirmarImportacionSchema = z.object({
  importados: z.number().int(),
  omitidosPorDuplicado: z.number().int(),
});

const fichajeSchema = z.object({
  id: z.string().uuid(),
  empresaId: z.string().uuid(),
  empleadoId: z.string().uuid(),
  momento: z.string().datetime(),
  tipo: z.enum(["entrada", "salida"]),
  origen: z.enum(["importado", "manual"]),
  createdAt: z.string().datetime(),
});

const parFichajeSchema = z.object({
  entrada: fichajeSchema.nullable(),
  salida: fichajeSchema.nullable(),
});

const jornadaSchema = z.object({
  empleadoId: z.string().uuid(),
  fecha: z.string(),
  estado: z.enum(["presente", "falta", "franco", "marcacion_incompleta"]),
  horarioPactado: z.object({ horaEntrada: z.string().nullable(), horaSalida: z.string().nullable() }).nullable(),
  pares: z.array(parFichajeSchema),
  horasTrabajadas: z.number(),
  horasNormales: z.number(),
  horasExtra: z.number(),
  llegadaTarde: z.boolean(),
  toleranciaAplicadaMinutos: z.number(),
  tieneMarcacionManual: z.boolean(),
});

const balanceHorasEmpleadoSchema = z.object({
  empleadoId: z.string().uuid(),
  empleadoNombre: z.string(),
  cargoNombre: z.string().nullable(),
  horasNormales: z.number(),
  horasExtra: z.number(),
  cantidadFaltas: z.number().int(),
  cantidadLlegadasTarde: z.number().int(),
  cantidadMarcacionesIncompletas: z.number().int(),
});

const balanceHorasSchema = z.object({
  periodo: z.enum(["semanal", "quincenal", "mensual"]),
  desde: z.string(),
  hasta: z.string(),
  empleados: z.array(balanceHorasEmpleadoSchema),
});

export function registerPersonalOpenApi(): void {
  // ── Cargos ──────────────────────────────────────
  registry.registerPath({
    method: "post",
    path: "/personal/cargos",
    tags: ["Personal — Cargos"],
    summary: "Crea un cargo (puesto) para la empresa activa. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      body: { content: { "application/json": { schema: cargoValidation.create.body } } },
    },
    responses: {
      201: { description: "Cargo creado", content: { "application/json": { schema: apiResponseSchema(cargoSchema) } } },
      403: { description: "No sos admin/contable de la empresa activa" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/personal/cargos",
    tags: ["Personal — Cargos"],
    summary: "Lista los cargos de la empresa activa. `estado` filtra activos/inactivos/todos.",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, query: cargoValidation.list.query },
    responses: {
      200: { description: "OK", content: { "application/json": { schema: apiResponseSchema(z.array(cargoSchema)) } } },
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/personal/cargos/{id}",
    tags: ["Personal — Cargos"],
    summary: "Edita un cargo. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
      body: { content: { "application/json": { schema: cargoValidation.update.body } } },
    },
    responses: {
      200: { description: "Cargo actualizado", content: { "application/json": { schema: apiResponseSchema(cargoSchema) } } },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/personal/cargos/{id}",
    tags: ["Personal — Cargos"],
    summary: "Elimina (soft-delete) un cargo. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, params: z.object({ id: z.string().uuid() }) },
    responses: {
      200: { description: "Cargo eliminado" },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/personal/cargos/{id}/reactivar",
    tags: ["Personal — Cargos"],
    summary: "Deshace el soft-delete de un cargo. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, params: z.object({ id: z.string().uuid() }) },
    responses: {
      200: { description: "Cargo reactivado", content: { "application/json": { schema: apiResponseSchema(cargoSchema) } } },
    },
  });

  // ── Empleados ───────────────────────────────────
  registry.registerPath({
    method: "post",
    path: "/personal/empleados",
    tags: ["Personal — Empleados"],
    summary: "Crea un empleado (legajo completo) para la empresa activa. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      body: { content: { "application/json": { schema: empleadoValidation.create.body } } },
    },
    responses: {
      201: { description: "Empleado creado", content: { "application/json": { schema: apiResponseSchema(empleadoSchema) } } },
      403: { description: "No sos admin/contable de la empresa activa" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/personal/empleados",
    tags: ["Personal — Empleados"],
    summary: "Lista los empleados de la empresa activa. `estado` filtra activos/inactivos/todos.",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, query: empleadoValidation.list.query },
    responses: {
      200: { description: "OK", content: { "application/json": { schema: apiResponseSchema(z.array(empleadoSchema)) } } },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/personal/empleados/{id}",
    tags: ["Personal — Empleados"],
    summary: "Obtiene un empleado de la empresa activa por id",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, params: z.object({ id: z.string().uuid() }) },
    responses: {
      200: { description: "OK", content: { "application/json": { schema: apiResponseSchema(empleadoSchema) } } },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/personal/empleados/{id}",
    tags: ["Personal — Empleados"],
    summary: "Edita un empleado (reemplaza todos los campos del legajo). Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
      body: { content: { "application/json": { schema: empleadoValidation.update.body } } },
    },
    responses: {
      200: { description: "Empleado actualizado", content: { "application/json": { schema: apiResponseSchema(empleadoSchema) } } },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/personal/empleados/{id}",
    tags: ["Personal — Empleados"],
    summary: "Elimina (soft-delete) un empleado. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, params: z.object({ id: z.string().uuid() }) },
    responses: {
      200: { description: "Empleado eliminado" },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/personal/empleados/{id}/reactivar",
    tags: ["Personal — Empleados"],
    summary: "Deshace el soft-delete de un empleado. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, params: z.object({ id: z.string().uuid() }) },
    responses: {
      200: { description: "Empleado reactivado", content: { "application/json": { schema: apiResponseSchema(empleadoSchema) } } },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/personal/empleados/{id}/horarios",
    tags: ["Personal — Empleados"],
    summary: "Horario semanal pactado de un empleado (0=domingo..6=sábado). Días sin horario = franco.",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, params: z.object({ id: z.string().uuid() }) },
    responses: {
      200: { description: "OK", content: { "application/json": { schema: apiResponseSchema(z.array(horarioEmpleadoSchema)) } } },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });

  registry.registerPath({
    method: "put",
    path: "/personal/empleados/{id}/horarios",
    tags: ["Personal — Empleados"],
    summary: "Reemplaza el horario semanal completo de un empleado. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
      body: { content: { "application/json": { schema: empleadoValidation.setHorarios.body } } },
    },
    responses: {
      200: { description: "Horario actualizado", content: { "application/json": { schema: apiResponseSchema(z.array(horarioEmpleadoSchema)) } } },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/personal/empleados/{id}/dni",
    tags: ["Personal — Empleados"],
    summary: "Sube la copia digitalizada del DNI (multipart/form-data, campo 'archivo': PDF/JPG/PNG). Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
      body: {
        content: {
          "multipart/form-data": {
            schema: z.object({
              archivo: z.any().openapi({ description: "Archivo PDF, JPG o PNG (máx. 10MB)" }),
            }),
          },
        },
      },
    },
    responses: {
      200: { description: "Documento subido", content: { "application/json": { schema: apiResponseSchema(empleadoSchema) } } },
      400: { description: "Falta el archivo o el formato no es PDF/JPG/PNG" },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/personal/empleados/{id}/dni",
    tags: ["Personal — Empleados"],
    summary: "Descarga la copia del DNI de un empleado (binario, no JSON).",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, params: z.object({ id: z.string().uuid() }) },
    responses: {
      200: { description: "Archivo (PDF/JPG/PNG)" },
      404: { description: "No tiene DNI cargado, o no existe" },
    },
  });

  // ── Fichajes (importación) ─────────────────────
  registry.registerPath({
    method: "post",
    path: "/personal/fichajes/importar/preview",
    tags: ["Personal — Fichajes"],
    summary:
      "Primer paso de la importación: parsea el Excel del lector de huellas (multipart, campo 'archivo'), " +
      "matchea contra Empleado.nombreDispositivo y descarta duplicados intra-lote. No escribe nada en la base. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      body: {
        content: {
          "multipart/form-data": {
            schema: z.object({
              archivo: z.any().openapi({ description: "Archivo .xls/.xlsx exportado por el lector de huellas" }),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(previewImportacionFichajesSchema) } },
      },
      400: { description: "Archivo inválido o columnas no reconocidas" },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/personal/fichajes/importar/confirmar",
    tags: ["Personal — Fichajes"],
    summary:
      "Segundo paso: inserta las filas ya resueltas (matcheadas + asignadas a mano), " +
      "opcionalmente guardando el alias de dispositivo para la próxima importación. Dedupea contra la base. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      body: { content: { "application/json": { schema: fichajeValidation.confirmar.body } } },
    },
    responses: {
      200: {
        description: "Fichajes importados",
        content: { "application/json": { schema: apiResponseSchema(resultadoConfirmarImportacionSchema) } },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/personal/fichajes/manual",
    tags: ["Personal — Fichajes"],
    summary:
      "Completa una marcación olvidada a mano (queda con origen 'manual') desde la vista de asistencia. Admin o contable.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      body: { content: { "application/json": { schema: fichajeValidation.manual.body } } },
    },
    responses: {
      201: { description: "Fichaje agregado", content: { "application/json": { schema: apiResponseSchema(fichajeSchema) } } },
      404: { description: "El empleado no existe o no pertenece a la empresa activa" },
    },
  });

  // ── Jornadas (asistencia) ──────────────────────
  registry.registerPath({
    method: "get",
    path: "/personal/empleados/{id}/jornadas",
    tags: ["Personal — Fichajes"],
    summary:
      "Calcula la jornada de un empleado día por día en el rango [desde, hasta] — horas normales/extra, " +
      "estado (presente/falta/franco/marcación incompleta) y llegada tarde según la tolerancia vigente.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ id: z.string().uuid() }),
      query: jornadaValidation.calcular.query,
    },
    responses: {
      200: { description: "OK", content: { "application/json": { schema: apiResponseSchema(z.array(jornadaSchema)) } } },
      404: { description: "No existe o no pertenece a la empresa activa" },
    },
  });

  // ── Balance de horas extra ─────────────────────
  registry.registerPath({
    method: "get",
    path: "/personal/balance-horas",
    tags: ["Personal — Balance de horas"],
    summary:
      "Suma horas normales/extra (y faltas/llegadas tarde/marcaciones incompletas) de todos los empleados " +
      "activos en el período elegido (semanal/quincenal/mensual) — reemplaza la hoja RECUENTO DE HORAS. " +
      "`fecha` es cualquier día dentro del período que se quiere ver (default: hoy).",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema, query: balanceHorasValidation.calcular.query },
    responses: {
      200: { description: "OK", content: { "application/json": { schema: apiResponseSchema(balanceHorasSchema) } } },
    },
  });
}
