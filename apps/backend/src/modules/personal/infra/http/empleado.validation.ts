import { injectable } from "inversify";
import { z } from "zod";

import { EstadoCivil, ModalidadTrabajo, TipoContrato } from "@/modules/personal/domain/empleado";

const createBody = z.object({
  // Datos personales e identificatorios
  nombre: z.string().min(1, "Nombre requerido").max(100),
  apellido: z.string().min(1, "Apellido requerido").max(100),
  dni: z.string().min(1, "DNI requerido").max(20),
  cuil: z.string().max(20).optional(),
  domicilio: z.string().max(255).optional(),
  telefono: z.string().max(50).optional(),
  fechaNacimiento: z.coerce.date().nullable().optional(),
  estadoCivil: z.nativeEnum(EstadoCivil).nullable().optional(),
  contactoEmergenciaNombre: z.string().max(150).optional(),
  contactoEmergenciaTelefono: z.string().max(50).optional(),

  // Datos laborales y contractuales
  fechaIngreso: z.coerce.date(),
  cargoId: z.string().uuid().nullable().optional(),
  categoriaProfesional: z.string().max(150).optional(),
  convenioColectivo: z.string().max(100).optional(),
  tipoContrato: z.nativeEnum(TipoContrato).nullable().optional(),
  modalidad: z.nativeEnum(ModalidadTrabajo).nullable().optional(),
  lugarPrestacionTareas: z.string().max(255).optional(),
  datosBancarios: z.string().max(100).optional(),

  // Operativo
  nombreDispositivo: z.string().max(100).optional(),
  toleranciaMinutos: z.number().int().min(0).max(180).nullable().optional(),
});

const updateBody = createBody;

const idParams = z.object({ id: z.string().uuid("Id inválido") });

const listQuery = z.object({
  estado: z.enum(["activos", "inactivos", "todos"]).optional(),
});

// Acepta hora sin cero adelante ("8:00" en vez de "08:00") y con segundos
// opcionales ("08:00:00") — según la configuración regional del SO, algunos
// navegadores devuelven el valor de `<input type="time">` en distintos
// formatos (sin padear la hora, o con un tercer segmento de segundos que ni
// siquiera se ve en el control). Se normaliza a "HH:mm" recién al guardar
// (`SetHorariosEmpleado`), no acá.
const horaHHmmRegex = /^([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

const setHorariosBody = z.object({
  horarios: z
    .array(
      z.object({
        diaSemana: z.number().int().min(0).max(6),
        horaEntrada: z.string().regex(horaHHmmRegex, "Formato HH:mm").nullable(),
        horaSalida: z.string().regex(horaHHmmRegex, "Formato HH:mm").nullable(),
      }),
    )
    .max(7, "No puede haber más de 7 días"),
});

@injectable()
export class EmpleadoValidation {
  create = { body: createBody };
  list = { query: listQuery };
  getById = { params: idParams };
  update = { params: idParams, body: updateBody };
  delete = { params: idParams };
  reactivar = { params: idParams };
  getHorarios = { params: idParams };
  setHorarios = { params: idParams, body: setHorariosBody };
  dniParams = { params: idParams };
}
