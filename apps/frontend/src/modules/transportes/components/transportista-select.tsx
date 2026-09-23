import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTransportistas } from "@/modules/transportes/hooks/use-transporte";

const SIN_TRANSPORTISTA = "ninguno";

interface TransportistaSelectProps {
  /** `""` = sin transportista. */
  value: string;
  onChange: (value: string) => void;
}

/** Selector opcional de transportista (los activos). Radix no admite un ítem con valor vacío, de ahí el centinela. */
export function TransportistaSelect({ value, onChange }: TransportistaSelectProps) {
  const transportistasQuery = useTransportistas("activos");

  return (
    <Select
      value={value || SIN_TRANSPORTISTA}
      onValueChange={(nuevo) => onChange(nuevo === SIN_TRANSPORTISTA ? "" : nuevo)}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={SIN_TRANSPORTISTA}>Sin transportista</SelectItem>
        {(transportistasQuery.data ?? []).map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
