import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/shared/api/api-response";
import { normalizarPatente } from "@/modules/transportes/domain/documento-transporte";
import { vehiculoSchema, type VehiculoFormValues } from "@/modules/transportes/domain/transporte.schemas";
import {
  TIPO_VEHICULO_LABELS,
  TipoVehiculo,
  type Vehiculo,
} from "@/modules/transportes/domain/transporte.types";
import { useGuardarVehiculo } from "@/modules/transportes/hooks/use-transporte";
import { TransportistaSelect } from "@/modules/transportes/components/transportista-select";

interface VehiculoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehiculo?: Vehiculo;
}

export function VehiculoDialog({ open, onOpenChange, vehiculo }: VehiculoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{vehiculo ? "Editar vehículo" : "Nuevo vehículo"}</DialogTitle>
          <DialogDescription>
            Un camión con acoplado se carga como dos vehículos, y en el remito se eligen ambos.
          </DialogDescription>
        </DialogHeader>
        {open && <VehiculoForm vehiculo={vehiculo} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function VehiculoForm({ vehiculo, onDone }: { vehiculo?: Vehiculo; onDone: () => void }) {
  const guardar = useGuardarVehiculo();
  const form = useForm<VehiculoFormValues>({
    resolver: zodResolver(vehiculoSchema),
    defaultValues: {
      transportistaId: vehiculo?.transportistaId ?? "",
      tipo: vehiculo?.tipo ?? TipoVehiculo.CAMION,
      patente: vehiculo?.patente ?? "",
      descripcion: vehiculo?.descripcion ?? "",
      rtoVencimiento: vehiculo?.rtoVencimiento ?? "",
      seguroVencimiento: vehiculo?.seguroVencimiento ?? "",
      habilitacionAnimalesVencimiento: vehiculo?.habilitacionAnimalesVencimiento ?? "",
    },
  });

  async function onSubmit(values: VehiculoFormValues) {
    try {
      await guardar.mutateAsync({ id: vehiculo?.id, values: { ...values, patente: normalizarPatente(values.patente) } });
      toast.success(vehiculo ? "Vehículo actualizado" : "Vehículo creado");
      onDone();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudo guardar el vehículo");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="patente"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Patente</FormLabel>
                <FormControl>
                  <Input placeholder="AB123CD" className="uppercase" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(TipoVehiculo).map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {TIPO_VEHICULO_LABELS[tipo]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Camión frigorífico Mercedes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="transportistaId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transportista (opcional)</FormLabel>
              <TransportistaSelect value={field.value ?? ""} onChange={field.onChange} />
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="rtoVencimiento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vence RTO</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="seguroVencimiento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vence seguro</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="habilitacionAnimalesVencimiento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vence hab. animales</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onDone}>
            Cancelar
          </Button>
          <Button type="submit" disabled={guardar.isPending}>
            {guardar.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
