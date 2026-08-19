import {
  Empleado,
  EstadoCivil,
  ModalidadTrabajo,
  TipoContrato,
} from "@/modules/personal/domain/empleado";

export type EstadoEmpleadoFiltro = "activos" | "inactivos" | "todos";

/**
 * Interface del repositorio de Empleados. Forma parte del DOMINIO.
 * Mismo criterio que `ProveedorRepository`/`FrigorificoRepository`.
 */
export interface EmpleadoRepository {
  getById(id: string, empresaId: string): Promise<Empleado | null>;

  list(empresaId: string, estado?: EstadoEmpleadoFiltro): Promise<Empleado[]>;

  create(input: CreateEmpleadoInput): Promise<Empleado>;

  update(id: string, empresaId: string, input: UpdateEmpleadoInput): Promise<Empleado>;

  delete(id: string, empresaId: string): Promise<void>;

  reactivar(id: string, empresaId: string): Promise<Empleado>;

  /** Setea (o limpia, con `null`) la ruta del archivo de DNI. Lo usa `SubirDniEmpleado`. */
  setDniArchivoPath(id: string, empresaId: string, path: string | null): Promise<Empleado>;

  /** Guarda el alias que manda el lector de huellas para este empleado. Lo usa `ConfirmarImportacionFichajes`. */
  setNombreDispositivo(id: string, empresaId: string, nombreDispositivo: string): Promise<void>;

  /** Empleados activos con `nombreDispositivo` cargado — usado para matchear al importar fichajes. */
  listConNombreDispositivo(empresaId: string): Promise<Empleado[]>;
}

export interface CreateEmpleadoInput {
  empresaId: string;
  nombre: string;
  apellido: string;
  dni: string;
  cuil?: string | null;
  domicilio?: string | null;
  telefono?: string | null;
  fechaNacimiento?: Date | null;
  estadoCivil?: EstadoCivil | null;
  contactoEmergenciaNombre?: string | null;
  contactoEmergenciaTelefono?: string | null;
  fechaIngreso: Date;
  cargoId?: string | null;
  categoriaProfesional?: string | null;
  convenioColectivo?: string | null;
  tipoContrato?: TipoContrato | null;
  modalidad?: ModalidadTrabajo | null;
  lugarPrestacionTareas?: string | null;
  datosBancarios?: string | null;
  nombreDispositivo?: string | null;
  toleranciaMinutos?: number | null;
}

export type UpdateEmpleadoInput = Omit<CreateEmpleadoInput, "empresaId">;
