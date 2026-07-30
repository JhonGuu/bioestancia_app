import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";
import { CodigoAfipPorcino } from "@/modules/proveedores/domain/codigo-afip-porcino";

/**
 * Representación del Proveedor en el dominio. Mismo patrón que `Cliente`
 * (modules/clientes/domain/cliente.ts): persona física (nombre+apellido+dni)
 * o persona jurídica (razonSocial+cuit) — nunca los dos juegos de campos
 * obligatorios a la vez. Esa regla se valida con Zod en
 * infra/http/validation.ts, no acá.
 *
 * Reusa `CondicionFiscal` de `clientes` en vez de duplicar el enum — es el
 * mismo concepto (condición fiscal ante AFIP), mismo criterio que `RoleGroups`
 * (modules/users) se importa cruzado en otros módulos.
 *
 * A diferencia de `Cliente`, no tiene `listaDePreciosId` (eso aplica a quién
 * nos compra, no a quién nos vende) y sí tiene `datosBancarios`.
 */
export interface Proveedor {
  id: string;
  empresaId: string;
  nombre: string | null;
  apellido: string | null;
  razonSocial: string | null;
  cuit: string | null;
  dni: string | null;
  domicilio: string | null;
  email: string | null;
  pais: string | null;
  provincia: string | null;
  ubicacion: string | null;
  condicionFiscal: CondicionFiscal;
  /**
   * CBU o CVU del proveedor, para pagarle por transferencia. 22 dígitos
   * numéricos — CBU y CVU comparten formato, por eso un solo campo alcanza
   * (no hace falta distinguir cuál de los dos es).
   */
  datosBancarios: string | null;
  /**
   * % de desbaste que se le aplica por defecto al peso bruto cuando se compra
   * una tropa a este proveedor (ver `modules/tropas`) — cada criadero negocia
   * el suyo. Nullable: no todo proveedor es necesariamente un criadero de
   * donde se compran animales.
   */
  porcentajeDesbaste: number | null;
  /**
   * RENSPA (Registro Nacional Sanitario de Productores Agropecuarios) del
   * establecimiento del proveedor — código SENASA con formato
   * "NN.NNN.N.NNNNN/NN" (ej. "11.016.0.00312/00"). Nullable: no todo
   * proveedor tiene un establecimiento registrado cargado.
   */
  renspa: string | null;
  /**
   * Código AFIP (WSLSP, "carácter" del sujeto) que se usa al generar la
   * liquidación de compra — ver `CodigoAfipPorcino`. Nullable: no todo
   * proveedor participa de liquidaciones electrónicas.
   */
  codigoAfip: CodigoAfipPorcino | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
