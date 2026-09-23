import { ApiError, Code } from "@/shared/infra/http/api.responses";

/**
 * Error 409 al cargar algo que ya existe en la empresa (mismo CUIT o misma
 * patente). Si el existente está dado de baja se avisa, para que se lo
 * reactive en vez de intentar cargarlo de nuevo.
 */
export function errorDuplicado(
  entidad: string,
  campo: string,
  valor: string,
  existenteInactivo: boolean,
): ApiError {
  const base = `Ya existe ${entidad} con ${campo} ${valor}`;
  return new ApiError(
    existenteInactivo ? `${base}, pero está inactivo: reactivalo desde el listado` : base,
    Code.CONFLICT,
  );
}
