import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PeriodoFiltro,
  PERIODO_FILTRO_LABELS,
  describirPeriodo,
  hoyISO,
} from "@/modules/boletas/domain/filtro-periodo";

interface BoletasFiltroProps {
  periodo: PeriodoFiltro;
  fechaReferencia: string;
  onChangePeriodo: (periodo: PeriodoFiltro) => void;
  onChangeFecha: (fecha: string) => void;
  cantidadResultados: number;
}

const ETIQUETA_FECHA: Record<PeriodoFiltro, string> = {
  [PeriodoFiltro.DIA]: "Elegí el día",
  [PeriodoFiltro.SEMANA]: "Elegí cualquier día de esa semana",
  [PeriodoFiltro.MES]: "Elegí cualquier día de ese mes",
  [PeriodoFiltro.ANIO]: "Elegí cualquier día de ese año",
  [PeriodoFiltro.TODAS]: "",
};

/**
 * Filtro de boletas por período — día/semana/mes/año, todos calculados a
 * partir de UN solo `<input type="date">` (en vez de widgets separados de
 * mes/semana/año, que tienen soporte flojo o inconsistente entre
 * navegadores/celulares): en modo "semana" por ejemplo, el usuario elige
 * cualquier día de la semana que quiere ver, y `filtrarBoletasPorPeriodo`
 * calcula el rango lunes-domingo. Ver `domain/filtro-periodo.ts`.
 */
export function BoletasFiltro({
  periodo,
  fechaReferencia,
  onChangePeriodo,
  onChangeFecha,
  cantidadResultados,
}: BoletasFiltroProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-md border p-1">
          {Object.values(PeriodoFiltro).map((valor) => (
            <button
              key={valor}
              type="button"
              onClick={() => onChangePeriodo(valor)}
              className={cn(
                "rounded px-3 py-1.5 text-sm font-medium transition-colors",
                periodo === valor
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent",
              )}
            >
              {PERIODO_FILTRO_LABELS[valor]}
            </button>
          ))}
        </div>

        {periodo !== PeriodoFiltro.TODAS && (
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <label className="text-muted-foreground text-xs font-medium">
                {ETIQUETA_FECHA[periodo]}
              </label>
              <Input
                type="date"
                value={fechaReferencia}
                onChange={(e) => onChangeFecha(e.target.value)}
                className="w-fit"
              />
            </div>
            <Button type="button" variant="outline" onClick={() => onChangeFecha(hoyISO())}>
              Hoy
            </Button>
          </div>
        )}
      </div>

      <p className="text-muted-foreground text-sm">
        {describirPeriodo(periodo, fechaReferencia)} — {cantidadResultados}{" "}
        {cantidadResultados === 1 ? "boleta" : "boletas"}
      </p>
    </div>
  );
}
