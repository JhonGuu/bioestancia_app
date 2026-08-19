import { z } from "zod";

import { EstadoCivil, ModalidadTrabajo, TipoContrato } from "@/modules/empleados/domain/empleado.types";

/**
 * Espejo de `EmpleadoValidation.create` en el backend
 * (`apps/backend/src/modules/personal/infra/http/empleado.validation.ts`).
 * Los campos opcionales usan `.or(z.literal(""))` porque los inputs de texto
 * y los `Select` arrancan vacíos — la capa de API (`empleados.api.ts`)
 * traduce `""` a `undefined`/`null` según corresponda antes de mandar al backend.
 */
export const createEmpleadoSchema = z.object({
  // Datos personales e identificatorios
  nombre: z.string().min(1, "Nombre requerido").max(100),
  apellido: z.string().min(1, "Apellido requerido").max(100),
  dni: z.string().min(1, "DNI requerido").max(20),
  cuil: z.string().max(20).optional().or(z.literal("")),
  domicilio: z.string().max(255).optional().or(z.literal("")),
  telefono: z.string().max(50).optional().or(z.literal("")),
  fechaNacimiento: z.string().optional().or(z.literal("")),
  estadoCivil: z.nativeEnum(EstadoCivil).optional().or(z.literal("")),
  contactoEmergenciaNombre: z.string().max(150).optional().or(z.literal("")),
  contactoEmergenciaTelefono: z.string().max(50).optional().or(z.literal("")),

  // Datos laborales y contractuales
  fechaIngreso: z.string().min(1, "La fecha de ingreso es obligatoria"),
  cargoId: z.string().uuid().optional().or(z.literal("")),
  categoriaProfesional: z.string().max(150).optional().or(z.literal("")),
  convenioColectivo: z.string().max(100).optional().or(z.literal("")),
  tipoContrato: z.nativeEnum(TipoContrato).optional().or(z.literal("")),
  modalidad: z.nativeEnum(ModalidadTrabajo).optional().or(z.literal("")),
  lugarPrestacionTareas: z.string().max(255).optional().or(z.literal("")),
  datosBancarios: z.string().max(100).optional().or(z.literal("")),

  // Operativo
  nombreDispositivo: z.string().max(100).optional().or(z.literal("")),
  toleranciaMinutos: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || (Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 180),
      "Tiene que ser un entero entre 0 y 180",
    ),
});

export type CreateEmpleadoFormValues = z.infer<typeof createEmpleadoSchema>;

/** Espejo de `setHorariosBody` — un valor por cada uno de los 7 días de la semana. */
export const horarioSemanalSchema = z.object({
  horarios: z
    .array(
      z.object({
        diaSemana: z.number().int().min(0).max(6),
        horaEntrada: z.string().nullable(),
        horaSalida: z.string().nullable(),
      }),
    )
    .max(7),
});

export type HorarioSemanalFormValues = z.infer<typeof horarioSemanalSchema>;
