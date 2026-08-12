import { Card, CardContent } from "@/components/ui/card";
import type { SaldoCliente } from "@/modules/cuenta-corriente/domain/saldo-cliente.types";

interface SaldoClienteCardsProps {
  saldo: SaldoCliente;
}

const formatoMoneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

/** Las 4 cifras del saldo de cuenta corriente de un cliente, en tarjetas. */
export function SaldoClienteCards({ saldo }: SaldoClienteCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <SaldoCard label="Saldo vencido" valor={saldo.saldoVencido} destacado={saldo.saldoVencido > 0} />
      <SaldoCard label="Por vencer" valor={saldo.saldoPorVencer} />
      <SaldoCard label="Saldo total" valor={saldo.saldoTotal} />
      <SaldoCard label="A favor" valor={saldo.saldoAFavor} />
    </div>
  );
}

function SaldoCard({ label, valor, destacado }: { label: string; valor: number; destacado?: boolean }) {
  return (
    <Card>
      <CardContent>
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className={destacado ? "text-destructive text-lg font-semibold" : "text-lg font-semibold"}>
          {formatoMoneda.format(valor)}
        </p>
      </CardContent>
    </Card>
  );
}
