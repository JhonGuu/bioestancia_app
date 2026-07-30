/**
 * Códigos de "carácter" (categoría del sujeto) del servicio web WSLSP
 * (Liquidación Sector Pecuario) de AFIP para la especie porcina —
 * `consultarCategorias` en el manual oficial WSLSP. Se usan al emitir una
 * liquidación de compra: identifican qué rol cumple la contraparte en la
 * operación (productor, invernador, frigorífico, etc.).
 *
 * Guardamos el código y la descripción juntos en un solo valor (ej.
 * "100 - Productores/Criadores Comerciales - Porcinos") porque así es como
 * se necesita para armar la liquidación — separarlos en dos columnas no
 * aporta nada acá.
 *
 * Lista completa extraída del manual WSLSP (sección "Consultar Categorías",
 * ejemplo de respuesta con `caracterPorcino`). Todo proveedor de Bioestancia
 * es hoy un criadero (código 100), pero se deja el enum completo por si en
 * el futuro se cargan proveedores con otro rol (invernador, frigorífico...).
 */
export enum CodigoAfipPorcino {
  PRODUCTORES_CRIADORES_COMERCIALES = "100 - Productores/Criadores Comerciales - Porcinos",
  INVERNADORES = "101 - Invernadores - Porcinos",
  MATADERO_FRIGORIFICO = "102 - Matadero - Frigorífico - Porcinos",
  MATARIFES_ABASTECEDORES = "103 - Matarifes abastecedores y carniceros y usuarios de faena porcina - Porcinos",
  CONSIGNATARIOS_COMISIONISTAS_HACIENDA = "104 - Consignatarios y/o comisionistas de hacienda - Porcinos",
  CONSIGNATARIOS_DIRECTOS = "105 - Consignatarios directos - Porcinos",
  CONSIGNATARIOS_COMISIONISTAS_CARNES = "106 - Consignatario y/o comisionistas de Carnes - Porcinos",
}
