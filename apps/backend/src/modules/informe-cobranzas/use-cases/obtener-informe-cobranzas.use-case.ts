import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { EmpresaRepository } from "@/modules/empresas/domain/empresa.repository";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { Cliente, nombreCliente } from "@/modules/clientes/domain/cliente";
import { CobroRepository } from "@/modules/cobros/domain/cobro.repository";
import { ChequeRepository } from "@/modules/cheques/domain/cheque.repository";
import { Cheque } from "@/modules/cheques/domain/cheque";
import { construirDetalleLineas } from "@/modules/cobros/domain/detalle-linea-cobro";
import { MedioPago } from "@/modules/cobros/domain/medio-pago";
import { InformeCobranzas, LineaInformeCobranza, TotalPorMedioPago } from "@/modules/informe-cobranzas/domain/informe-cobranzas";

export interface ObtenerInformeCobranzasInput {
  empresaId: string;
  /** Inclusive — si no viene, no hay piso (se incluye desde el cobro más viejo). */
  desde?: Date;
  /** Inclusive (se compara contra el día completo, no la medianoche) — si no viene, no hay techo. */
  hasta?: Date;
  /** Si viene, solo se incluyen las líneas de ese medio de pago. */
  medioPago?: MedioPago;
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Arma el "informe de cobranzas": todas las líneas de cobro (efectivo,
 * transferencias, cheques) de TODOS los clientes de la empresa en el rango
 * pedido, más viejo primero, con los totales por medio de pago — pensado
 * para que administración controle que todo lo cobrado esté bien registrado
 * (cruzarlo contra extractos bancarios, arqueo de caja, etc.) sin tener que
 * entrar cliente por cliente como sí hace el resumen de cuenta
 * (`ObtenerResumenCuentaData`).
 *
 * El filtro de fecha se aplica sobre `Cobro.fecha` (no sobre cuándo se
 * cobró cada cheque) — mismo campo que ya usa la cuenta corriente para
 * ubicar el cobro en el tiempo.
 */
@injectable()
export class ObtenerInformeCobranzas {
  constructor(
    @inject(DI_TYPES.EmpresaRepository) private readonly empresaRepository: EmpresaRepository,
    @inject(DI_TYPES.ClienteRepository) private readonly clienteRepository: ClienteRepository,
    @inject(DI_TYPES.CobroRepository) private readonly cobroRepository: CobroRepository,
    @inject(DI_TYPES.ChequeRepository) private readonly chequeRepository: ChequeRepository,
  ) {}

  async execute(input: ObtenerInformeCobranzasInput): Promise<InformeCobranzas> {
    const empresa = await this.empresaRepository.getById(input.empresaId);
    if (!empresa) {
      throw new ApiError("Empresa no encontrada", Code.NOT_FOUND);
    }

    const [clientes, cobros, cheques] = await Promise.all([
      this.clienteRepository.list(input.empresaId),
      this.cobroRepository.list(input.empresaId),
      this.chequeRepository.list(input.empresaId),
    ]);
    const clientesPorId = new Map<string, Cliente>(clientes.map((c) => [c.id, c]));
    const chequesPorId = new Map<string, Cheque>(cheques.map((c) => [c.id, c]));

    // `hasta` es inclusive del día completo — se compara contra el instante
    // siguiente a medianoche de ese día (mismo criterio "hasta exclusivo"
    // que `BoletaRepository.listByRango`, solo que acá el llamador manda un
    // día calendario pensado como inclusive, así que se le suma 1 día antes
    // de comparar).
    const hastaExclusiva = input.hasta ? new Date(input.hasta.getTime() + 24 * 60 * 60 * 1000) : null;

    const lineas: LineaInformeCobranza[] = [];
    for (const cobro of cobros) {
      if (!cobro.activo) continue;
      if (input.desde && cobro.fecha < input.desde) continue;
      if (hastaExclusiva && cobro.fecha >= hastaExclusiva) continue;

      const cliente = clientesPorId.get(cobro.clienteId);
      const detalleLineas = construirDetalleLineas(cobro.lineas, chequesPorId);
      for (const detalle of detalleLineas) {
        if (input.medioPago && detalle.medioPago !== input.medioPago) continue;
        lineas.push({
          ...detalle,
          cobroId: cobro.id,
          fecha: cobro.fecha,
          clienteId: cobro.clienteId,
          clienteNombre: cliente ? nombreCliente(cliente) : "Cliente eliminado",
          comentarios: cobro.comentarios,
        });
      }
    }

    // Más viejo primero (mismo orden "libro contable" que el resumen de
    // cuenta), y a igualdad de fecha, por cliente — así las líneas de un
    // mismo día quedan agrupadas visualmente en el PDF/Excel.
    lineas.sort((a, b) => {
      const diff = a.fecha.getTime() - b.fecha.getTime();
      return diff !== 0 ? diff : a.clienteNombre.localeCompare(b.clienteNombre);
    });

    const totalesPorMedio = new Map<MedioPago, { cantidad: number; total: number }>();
    let totalGeneral = 0;
    for (const linea of lineas) {
      const actual = totalesPorMedio.get(linea.medioPago) ?? { cantidad: 0, total: 0 };
      totalesPorMedio.set(linea.medioPago, { cantidad: actual.cantidad + 1, total: redondear(actual.total + linea.monto) });
      totalGeneral = redondear(totalGeneral + linea.monto);
    }
    const totalesPorMedioPago: TotalPorMedioPago[] = Object.values(MedioPago)
      .filter((medioPago) => totalesPorMedio.has(medioPago))
      .map((medioPago) => ({ medioPago, ...totalesPorMedio.get(medioPago)! }));

    return {
      empresa,
      desde: input.desde ?? null,
      hasta: input.hasta ?? null,
      medioPagoFiltrado: input.medioPago ?? null,
      lineas,
      totalesPorMedioPago,
      totalGeneral,
      generadoEn: new Date(),
    };
  }
}
