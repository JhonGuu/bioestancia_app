/**
 * Representación del Frigorífico en el dominio.
 *
 * Un frigorífico es el establecimiento (planta faenadora) donde se faena una
 * tropa comprada — distinto del `Proveedor` (el criadero que vende los
 * animales). Una misma tropa pasa por exactamente un frigorífico (ver
 * `ResultadoFaena.frigoríficoId`).
 *
 * A diferencia de `Proveedor`, siempre es una persona jurídica (nunca un
 * criadero chico persona física) — no hace falta el juego de campos
 * nombre+apellido vs. razonSocial, un solo `nombre` alcanza.
 *
 * `senasaNumero`/`rucaNumero` son los datos que identifican al
 * establecimiento en los documentos SENASA (Resultado de Faena) — quedan
 * nullable porque se pueden completar después del alta.
 */
export interface Frigorifico {
  id: string;
  empresaId: string;
  nombre: string;
  cuit: string | null;
  senasaNumero: string | null;
  rucaNumero: string | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
