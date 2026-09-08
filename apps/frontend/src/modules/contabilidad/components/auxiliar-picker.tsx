import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import { useClientes } from "@/modules/clientes/hooks/use-clientes";
import { nombreCliente } from "@/modules/clientes/domain/cliente.types";
import { useProveedores } from "@/modules/proveedores/hooks/use-proveedores";
import { nombreProveedor } from "@/modules/proveedores/domain/proveedor.types";
import { useFrigorificos } from "@/modules/frigorificos/hooks/use-frigorificos";

interface AuxiliarPickerProps {
  tipo: TipoAuxiliar;
  value: string;
  onChange: (value: string) => void;
}

/**
 * Selector del auxiliar que pide la cuenta. Cliente, proveedor y frigorífico
 * reutilizan los listados que ya existen en la app; empleado, cuenta de
 * fondos y cheque todavía no tienen su propio módulo conectado acá (llegan
 * en fases posteriores), así que por ahora se cargan por ID a mano.
 */
export function AuxiliarPicker({ tipo, value, onChange }: AuxiliarPickerProps) {
  if (tipo === TipoAuxiliar.CLIENTE) return <ClientePicker value={value} onChange={onChange} />;
  if (tipo === TipoAuxiliar.PROVEEDOR) return <ProveedorPicker value={value} onChange={onChange} />;
  if (tipo === TipoAuxiliar.FRIGORIFICO) return <FrigorificoPicker value={value} onChange={onChange} />;
  return <Input placeholder="ID del auxiliar" value={value} onChange={(e) => onChange(e.target.value)} />;
}

function ClientePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const clientesQuery = useClientes();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Elegí un cliente" />
      </SelectTrigger>
      <SelectContent>
        {(clientesQuery.data ?? []).map((cliente) => (
          <SelectItem key={cliente.id} value={cliente.id}>
            {nombreCliente(cliente)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ProveedorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const proveedoresQuery = useProveedores();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Elegí un proveedor" />
      </SelectTrigger>
      <SelectContent>
        {(proveedoresQuery.data ?? []).map((proveedor) => (
          <SelectItem key={proveedor.id} value={proveedor.id}>
            {nombreProveedor(proveedor)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function FrigorificoPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const frigorificosQuery = useFrigorificos();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Elegí un frigorífico" />
      </SelectTrigger>
      <SelectContent>
        {(frigorificosQuery.data ?? []).map((frigorifico) => (
          <SelectItem key={frigorifico.id} value={frigorifico.id}>
            {frigorifico.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
