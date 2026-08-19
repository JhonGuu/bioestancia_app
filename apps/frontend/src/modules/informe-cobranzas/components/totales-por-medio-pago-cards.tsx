import { Card, CardContent } from "@/components/ui/card";
import { MEDIO_PAGO_LABELS } from "@/modules/cobros/domain/cobro.types";
import type { TotalPorMedioPago } from "@/modules/informe-cobranzas/domain/informe-cobranzas.types";

interface TotalesPorMedioPagoCardsProps {
  totales: TotalPorMedioPago[];
  totalGeneral: number;
  cantidadLineas: number;
}

const formatoMoneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

/** Una tarjeta por medio de pago presente + una final de total general, destacada. */
export function TotalesPorMedioPagoCards({ totales, totalGeneral, cantidadLineas }: TotalesPorMedioPagoCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {totales.map((total) => (
        <Card key={total.medioPago}>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              {MEDIO_PAGO_LABELS[total.medioPago]} ({total.cantidad})
            </p>
            <p className="text-lg font-semibold">{formatoMoneda.format(total.total)}</p>
          </CardContent>
        </Card>
      ))}
      <Card className="border-primary/50">
        <CardContent>
          <p className="text-muted-foreground text-xs">Total general ({cantidadLineas})</p>
          <p className="text-primary text-lg font-semibold">{formatoMoneda.format(totalGeneral)}</p>
        </CardContent>
      </Card>
    </div>
  );
}
