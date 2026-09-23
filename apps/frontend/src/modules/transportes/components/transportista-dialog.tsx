import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/shared/api/api-response";
import { transportistaSchema, type TransportistaFormValues } from "@/modules/transportes/domain/transporte.schemas";
import type { Transportista } from "@/modules/transportes/domain/transporte.types";
import { useGuardarTransportista } from "@/modules/transportes/hooks/use-transporte";

interface TransportistaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si viene, edita; si no, da de alta. */
  transportista?: Transportista;
}

export function TransportistaDialog({ open, onOpenChange, transportista }: TransportistaDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{transportista ? "Editar transportista" : "Nuevo transportista"}</DialogTitle>
          <DialogDescription>
            La empresa o persona que hace el traslado de la mercadería.
          </DialogDescription>
        </DialogHeader>
        {/* Se monta recién al abrir: así el formulario arranca siempre con los datos del registro elegido. */}
        {open && <TransportistaForm transportista={transportista} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function TransportistaForm({ transportista, onDone }: { transportista?: Transportista; onDone: () => void }) {
  const guardar = useGuardarTransportista();
  const form = useForm<TransportistaFormValues>({
    resolver: zodResolver(transportistaSchema),
    defaultValues: {
      nombre: transportista?.nombre ?? "",
      cuit: transportista?.cuit ?? "",
      telefono: transportista?.telefono ?? "",
      esPropio: transportista?.esPropio ?? false,
    },
  });

  async function onSubmit(values: TransportistaFormValues) {
    try {
      await guardar.mutateAsync({ id: transportista?.id, values });
      toast.success(transportista ? "Transportista actualizado" : "Transportista creado");
      onDone();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudo guardar el transportista");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre o razón social</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="cuit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CUIT</FormLabel>
                <FormControl>
                  <Input inputMode="numeric" placeholder="30-12345678-9" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="telefono"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono (opcional)</FormLabel>
                <FormControl>
                  <Input type="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="esPropio"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <input
                  type="checkbox"
                  className="size-4"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              </FormControl>
              <FormLabel className="font-normal">
                Es la propia empresa (camión y chofer propios)
              </FormLabel>
            </FormItem>
          )}
        />
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
