import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAgregarFichajeManual } from "@/modules/fichajes/hooks/use-agregar-fichaje-manual";
import { TipoFichaje } from "@/modules/fichajes/domain/fichaje-import.types";
import { hoyISO } from "@/shared/lib/date";
import { ApiError } from "@/shared/api/api-response";

interface AgregarFichajeManualDialogProps {
  empleadoId: string;
}

export function AgregarFichajeManualDialog({ empleadoId }: AgregarFichajeManualDialogProps) {
  const [open, setOpen] = useState(false);
  const [fecha, setFecha] = useState(hoyISO());
  const [hora, setHora] = useState("08:00");
  const [tipo, setTipo] = useState<TipoFichaje>(TipoFichaje.ENTRADA);
  const agregarManual = useAgregarFichajeManual();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setFecha(hoyISO());
      setHora("08:00");
      setTipo(TipoFichaje.ENTRADA);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      // Se codifica en UTC a propósito: así el día calendario de la marcación
      // (que el backend calcula con métodos UTC, ver `calcular-jornada.ts`)
      // coincide exactamente con la fecha elegida en el formulario.
      const momento = `${fecha}T${hora}:00.000Z`;
      await agregarManual.mutateAsync({ empleadoId, momento, tipo });
      toast.success("Marcación agregada correctamente");
      handleOpenChange(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo agregar la marcación";
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusCircle />
          Agregar marcación manual
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar marcación manual</DialogTitle>
          <DialogDescription>
            Para corregir un olvido de fichar o cargar una marcación puntual. Queda identificada
            como carga manual.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Fecha</Label>
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            </div>
            <div className="grid gap-1.5">
              <Label>Hora</Label>
              <Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} required />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoFichaje)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TipoFichaje.ENTRADA}>Entrada</SelectItem>
                <SelectItem value={TipoFichaje.SALIDA}>Salida</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={agregarManual.isPending}>
              {agregarManual.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
