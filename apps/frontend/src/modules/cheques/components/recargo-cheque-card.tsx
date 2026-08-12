import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSugerenciaRecargoCheque } from "@/modules/cheques/hooks/use-sugerencia-recargo-cheque";
import { useConfirmarRecargoCheque } from "@/modules/cheques/hooks/use-confirmar-recargo-cheque";
import { ApiError } from "@/shared/api/api-response";

interface RecargoChequeCardProps {
  chequeId: string;
}

/**
 * Recargo del 5% por cheque entregado a más de 7 días de la fecha de
 * cobro — se muestra siempre (no depende del estado del cheque), con
 * confirmación manual (ver `docs/plan-ventas-cuenta-corriente.md`).
 */
export function RecargoChequeCard({ chequeId }: RecargoChequeCardProps) {
  const sugerenciaQuery = useSugerenciaRecargoCheque(chequeId);
  const confirmar = useConfirmarRecargoCheque();
  const [monto, setMonto] = useState("");

  useEffect(() => {
    if (sugerenciaQuery.data && !sugerenciaQuery.data.yaConfirmado) {
      setMonto(String(sugerenciaQuery.data.montoSugerido));
    }
  }, [sugerenciaQuery.data]);

  if (sugerenciaQuery.isPending) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-6 text-sm">Calculando recargo...</CardContent>
      </Card>
    );
  }
  if (sugerenciaQuery.error || !sugerenciaQuery.data) {
    return null;
  }

  const sugerencia = sugerenciaQuery.data;

  function handleConfirmar() {
    const montoNumero = Number(monto);
    if (!monto || Number.isNaN(montoNumero) || montoNumero <= 0) {
      toast.error("Ingresá un monto válido");
      return;
    }
    confirmar.mutate(
      { chequeId, monto: montoNumero },
      {
        onSuccess: () => toast.success("Recargo confirmado"),
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : "No se pudo confirmar el recargo");
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recargo por plazo</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <p className="text-muted-foreground">
          {sugerencia.dias} día{sugerencia.dias === 1 ? "" : "s"} entre la fecha del cobro y la fecha de
          pago del cheque (recargo a partir de más de 7).
        </p>

        {!sugerencia.corresponde ? (
          <p className="text-muted-foreground">No corresponde recargo.</p>
        ) : sugerencia.yaConfirmado ? (
          <Badge variant="secondary" className="w-fit">
            Recargo ya confirmado
          </Badge>
        ) : (
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <label className="text-muted-foreground text-xs font-medium">
                Monto ({sugerencia.porcentaje * 100}% sugerido)
              </label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                className="w-32"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
            </div>
            <Button size="sm" onClick={handleConfirmar} disabled={confirmar.isPending}>
              {confirmar.isPending ? "Guardando..." : "Confirmar recargo"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
