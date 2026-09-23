import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ESTADO_TRANSPORTE_LABELS,
  type EstadoTransporteFiltro,
} from "@/modules/transportes/domain/transporte.types";

/** Filtro activos / inactivos / todos, igual que en proveedores. */
export function EstadoSelect({
  value,
  onChange,
}: {
  value: EstadoTransporteFiltro;
  onChange: (value: EstadoTransporteFiltro) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm">Estado</span>
      <Select value={value} onValueChange={(v) => onChange(v as EstadoTransporteFiltro)}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(ESTADO_TRANSPORTE_LABELS).map(([valor, etiqueta]) => (
            <SelectItem key={valor} value={valor}>
              {etiqueta}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
