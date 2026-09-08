import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CuentaNodo } from "@/modules/contabilidad/domain/cuenta.types";

interface CuentaSelectProps {
  /** Ya aplanadas en orden jerárquico — filtralas por imputable+activa antes de pasarlas. */
  cuentas: CuentaNodo[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Selector de cuenta imputable, para las líneas de un asiento o los saldos iniciales. */
export function CuentaSelect({ cuentas, value, onChange, placeholder }: CuentaSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder ?? "Elegí una cuenta"} />
      </SelectTrigger>
      <SelectContent>
        {cuentas.map((cuenta) => (
          <SelectItem key={cuenta.id} value={cuenta.id}>
            {cuenta.codigo} {cuenta.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
