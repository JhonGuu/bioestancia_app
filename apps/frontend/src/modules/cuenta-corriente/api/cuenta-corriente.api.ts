import { httpClient, unwrap } from "@/shared/api/http-client";
import { filenameFromContentDisposition } from "@/shared/lib/download-blob";
import type { SaldoCliente } from "@/modules/cuenta-corriente/domain/saldo-cliente.types";
import type { MovimientoCuentaCorriente } from "@/modules/cuenta-corriente/domain/movimiento-cuenta-corriente.types";

export interface ArchivoDescargado {
  blob: Blob;
  filename: string;
}

export const cuentaCorrienteApi = {
  getSaldo(clienteId: string): Promise<SaldoCliente> {
    return unwrap(httpClient.get(`/cuenta-corriente/${clienteId}/saldo`));
  },

  /** Saldo de TODOS los clientes de la empresa activa, de una — para el listado de cuenta corriente. */
  getSaldos(): Promise<SaldoCliente[]> {
    return unwrap(httpClient.get(`/cuenta-corriente/saldos`));
  },

  /** Línea de tiempo de boletas, cobros y cargos del cliente, más reciente primero. */
  getMovimientos(clienteId: string): Promise<MovimientoCuentaCorriente[]> {
    return unwrap(httpClient.get(`/cuenta-corriente/${clienteId}/movimientos`));
  },

  /** PDF del resumen de cuenta (saldo + movimientos) — pensado para mandárselo al cliente. */
  async descargarResumenPdf(clienteId: string): Promise<ArchivoDescargado> {
    const response = await httpClient.get(`/cuenta-corriente/${clienteId}/resumen/pdf`, {
      responseType: "blob",
    });
    return {
      blob: response.data,
      filename: filenameFromContentDisposition(response.headers, "resumen-cuenta.pdf"),
    };
  },

  /** Igual que `descargarResumenPdf`, pero en Excel (.xlsx). */
  async descargarResumenExcel(clienteId: string): Promise<ArchivoDescargado> {
    const response = await httpClient.get(`/cuenta-corriente/${clienteId}/resumen/excel`, {
      responseType: "blob",
    });
    return {
      blob: response.data,
      filename: filenameFromContentDisposition(response.headers, "resumen-cuenta.xlsx"),
    };
  },
};
