/**
 * Un camión, jaula, acoplado o semi se carga como un vehículo cada uno: un
 * camión con acoplado son dos vehículos, y en el remito se eligen ambos.
 */
export enum TipoVehiculo {
  CAMION = "camion",
  JAULA = "jaula",
  ACOPLADO = "acoplado",
  SEMI = "semi",
  UTILITARIO = "utilitario",
  OTRO = "otro",
}

/**
 * `patente`: dominio normalizado (mayúsculas, sin espacios ni guiones), único
 * por empresa.
 *
 * Los vencimientos son opcionales, fechas "AAAA-MM-DD": RTO, seguro y
 * habilitación para transporte de animales (esta última aplica a Bioestancia,
 * que mueve cerdos en pie).
 */
export interface Vehiculo {
  id: string;
  empresaId: string;
  transportistaId: string | null;
  tipo: TipoVehiculo;
  patente: string;
  descripcion: string | null;
  rtoVencimiento: string | null;
  seguroVencimiento: string | null;
  habilitacionAnimalesVencimiento: string | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
