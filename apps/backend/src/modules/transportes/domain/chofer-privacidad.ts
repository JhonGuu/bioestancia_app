import { Chofer } from "@/modules/transportes/domain/chofer";

/**
 * DNI y vencimiento de licencia son datos personales del chofer: solo los ve
 * quien tiene el permiso `VER_DATOS_CHOFERES`. El resto recibe el chofer con
 * esos dos campos en `null`. El CUIT, en cambio, se muestra siempre: es lo que
 * se necesita para armar el remito.
 */
export function ocultarDatosPersonales(chofer: Chofer): Chofer {
  return { ...chofer, dni: null, licenciaVencimiento: null };
}
