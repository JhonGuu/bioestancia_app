import { httpClient, unwrap } from "@/shared/api/http-client";
import { filenameFromContentDisposition } from "@/shared/lib/download-blob";
import type { CreateEmpleadoFormValues } from "@/modules/empleados/domain/empleado.schemas";
import type { Empleado } from "@/modules/empleados/domain/empleado.types";
import type { HorarioEmpleado } from "@/modules/empleados/domain/horario-empleado.types";

export type EstadoEmpleadoFiltro = "activos" | "inactivos" | "todos";

interface ArchivoDescargado {
  blob: Blob;
  filename: string;
}

/**
 * Campos nullable+optional en el backend (`EmpleadoValidation`) — `""` en el
 * form se traduce a `null` explícito para poder limpiarlos. Los demás
 * opcionales (no nullable) se traducen a `undefined` (se omite la clave),
 * porque el backend no acepta `null` para esos.
 */
function toPayload(input: CreateEmpleadoFormValues) {
  return {
    nombre: input.nombre,
    apellido: input.apellido,
    dni: input.dni,
    cuil: input.cuil || undefined,
    domicilio: input.domicilio || undefined,
    telefono: input.telefono || undefined,
    fechaNacimiento: input.fechaNacimiento || null,
    estadoCivil: input.estadoCivil || null,
    contactoEmergenciaNombre: input.contactoEmergenciaNombre || undefined,
    contactoEmergenciaTelefono: input.contactoEmergenciaTelefono || undefined,

    fechaIngreso: input.fechaIngreso,
    cargoId: input.cargoId || null,
    categoriaProfesional: input.categoriaProfesional || undefined,
    convenioColectivo: input.convenioColectivo || undefined,
    tipoContrato: input.tipoContrato || null,
    modalidad: input.modalidad || null,
    lugarPrestacionTareas: input.lugarPrestacionTareas || undefined,
    datosBancarios: input.datosBancarios || undefined,

    nombreDispositivo: input.nombreDispositivo || undefined,
    toleranciaMinutos: input.toleranciaMinutos ? Number(input.toleranciaMinutos) : null,
  };
}

export const empleadosApi = {
  list(estado?: EstadoEmpleadoFiltro): Promise<Empleado[]> {
    return unwrap(httpClient.get("/personal/empleados", { params: estado ? { estado } : undefined }));
  },

  getById(id: string): Promise<Empleado> {
    return unwrap(httpClient.get(`/personal/empleados/${id}`));
  },

  create(input: CreateEmpleadoFormValues): Promise<Empleado> {
    return unwrap(httpClient.post("/personal/empleados", toPayload(input)));
  },

  update(id: string, input: CreateEmpleadoFormValues): Promise<Empleado> {
    return unwrap(httpClient.patch(`/personal/empleados/${id}`, toPayload(input)));
  },

  remove(id: string): Promise<void> {
    return unwrap(httpClient.delete(`/personal/empleados/${id}`));
  },

  reactivar(id: string): Promise<Empleado> {
    return unwrap(httpClient.post(`/personal/empleados/${id}/reactivar`, {}));
  },

  getHorarios(id: string): Promise<HorarioEmpleado[]> {
    return unwrap(httpClient.get(`/personal/empleados/${id}/horarios`));
  },

  setHorarios(
    id: string,
    horarios: { diaSemana: number; horaEntrada: string | null; horaSalida: string | null }[],
  ): Promise<HorarioEmpleado[]> {
    return unwrap(httpClient.put(`/personal/empleados/${id}/horarios`, { horarios }));
  },

  /** Sube (o reemplaza) la copia digitalizada del DNI — PDF, JPG o PNG, máx. 10MB. */
  subirDni(id: string, archivo: File): Promise<Empleado> {
    const formData = new FormData();
    formData.append("archivo", archivo);
    return unwrap(
      httpClient.post(`/personal/empleados/${id}/dni`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    );
  },

  async descargarDni(id: string): Promise<ArchivoDescargado> {
    const response = await httpClient.get(`/personal/empleados/${id}/dni`, { responseType: "blob" });
    return {
      blob: response.data,
      filename: filenameFromContentDisposition(response.headers, "dni"),
    };
  },
};
