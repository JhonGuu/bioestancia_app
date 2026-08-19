import {
  BANDA_COBRANZA_EMOJI,
  BANDA_COBRANZA_LABELS,
  BANDA_COBRANZA_ORDEN,
  BANDA_COBRANZA_UMBRAL,
} from "@/modules/porcentaje-cobranza/domain/porcentaje-cobranza.types";
import { BANDA_COBRANZA_CLASSNAME } from "@/modules/porcentaje-cobranza/components/banda-cobranza-styles";
import { cn } from "@/lib/utils";

/** Referencia de colores — mismo texto que la leyenda de "VENTAS 2026.xlsm". */
export function BandaCobranzaLegend() {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {BANDA_COBRANZA_ORDEN.map((banda) => (
        <span
          key={banda}
          className={cn("flex items-center gap-1 rounded-md px-2 py-1", BANDA_COBRANZA_CLASSNAME[banda])}
        >
          <span>{BANDA_COBRANZA_EMOJI[banda]}</span>
          <span className="font-medium">{BANDA_COBRANZA_UMBRAL[banda]}</span>
          <span>— {BANDA_COBRANZA_LABELS[banda]}</span>
        </span>
      ))}
    </div>
  );
}
