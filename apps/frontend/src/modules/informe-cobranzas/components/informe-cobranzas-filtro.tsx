import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RangoFechasFiltro } from "@/shared/components/rango-fechas-filtro";
import type { RangoFechas } from "@/shared/lib/rango-fechas";
import { MedioPago, MEDIO_PAGO_LABELS } from "@/modules/cobros/domain/cobro.types";

const TODOS_LOS_MEDIOS = "todos";

interface InformeCobranzasFiltroProps {
  rango: RangoFechas | null;
  onChangeRango: (rango: RangoFechas | null) => void;
  medioPago: MedioPago | null;
  onChangeMedioPago: (medioPago: MedioPago | null) => void;
  cantidadResultados: number;
}

/** Filtro del informe de cobranzas: rango de fechas (con atajos) + medio de pago. */
export function InformeCobranzasFiltro({
  rango,
  onChangeRango,
  medioPago,
  onChangeMedioPago,
  cantidadResultados,
}: InformeCobranzasFiltroProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <RangoFechasFiltro rango={rango} onChange={onChangeRango} />
        <div className="space-y-1">
          <label className="text-muted-foreground text-xs font-medium">Medio de pago</label>
          <Select
            value={medioPago ?? TODOS_LOS_MEDIOS}
            onValueChange={(v) => onChangeMedioPago(v === TODOS_LOS_MEDIOS ? null : (v as MedioPago))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS_LOS_MEDIOS}>Todos los medios</SelectItem>
              {Object.values(MedioPago).map((valor) => (
                <SelectItem key={valor} value={valor}>
                  {MEDIO_PAGO_LABELS[valor]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="text-muted-foreground text-sm">
        {cantidadResultados} {cantidadResultados === 1 ? "línea de cobro" : "líneas de cobro"}
        {rango ? "" : " · todo el historial"}
      </p>
    </div>
  );
}
