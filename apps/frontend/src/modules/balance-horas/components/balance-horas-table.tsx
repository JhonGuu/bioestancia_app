import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { BalanceHorasEmpleado } from "@/modules/balance-horas/domain/balance-horas.types";

interface BalanceHorasTableProps {
  empleados: BalanceHorasEmpleado[];
}

function formatHoras(horas: number): string {
  return horas.toFixed(2).replace(/\.00$/, "");
}

export function BalanceHorasTable({ empleados }: BalanceHorasTableProps) {
  if (empleados.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No hay empleados activos para mostrar en este período.
      </p>
    );
  }

  // Más horas extra primero — para decidir a quién no asignarle extras la próxima vez.
  const ordenados = [...empleados].sort((a, b) => b.horasExtra - a.horasExtra);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Empleado</TableHead>
          <TableHead>Cargo</TableHead>
          <TableHead>Hs. normales</TableHead>
          <TableHead>Hs. extra</TableHead>
          <TableHead>Faltas</TableHead>
          <TableHead>Llegadas tarde</TableHead>
          <TableHead>Marcaciones incompletas</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ordenados.map((empleado) => (
          <TableRow key={empleado.empleadoId}>
            <TableCell className="font-medium">{empleado.empleadoNombre}</TableCell>
            <TableCell className="text-muted-foreground">{empleado.cargoNombre ?? "—"}</TableCell>
            <TableCell>{formatHoras(empleado.horasNormales)}</TableCell>
            <TableCell>
              {empleado.horasExtra > 0 ? (
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                >
                  {formatHoras(empleado.horasExtra)}
                </Badge>
              ) : (
                formatHoras(empleado.horasExtra)
              )}
            </TableCell>
            <TableCell>
              {empleado.cantidadFaltas > 0 ? (
                <Badge
                  variant="outline"
                  className="bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                >
                  {empleado.cantidadFaltas}
                </Badge>
              ) : (
                0
              )}
            </TableCell>
            <TableCell>{empleado.cantidadLlegadasTarde}</TableCell>
            <TableCell>{empleado.cantidadMarcacionesIncompletas}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
