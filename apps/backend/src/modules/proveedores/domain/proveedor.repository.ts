import { Proveedor } from "@/modules/proveedores/domain/proveedor";
import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";

/**
 * Interface del repositorio de Proveedores. Forma parte del DOMINIO.
 *
 * `empresaId` obligatorio en `getById` y `list` — mismo motivo que en
 * `ClienteRepository`: nunca se lee sin saber de qué empresa es.
 */
export interface ProveedorRepository {
  getById(id: string, empresaId: string): Promise<Proveedor | null>;

  /** Lista los proveedores de una empresa puntual. */
  list(empresaId: string): Promise<Proveedor[]>;

  create(input: CreateProveedorInput): Promise<Proveedor>;
}

export interface CreateProveedorInput {
  empresaId: string;
  nombre?: string;
  apellido?: string;
  razonSocial?: string;
  cuit?: string;
  dni?: string;
  domicilio?: string;
  email?: string;
  pais?: string;
  provincia?: string;
  ubicacion?: string;
  condicionFiscal: CondicionFiscal;
  datosBancarios?: string;
  porcentajeDesbaste?: number;
}
