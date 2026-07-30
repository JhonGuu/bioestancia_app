import { useMemo } from "react";
import { Pencil } from "lucide-react";

import { nombreCliente, type Cliente } from "@/modules/clientes/domain/cliente.types";
import type {
  PlanificacionCabezasFila,
  ResumenPeriodoAnterior,
} from "@/modules/planificacion-cabezas/domain/planificacion-cabezas.types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PlanificacionCabezasResumenMensualProps {
  clientes: Cliente[];
  filas: PlanificacionCabezasFila[];
  periodoAnterior: ResumenPeriodoAnterior;
  puedeEditar: boolean;
  /** Cambia a vista semana, ubicada en el mes de referencia, para poder editar día por día. */
  onEditarAnterior: () => void;
}

/**
 * Vista "mes": editar día por día no tiene sentido con hasta 31 columnas, así
 * que acá se muestra un resumen de solo lectura — planificado vs. entregado
 * de este mes, y (como referencia) vendido real vs. planificado del mes
 * anterior. Para editar el plan de cualquier mes hay que ir a día o semana
 * (el botón "Editar" salta directo a la vista semana del mes de referencia).
 */
export function PlanificacionCabezasResumenMensual({
  clientes,
  filas,
  periodoAnterior,
  puedeEditar,
  onEditarAnterior,
}: PlanificacionCabezasResumenMensualProps) {
  const totalesPorCliente = useMemo(() => {
    const totales = new Map<string, { planificadas: number; entregadas: number }>();
    for (const fila of filas) {
      const actual = totales.get(fila.clienteId) ?? { planificadas: 0, entregadas: 0 };
      actual.planificadas += fila.cabezasPlanificadas;
      actual.entregadas += fila.cabezasVendidas;
      totales.set(fila.clienteId, actual);
    }
    return totales;
  }, [filas]);

  if (clientes.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No hay clientes para mostrar.
      </p>
    );
  }

  const totalAnteriorReal = clientes.reduce(
    (acc, cliente) => acc + (periodoAnterior.vendidoReal.get(cliente.id) ?? 0),
    0,
  );
  const totalAnteriorPlanificado = clientes.reduce(
    (acc, cliente) => acc + (periodoAnterior.planificado.get(cliente.id) ?? 0),
    0,
  );
  const totalPlanificado = clientes.reduce(
    (acc, cliente) => acc + (totalesPorCliente.get(cliente.id)?.planificadas ?? 0),
    0,
  );
  const totalEntregado = clientes.reduce(
    (acc, cliente) => acc + (totalesPorCliente.get(cliente.id)?.entregadas ?? 0),
    0,
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead rowSpan={2} className="align-bottom">
              Cliente
            </TableHead>
            <TableHead colSpan={2} className="border-l text-center whitespace-nowrap">
              <div className="flex items-center justify-center gap-1.5">
                {periodoAnterior.etiqueta}
                {puedeEditar && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 gap-1 px-1.5 text-xs font-normal"
                    onClick={onEditarAnterior}
                    title="Ir a la vista semana de ese mes para editar lo planificado"
                  >
                    <Pencil className="size-3" />
                    Editar
                  </Button>
                )}
              </div>
            </TableHead>
            <TableHead rowSpan={2} className="text-center align-bottom">
              Planificado (mes)
            </TableHead>
            <TableHead rowSpan={2} className="text-center align-bottom">
              Entregado (mes)
            </TableHead>
          </TableRow>
          <TableRow>
            <TableHead className="text-muted-foreground border-l text-center text-xs font-normal">
              Vendido real
            </TableHead>
            <TableHead className="text-muted-foreground text-center text-xs font-normal">
              Se planificó
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientes.map((cliente) => {
            const totales = totalesPorCliente.get(cliente.id) ?? {
              planificadas: 0,
              entregadas: 0,
            };
            return (
              <TableRow key={cliente.id}>
                <TableCell className="font-medium">{nombreCliente(cliente)}</TableCell>
                <TableCell className="border-l text-center font-medium">
                  {periodoAnterior.vendidoReal.get(cliente.id) ?? 0}
                </TableCell>
                <TableCell className="text-muted-foreground text-center">
                  {periodoAnterior.planificado.get(cliente.id) ?? 0}
                </TableCell>
                <TableCell className="text-center">{totales.planificadas}</TableCell>
                <TableCell className="text-center">{totales.entregadas}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
            <TableCell className="border-l text-center">{totalAnteriorReal}</TableCell>
            <TableCell className="text-center">{totalAnteriorPlanificado}</TableCell>
            <TableCell className="text-center">{totalPlanificado}</TableCell>
            <TableCell className="text-center">{totalEntregado}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
