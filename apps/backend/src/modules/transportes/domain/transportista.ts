/**
 * Empresa (o persona) que hace el traslado de la mercadería.
 *
 * `esPropio`: el transportista es la propia empresa (por ejemplo El Meridiano
 * llevando su mercadería con su camión y un empleado de chofer, como en sus
 * remitos). Evita cargar a la empresa dos veces como si fuera un tercero.
 *
 * `cuit`: 11 dígitos sin guiones, validado con el dígito verificador.
 */
export interface Transportista {
  id: string;
  empresaId: string;
  nombre: string;
  cuit: string;
  telefono: string | null;
  esPropio: boolean;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
