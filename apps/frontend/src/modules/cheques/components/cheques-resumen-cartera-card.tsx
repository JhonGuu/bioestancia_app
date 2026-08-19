import { CheckCircle2, Wallet } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { esListoParaCobrar, type Cheque } from "@/modules/cheques/domain/cheque.types";

interface ChequesResumenCarteraCardProps {
  /** Cheques EN_CARTERA (sin más filtro) — independiente del filtro de estado que tenga la tabla de abajo. */
  chequesEnCartera: Cheque[];
}

const formatoMoneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

/** Resumen rápido: cuánto hay en cartera y cuánto de eso ya está listo para llevar al banco. */
export function ChequesResumenCarteraCard({ chequesEnCartera }: ChequesResumenCarteraCardProps) {
  const totalCartera = chequesEnCartera.reduce((acc, c) => acc + c.monto, 0);
  const listos = chequesEnCartera.filter(esListoParaCobrar);
  const totalListos = listos.reduce((acc, c) => acc + c.monto, 0);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card>
        <CardContent className="flex items-center gap-3 py-4">
          <Wallet className="text-muted-foreground size-8" />
          <div>
            <p className="text-muted-foreground text-xs">Total en cartera ({chequesEnCartera.length} cheques)</p>
            <p className="text-xl font-semibold">{formatoMoneda.format(totalCartera)}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/15">
        <CardContent className="flex items-center gap-3 py-4">
          <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="text-emerald-800/70 text-xs dark:text-emerald-300/80">
              Listos para cobrar ({listos.length} cheques)
            </p>
            <p className="text-xl font-semibold text-emerald-800 dark:text-emerald-300">
              {formatoMoneda.format(totalListos)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
