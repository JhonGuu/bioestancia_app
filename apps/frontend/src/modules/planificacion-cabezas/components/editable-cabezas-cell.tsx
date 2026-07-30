import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface EditableCabezasCellProps {
  value: number;
  vendidas: number;
  disabled?: boolean;
  onCommit: (nuevoValor: number) => void;
}

/**
 * Input numérico para "cabezas planificadas" de un cliente+día. Guarda el
 * valor en estado local mientras se edita y confirma (dispara `onCommit`,
 * que termina en un POST) recién al perder foco o presionar Enter — así no
 * se dispara una mutación por cada tecla.
 */
export function EditableCabezasCell({
  value,
  vendidas,
  disabled,
  onCommit,
}: EditableCabezasCellProps) {
  const [borrador, setBorrador] = useState(String(value));

  useEffect(() => {
    setBorrador(String(value));
  }, [value]);

  function confirmar() {
    const parsed = Number(borrador);
    const limpio = Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : value;
    setBorrador(String(limpio));
    if (limpio !== value) {
      onCommit(limpio);
    }
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <Input
        type="number"
        min={0}
        inputMode="numeric"
        disabled={disabled}
        value={borrador}
        onChange={(e) => setBorrador(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="h-8 w-16 text-center"
      />
      <span
        className={cn(
          "text-[11px] leading-none",
          vendidas > 0 ? "text-muted-foreground" : "text-muted-foreground/40",
        )}
      >
        {vendidas > 0 ? `Entregó ${vendidas}` : "—"}
      </span>
    </div>
  );
}
