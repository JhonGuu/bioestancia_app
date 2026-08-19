/**
 * Resultado de faena: el documento (oficial, formato SENASA) que entrega el
 * frigorífico una vez que se faenan los animales de una compra.
 *
 * Es 1 a 1 con `Compra` (`compraId` único): una compra siempre se faena
 * entera, de una sola vez — no se combinan compras distintas en una faena, ni
 * se faena una compra en varias tandas.
 *
 * `kgVivoTotal` es el peso vivo verificado en planta al momento de la faena
 * (puede diferir un poco del `pesoBruto` cargado en la compra, que es el peso
 * de báscula al comprar). `kgCarneTotal` es el total de kg de carne obtenido
 * ("Total Faena" en el documento). `rendimiento` se calcula en el server
 * (`kgCarneTotal / kgVivoTotal * 100`) — es un dato del FRIGORÍFICO, distinto
 * del `rinde` de `Compra` (que compara lo vendido contra lo comprado neto).
 *
 * Al crearse, además de este header, completa los campos de faena de cada
 * línea de `CompraCategoria` correspondiente (ver
 * `use-cases/create-resultado-faena.use-case.ts`).
 */
export interface ResultadoFaena {
  id: string;
  compraId: string;
  /** Establecimiento faenador (ver `modules/frigorificos`). Nullable: no todo resultado de faena histórico lo tiene cargado. */
  frigorificoId: string | null;
  fechaFaena: Date;
  numero: string | null;
  numeroAutorizacion: string | null;
  kgVivoTotal: number;
  kgCarneTotal: number;
  comisosKg: number;
  comisosCabezas: number;
  rendimiento: number;
  comentarios: string | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
