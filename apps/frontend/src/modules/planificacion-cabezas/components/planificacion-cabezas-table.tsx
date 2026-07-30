import { useMemo } from "react";
import { Pencil } from "lucide-react";

import { nombreCliente, type Cliente } from "@/modules/clientes/domain/cliente.types";
import type {
  PlanificacionCabezasFila,
  ResumenPeriodoAnterior,
} from "@/modules/planificacion-cabezas/domain/planificacion-cabezas.types";
import { EditableCabezasCell } from "@/modules/planificacion-cabezas/components/editable-cabezas-cell";
import {
  formatoCorto,
  formatoISO,
  nombreDiaSemana,
} from "@/modules/planificacion-cabezas/lib/date-range";
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

interface PlanificacionCabezasTableProps {
  clientes: Cliente[];
  dias: Date[];
  filas: PlanificacionCabezasFila[];
  periodoAnterior: ResumenPeriodoAnterior;
  /** Etiqueta del período visible ahora (ej. "Esta semana") — para no confundirlo con `periodoAnterior`. */
  etiquetaActual: string;
  puedeEditar: boolean;
  onCommitDia: (clienteId: string, fecha: string, cabezasPlanificadas: number) => void;
  /** Mueve el cursor al período de referencia (el anterior al que se ve ahora) para poder editarlo. */
  onEditarAnterior: () => void;
}

/**
 * Grilla cliente × día para las vistas "día" y "semana" (por eso a lo sumo 7
 * columnas de día): dos columnas de referencia con lo del período anterior
 * (vendido real vs. lo que se había planificado — no son el mismo número) +
 * un input editable por día con lo planificado y, debajo, lo realmente
 * entregado ese día (cruce con ventas, ver backend).
 */
export function PlanificacionCabezasTable({
  clientes,
  dias,
  filas,
  periodoAnterior,
  etiquetaActual,
  puedeEditar,
  onCommitDia,
  onEditarAnterior,
}: PlanificacionCabezasTableProps) {
  const filaPorClienteYDia = useMemo(() => {
    const mapa = new Map<string, PlanificacionCabezasFila>();
    for (const fila of filas) {
      mapa.set(`${fila.clienteId}|${fila.fecha.slice(0, 10)}`, fila);
    }
    return mapa;
  }, [filas]);

  const totalesPorDia = useMemo(() => {
    const totales = new Map<string, number>();
    for (const dia of dias) {
      const clave = formatoISO(dia);
      let total = 0;
      for (const cliente of clientes) {
        total += filaPorClienteYDia.get(`${cliente.id}|${clave}`)?.cabezasPlanificadas ?? 0;
      }
      totales.set(clave, total);
    }
    return totales;
  }, [dias, clientes, filaPorClienteYDia]);

  /**
   * Suma, por cliente, lo planificado en todos los días visibles — se
   * recalcula solo con lo que ya está guardado (`filas`), así que se
   * actualiza apenas se confirma un input y termina el refetch, no tecla por
   * tecla mientras se escribe.
   */
  const totalPlanificadoPorCliente = useMemo(() => {
    const totales = new Map<string, number>();
    for (const cliente of clientes) {
      let total = 0;
      for (const dia of dias) {
        const clave = formatoISO(dia);
        total += filaPorClienteYDia.get(`${cliente.id}|${clave}`)?.cabezasPlanificadas ?? 0;
      }
      totales.set(cliente.id, total);
    }
    return totales;
  }, [clientes, dias, filaPorClienteYDia]);

  const totalPlanificadoGeneral = clientes.reduce(
    (acc, cliente) => acc + (totalPlanificadoPorCliente.get(cliente.id) ?? 0),
    0,
  );

  const totalAnteriorReal = clientes.reduce(
    (acc, cliente) => acc + (periodoAnterior.vendidoReal.get(cliente.id) ?? 0),
    0,
  );
  const totalAnteriorPlanificado = clientes.reduce(
    (acc, cliente) => acc + (periodoAnterior.planificado.get(cliente.id) ?? 0),
    0,
  );

  if (clientes.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No hay clientes para mostrar.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead rowSpan={2} className="bg-background sticky left-0 align-bottom">
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
                    title="Ir a ese período para editar lo planificado"
                  >
                    <Pencil className="size-3" />
                    Editar
                  </Button>
                )}
              </div>
            </TableHead>
            <TableHead className="bg-primary/5 border-l text-center whitespace-nowrap">
              {etiquetaActual}
            </TableHead>
            {dias.map((dia) => (
              <TableHead
                key={formatoISO(dia)}
                rowSpan={2}
                className="text-center align-bottom whitespace-nowrap"
              >
                {nombreDiaSemana(dia)} {formatoCorto(dia)}
              </TableHead>
            ))}
          </TableRow>
          <TableRow>
            <TableHead className="text-muted-foreground border-l text-center text-xs font-normal">
              Vendido real
            </TableHead>
            <TableHead className="text-muted-foreground text-center text-xs font-normal">
              Se planificó
            </TableHead>
            <TableHead className="bg-primary/5 border-l text-center text-xs font-semibold whitespace-nowrap">
              Total planificado
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientes.map((cliente) => (
            <TableRow key={cliente.id}>
              <TableCell className="bg-background sticky left-0 font-medium whitespace-nowrap">
                {nombreCliente(cliente)}
              </TableCell>
              <TableCell className="border-l text-center font-medium">
                {periodoAnterior.vendidoReal.get(cliente.id) ?? 0}
              </TableCell>
              <TableCell className="text-muted-foreground text-center">
                {periodoAnterior.planificado.get(cliente.id) ?? 0}
              </TableCell>
              <TableCell className="bg-primary/5 border-l text-center font-semibold">
                {totalPlanificadoPorCliente.get(cliente.id) ?? 0}
              </TableCell>
              {dias.map((dia) => {
                const clave = formatoISO(dia);
                const fila = filaPorClienteYDia.get(`${cliente.id}|${clave}`);
                return (
                  <TableCell key={clave} className="p-1 text-center">
                    <EditableCabezasCell
                      value={fila?.cabezasPlanificadas ?? 0}
                      vendidas={fila?.cabezasVendidas ?? 0}
                      disabled={!puedeEditar}
                      onCommit={(nuevoValor) => onCommitDia(cliente.id, clave, nuevoValor)}
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="sticky left-0">Total</TableCell>
            <TableCell className="border-l text-center">{totalAnteriorReal}</TableCell>
            <TableCell className="text-center">{totalAnteriorPlanificado}</TableCell>
            <TableCell className="bg-primary/5 border-l text-center font-semibold">
              {totalPlanificadoGeneral}
            </TableCell>
            {dias.map((dia) => (
              <TableCell key={formatoISO(dia)} className="text-center">
                {totalesPorDia.get(formatoISO(dia)) ?? 0}
              </TableCell>
            ))}
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
