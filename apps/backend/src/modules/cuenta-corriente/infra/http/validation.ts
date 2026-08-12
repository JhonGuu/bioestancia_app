import { injectable } from "inversify";
import { z } from "zod";

const clienteParams = z.object({
  clienteId: z.string().uuid("clienteId inválido"),
});

@injectable()
export class CuentaCorrienteValidation {
  saldo = { params: clienteParams };

  movimientos = { params: clienteParams };

  resumenPdf = { params: clienteParams };

  resumenExcel = { params: clienteParams };
}
