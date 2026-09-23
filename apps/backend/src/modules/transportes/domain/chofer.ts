/**
 * Persona que conduce el vehículo.
 *
 * `cuit`: CUIT o CUIL del conductor, 11 dígitos sin guiones — es el dato que
 * pide el Remito Electrónico Cárnico (no el DNI).
 *
 * `dni` y `licenciaVencimiento` son datos personales: se devuelven solo a
 * quien tiene el permiso `VER_DATOS_CHOFERES` (ver `modules/permisos`).
 * Fechas como "AAAA-MM-DD" (sin hora, para que no se corran por zona horaria).
 *
 * `transportistaId`: para quién trabaja (opcional).
 */
export interface Chofer {
  id: string;
  empresaId: string;
  transportistaId: string | null;
  nombre: string;
  apellido: string;
  cuit: string;
  dni: string | null;
  telefono: string | null;
  licenciaVencimiento: string | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
