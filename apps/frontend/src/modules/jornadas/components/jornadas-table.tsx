import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ESTADO_JORNADA_BADGE_CLASSNAME,
  ESTADO_JORNADA_LABELS,
} from "@/modules/jornadas/domain/jornada-enum-labels";
import { EstadoJornada, type Jornada, type ParFichaje } from "@/modules/jornadas/domain/jornada.types";

interface JornadasTableProps {
  jornadas: Jornada[];
}

function formatHora(momento: string): string {
  return new Date(momento).toISOString().slice(11, 16);
}

function formatFecha(fecha: string): string {
  return new Date(`${fecha}T00:00:00.000Z`).toLocaleDateString("es-AR", {
    timeZone: "UTC",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

function formatHorario(horarioPactado: Jornada["horarioPactado"]): string {
  if (!horarioPactado || (!horarioPactado.horaEntrada && !horarioPactado.horaSalida)) return "Franco";
  return `${horarioPactado.horaEntrada ?? "—"} a ${horarioPactado.horaSalida ?? "—"}`;
}

function formatPares(pares: ParFichaje[]): string {
  if (pares.length === 0) return "—";
  return pares
    .map((par) => `${par.entrada ? formatHora(par.entrada.momento) : "?"} → ${par.salida ? formatHora(par.salida.momento) : "?"}`)
    .join(" · ");
}

function formatHoras(horas: number): string {
  return horas.toFixed(2).replace(/\.00$/, "");
}

export function JornadasTable({ jornadas }: JornadasTableProps) {
  if (jornadas.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No hay jornadas para el rango de fechas elegido.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Horario pactado</TableHead>
          <TableHead>Marcaciones</TableHead>
          <TableHead>Hs. normales</TableHead>
          <TableHead>Hs. extra</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jornadas.map((jornada) => (
          <TableRow key={jornada.fecha}>
            <TableCell className="font-medium capitalize">{formatFecha(jornada.fecha)}</TableCell>
            <TableCell className="text-muted-foreground">{formatHorario(jornada.horarioPactado)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <span>{formatPares(jornada.pares)}</span>
                {jornada.tieneMarcacionManual && (
                  <Badge variant="outline" className="shrink-0" title="Incluye marcación cargada a mano">
                    manual
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell>{formatHoras(jornada.horasNormales)}</TableCell>
            <TableCell>{formatHoras(jornada.horasExtra)}</TableCell>
            <TableCell>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className={ESTADO_JORNADA_BADGE_CLASSNAME[jornada.estado]}>
                  {ESTADO_JORNADA_LABELS[jornada.estado]}
                </Badge>
                {jornada.llegadaTarde && jornada.estado === EstadoJornada.PRESENTE && (
                  <Badge
                    variant="outline"
                    className="bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400"
                  >
                    Llegada tarde
                  </Badge>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
