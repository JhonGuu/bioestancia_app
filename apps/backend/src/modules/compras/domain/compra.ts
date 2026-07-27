import { EspecieAnimal } from "@/modules/compras/domain/especie-animal";

/**
 * Representación de la Compra en el dominio.
 *
 * Una compra es un lote de animales comprado a un proveedor (criadero),
 * identificado con un número de tropa que asignamos nosotros (no el
 * proveedor) — `numero`. Cada compra tiene un DTE (SENASA) y un remito de
 * referencia, uno de cada.
 *
 * `especie` permite en el futuro comprar bovino u otra especie sin cambiar la
 * estructura de la tabla (ver `domain/especie-animal.ts`). Hoy el negocio solo
 * compra porcinos.
 *
 * `letra` es el código que se le muestra al cliente en la boleta EN VEZ del
 * número real de tropa (para que no infiera que es una tropa "vieja" por el
 * número). Rota con el tiempo: la misma letra se reasigna a compras distintas
 * más adelante, no es un alias fijo para siempre — por eso es un campo simple
 * (no una tabla de mapeo aparte), se carga/actualiza a mano.
 *
 * `porcentajeDesbaste` es el % negociado con el proveedor (se copia de
 * `Proveedor.porcentajeDesbaste` al crear la compra, pero se puede pisar
 * puntualmente) — se aplica parejo a todas las líneas de categoría de la
 * compra (ver `domain/compra-categoria.ts`).
 *
 * Ni `cantidadAnimales` ni `pesoBruto`/`pesoNeto` viven acá como escalares:
 * el remito/DTE real ya viene separado por categoría/raza (ej. "30 machos +
 * 90 hembras"), así que esos totales son la SUMA de `CompraCategoria[]`
 * (`cabezas`, `pesoBruto`, `pesoNeto` de cada línea).
 *
 * El cierre de compra (`cerrada`) es una acción aparte (ver
 * `use-cases/cerrar-compra.use-case.ts`): reconcilia que las cabezas vendidas
 * en `ventas` (garrones DISTINTOS, no filas — cada garrón tiene 2 medias
 * reses) coincidan con la suma de `cabezas` de las categorías, y ahí recién
 * se completan `pesoFinalVenta` (suma de kg vendidos) y `rinde`
 * (`pesoFinalVenta / pesoNeto total * 100`).
 */
export interface Compra {
  id: string;
  empresaId: string;
  proveedorId: string;
  numero: string;
  especie: EspecieAnimal;
  letra: string | null;
  fecha: Date;
  dte: string;
  remito: string;
  porcentajeDesbaste: number;
  cerrada: boolean;
  fechaCierre: Date | null;
  pesoFinalVenta: number | null;
  rinde: number | null;
  comentarios: string | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
