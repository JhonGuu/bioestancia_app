import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import { Cliente, nombreCliente } from "@/modules/clientes/domain/cliente";
import { Proveedor } from "@/modules/proveedores/domain/proveedor";
import { Frigorifico } from "@/modules/frigorificos/domain/frigorifico";

function nombreProveedor(proveedor: Proveedor): string {
  return proveedor.razonSocial ?? [proveedor.nombre, proveedor.apellido].filter(Boolean).join(" ");
}

function normalizar(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export interface CatalogosAuxiliares {
  clientes: Cliente[];
  proveedores: Proveedor[];
  frigorificos: Frigorifico[];
}

/**
 * Resuelve el auxiliar de una línea (asiento o saldo inicial) a partir de
 * lo que vino en el Excel. Para cliente/proveedor/frigorífico matchea por
 * nombre exacto (insensible a mayúsculas/tildes) contra los catálogos ya
 * cargados en la empresa — mucho más cómodo que pedirle al usuario que
 * escriba un UUID a mano. Para empleado/cuenta de fondos/cheque (que
 * todavía no tienen selector propio ni acá ni en el formulario manual) se
 * toma el texto tal cual como ID — mismo trade-off de fase 1 que
 * `AuxiliarPicker` en el frontend.
 */
export function resolverAuxiliar(
  tipo: TipoAuxiliar,
  texto: string,
  catalogos: CatalogosAuxiliares,
): { auxiliarId: string | null; error?: string } {
  if (tipo === TipoAuxiliar.NINGUNO) return { auxiliarId: null };
  if (!texto) return { auxiliarId: null, error: `hay que indicar ${tipo}` };

  const normalizado = normalizar(texto);

  if (tipo === TipoAuxiliar.CLIENTE) {
    const match = catalogos.clientes.find((c) => normalizar(nombreCliente(c)) === normalizado);
    return match ? { auxiliarId: match.id } : { auxiliarId: null, error: `no se encontró un cliente llamado "${texto}"` };
  }
  if (tipo === TipoAuxiliar.PROVEEDOR) {
    const match = catalogos.proveedores.find((p) => normalizar(nombreProveedor(p)) === normalizado);
    return match ? { auxiliarId: match.id } : { auxiliarId: null, error: `no se encontró un proveedor llamado "${texto}"` };
  }
  if (tipo === TipoAuxiliar.FRIGORIFICO) {
    const match = catalogos.frigorificos.find((f) => normalizar(f.nombre) === normalizado);
    return match ? { auxiliarId: match.id } : { auxiliarId: null, error: `no se encontró un frigorífico llamado "${texto}"` };
  }

  // Empleado / cuenta de fondos / cheque: todavía no tienen selector propio — se toma el texto tal cual como ID.
  return { auxiliarId: texto };
}
