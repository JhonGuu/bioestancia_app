import {
  AuxiliarResolverRegla,
  EventoAsiento,
  ExpresionMontoRegla,
  LadoLineaRegla,
  ReglaAsiento,
} from "@/modules/contabilidad/domain/regla-asiento";

/** Interface del repositorio de reglas de asiento. Forma parte del DOMINIO. */
export interface ReglaAsientoRepository {
  list(empresaId: string): Promise<ReglaAsiento[]>;
  /** Solo las reglas de un evento puntual — lo usa el motor de generación. */
  listByEvento(empresaId: string, evento: EventoAsiento): Promise<ReglaAsiento[]>;
  getById(id: string, empresaId: string): Promise<ReglaAsiento | null>;
  create(input: CreateReglaAsientoInput): Promise<ReglaAsiento>;
  /** Reemplaza cabecera + líneas en una sola transacción, igual que `AsientoRepository.update`. */
  update(id: string, empresaId: string, input: UpdateReglaAsientoInput): Promise<ReglaAsiento>;
  delete(id: string, empresaId: string): Promise<void>;
}

export interface ReglaAsientoLineaInput {
  lado: LadoLineaRegla;
  cuentaId: string;
  expresion: ExpresionMontoRegla;
  auxiliarResolver?: AuxiliarResolverRegla | null;
}

export interface CreateReglaAsientoInput {
  empresaId: string;
  evento: EventoAsiento;
  nombre: string;
  activa?: boolean;
  prioridad?: number;
  condicion?: Record<string, string> | null;
  lineas: ReglaAsientoLineaInput[];
}

export interface UpdateReglaAsientoInput {
  nombre?: string;
  activa?: boolean;
  prioridad?: number;
  condicion?: Record<string, string> | null;
  lineas?: ReglaAsientoLineaInput[];
}
