import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/shared/api/api-response";
import { choferSchema, type ChoferFormValues } from "@/modules/transportes/domain/transporte.schemas";
import type { Chofer } from "@/modules/transportes/domain/transporte.types";
import { useGuardarChofer } from "@/modules/transportes/hooks/use-transporte";
import { TransportistaSelect } from "@/modules/transportes/components/transportista-select";

interface ChoferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chofer?: Chofer;
  /** Quien no tiene el permiso no ve ni edita DNI y licencia (el backend los conserva). */
  puedeVerDatosPersonales: boolean;
}

export function ChoferDialog({ open, onOpenChange, chofer, puedeVerDatosPersonales }: ChoferDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{chofer ? "Editar chofer" : "Nuevo chofer"}</DialogTitle>
          <DialogDescription>
            Quien conduce el vehículo. El remito lleva su CUIT (o CUIL), no el DNI.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ChoferForm
            chofer={chofer}
            puedeVerDatosPersonales={puedeVerDatosPersonales}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ChoferForm({
  chofer,
  puedeVerDatosPersonales,
  onDone,
}: {
  chofer?: Chofer;
  puedeVerDatosPersonales: boolean;
  onDone: () => void;
}) {
  const guardar = useGuardarChofer();
  const form = useForm<ChoferFormValues>({
    resolver: zodResolver(choferSchema),
    defaultValues: {
      transportistaId: chofer?.transportistaId ?? "",
      nombre: chofer?.nombre ?? "",
      apellido: chofer?.apellido ?? "",
      cuit: chofer?.cuit ?? "",
      dni: chofer?.dni ?? "",
      telefono: chofer?.telefono ?? "",
      licenciaVencimiento: chofer?.licenciaVencimiento ?? "",
    },
  });

  async function onSubmit(values: ChoferFormValues) {
    try {
      await guardar.mutateAsync({ id: chofer?.id, values });
      toast.success(chofer ? "Chofer actualizado" : "Chofer creado");
      onDone();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudo guardar el chofer");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="apellido"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cuit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CUIT / CUIL</FormLabel>
                <FormControl>
                  <Input inputMode="numeric" placeholder="20-12345678-9" {...field} />
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
          {puedeVerDatosPersonales && (
            <>
              <FormField
                control={form.control}
                name="dni"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DNI (opcional)</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="licenciaVencimiento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vencimiento de licencia (opcional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>
        <FormField
          control={form.control}
          name="transportistaId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transportista para el que trabaja (opcional)</FormLabel>
              <TransportistaSelect value={field.value ?? ""} onChange={field.onChange} />
              <FormMessage />
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
