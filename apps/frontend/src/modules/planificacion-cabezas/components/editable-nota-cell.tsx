import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";

interface EditableNotaCellProps {
  value: string;
  disabled?: boolean;
  onCommit: (nuevoValor: string) => void;
}

/**
 * Aclaración de un cliente+día ("sin confirmar", "seleccionar lindas, ~45 kg
 * la media"): sale tal cual en el PDF del reparto. Igual que
 * `EditableCabezasCell`, guarda el borrador local y confirma (POST) recién al
 * perder foco o con Enter, y solo si cambió.
 */
export function EditableNotaCell({ value, disabled, onCommit }: EditableNotaCellProps) {
  const [borrador, setBorrador] = useState(value);

  useEffect(() => {
    setBorrador(value);
  }, [value]);

  function confirmar() {
    const limpio = borrador.trim();
    setBorrador(limpio);
    if (limpio !== value) {
      onCommit(limpio);
    }
  }

  return (
    <Input
      type="text"
      maxLength={255}
      disabled={disabled}
      value={borrador}
      placeholder={disabled ? "" : "Aclaración..."}
      onChange={(e) => setBorrador(e.target.value)}
      onBlur={confirmar}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className="h-8 min-w-56 text-sm"
    />
  );
}
