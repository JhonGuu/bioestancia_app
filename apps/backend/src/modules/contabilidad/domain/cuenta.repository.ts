import { Cuenta } from "@/modules/contabilidad/domain/cuenta";
import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import { TipoCuenta } from "@/modules/contabilidad/domain/tipo-cuenta";

/** Interface del repositorio del plan de cuentas. Forma parte del DOMINIO. */
export interface CuentaRepository {
  list(empresaId: string, incluirInactivas?: boolean): Promise<Cuenta[]>;
  getById(id: string, empresaId: string): Promise<Cuenta | null>;
  getByCodigo(codigo: string, empresaId: string): Promise<Cuenta | null>;
  create(input: CreateCuentaInput): Promise<Cuenta>;
  /** Inserta muchas de una (sembrado del plan base). Devuelve las creadas. */
  createMany(inputs: CreateCuentaInput[]): Promise<Cuenta[]>;
  update(id: string, empresaId: string, input: UpdateCuentaInput): Promise<Cuenta>;
  /** Baja lógica: la cuenta deja de ofrecerse para imputar pero su historia queda. */
  desactivar(id: string, empresaId: string): Promise<void>;
  /** Borrado real — solo se permite si no tiene hijos ni movimientos (lo valida el use-case). */
  delete(id: string, empresaId: string): Promise<void>;
  /** ¿Tiene alguna línea de asiento imputada? */
  tieneMovimientos(id: string): Promise<boolean>;
  /** ¿Tiene cuentas hijas (activas o no)? */
  tieneHijos(id: string): Promise<boolean>;
  /** Cuántas cuentas tiene la empresa — para saber si el plan ya fue sembrado. */
  contar(empresaId: string): Promise<number>;
}

export interface CreateCuentaInput {
  empresaId: string;
  codigo: string;
  nombre: string;
  tipo: TipoCuenta;
  parentId?: string | null;
  imputable: boolean;
  monetaria: boolean;
  requiereAuxiliar?: TipoAuxiliar;
}

export interface UpdateCuentaInput {
  codigo?: string;
  nombre?: string;
  tipo?: TipoCuenta;
  parentId?: string | null;
  imputable?: boolean;
  monetaria?: boolean;
  requiereAuxiliar?: TipoAuxiliar;
  activa?: boolean;
}
