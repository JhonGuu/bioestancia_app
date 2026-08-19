import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSugerenciaRechazoCheque } from "@/modules/cheques/hooks/use-sugerencia-rechazo-cheque";
import { useConfirmarRechazoCheque } from "@/modules/cheques/hooks/use-confirmar-rechazo-cheque";
import { EstadoCheque } from "@/modules/cheques/domain/cheque.types";
import { ApiError } from "@/shared/api/api-response";

interface RechazoChequeCardProps {
  chequeId: string;
  estado: EstadoCheque;
}

const formatoMoneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

/**
 * Comisión del 7% por cheque rechazado, más la reversión (LIFO) de lo que
 * ya se había aplicado a boletas con ese cheque — solo aplica cuando
 * `estado === RECHAZADO`, confirmación manual.
 */
export function RechazoChequeCard({ chequeId, estado }: RechazoChequeCardProps) {
  const sugerenciaQuery = useSugerenciaRechazoCheque(chequeId, estado);
  const confirmar = useConfirmarRechazoCheque();
  const [comision, setComision] = useState("");
  const [sinComision, setSinComision] = useState(false);

  useEffect(() => {
    if (sugerenciaQuery.data && !sugerenciaQuery.data.yaConfirmado) {
      setComision(String(sugerenciaQuery.data.comisionSugerida));
    }
  }, [sugerenciaQuery.data]);

  if (estado !== EstadoCheque.RECHAZADO) {
    return null;
  }
  if (sugerenciaQuery.isPending) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-6 text-sm">Calculando comisión...</CardContent>
      </Card>
    );
  }
  if (sugerenciaQuery.error || !sugerenciaQuery.data) {
    return null;
  }

  const sugerencia = sugerenciaQuery.data;

  function handleConfirmar() {
    if (sinComision) {
      confirmarConValores(undefined, true);
      return;
    }
    const comisionNumero = Number(comision);
    if (!comision || Number.isNaN(comisionNumero) || comisionNumero <= 0) {
      toast.error("Ingresá una comisión válida (o tildá \"sin comisión\")");
      return;
    }
    confirmarConValores(comisionNumero, false);
  }

  function confirmarConValores(comisionNumero: number | undefined, sinComisionFlag: boolean) {
    confirmar.mutate(
      { chequeId, comision: comisionNumero, sinComision: sinComisionFlag },
      {
        onSuccess: (resultado) => {
          toast.success(
            `Rechazo confirmado — se revirtieron ${formatoMoneda.format(resultado.montoRevertido)} de boletas` +
              (resultado.cargoComision ? "" : " (sin comisión)"),
          );
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : "No se pudo confirmar el rechazo");
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comisión por rechazo</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <p className="text-muted-foreground">
          Se revertirían hasta {formatoMoneda.format(sugerencia.montoARevertir)} ya aplicados a boletas — el
          cheque nunca se cobró de verdad.
        </p>

        {sugerencia.yaConfirmado ? (
          <Badge variant="secondary" className="w-fit">
            Rechazo ya confirmado
          </Badge>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <label className="text-muted-foreground text-xs font-medium">
                  Comisión ({sugerencia.porcentajeComision * 100}% sugerida)
                </label>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  className="w-32"
                  value={comision}
                  disabled={sinComision}
                  onChange={(e) => setComision(e.target.value)}
                />
              </div>
              <Button size="sm" variant="destructive" onClick={handleConfirmar} disabled={confirmar.isPending}>
                {confirmar.isPending ? "Guardando..." : "Confirmar rechazo"}
              </Button>
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={sinComision}
                onChange={(e) => setSinComision(e.target.checked)}
              />
              El cliente canceló el cheque el mismo día — no aplicar comisión
            </label>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
