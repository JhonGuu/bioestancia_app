import { Fichaje } from "@/modules/personal/domain/fichaje";

export interface CreateFichajeInput {
  empresaId: string;
  empleadoId: string;
  momento: Date;
  tipo: Fichaje["tipo"];
  origen: Fichaje["origen"];
}

export interface FichajeRepository {
  createMany(inputs: CreateFichajeInput[]): Promise<Fichaje[]>;
  /** Trae todas las marcaciones de esos empleados dentro del rango — se usa para el dedupe contra lo ya importado. */
  listByEmpleadosEnRango(empleadoIds: string[], desde: Date, hasta: Date): Promise<Fichaje[]>;
}
