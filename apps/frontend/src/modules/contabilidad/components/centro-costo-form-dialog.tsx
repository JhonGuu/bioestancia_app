import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { centroCostoSchema, type CentroCostoFormValues } from "@/modules/contabilidad/domain/centro-costo.schemas";
import type { CentroCosto } from "@/modules/contabilidad/domain/centro-costo.types";
import { useCrearCentroCosto } from "@/modules/contabilidad/hooks/use-crear-centro-costo";
import { useActualizarCentroCosto } from "@/modules/contabilidad/hooks/use-actualizar-centro-costo";
import { ApiError } from "@/shared/api/api-response";

interface CentroCostoFormDialogProps {
  centro?: CentroCosto;
}

export function CentroCostoFormDialog({ centro }: CentroCostoFormDialogProps) {
  const [open, setOpen] = useState(false);
  const crear = useCrearCentroCosto();
  const actualizar = useActualizarCentroCosto();
  const isPending = crear.isPending || actualizar.isPending;

  const form = useForm<CentroCostoFormValues>({
    resolver: zodResolver(centroCostoSchema),
    defaultValues: { codigo: centro?.codigo ?? "", nombre: centro?.nombre ?? "" },
  });

  function handleSubmit(values: CentroCostoFormValues) {
    const accion = centro
      ? actualizar.mutateAsync({ id: centro.id, input: values })
      : crear.mutateAsync(values);

    accion
      .then(() => {
        toast.success(centro ? "Centro de costo actualizado correctamente" : "Centro de costo creado correctamente");
        setOpen(false);
        form.reset();
      })
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo guardar el centro de costo");
      });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) form.reset({ codigo: centro?.codigo ?? "", nombre: centro?.nombre ?? "" });
      }}
    >
      <DialogTrigger asChild>
        {centro ? (
          <Button variant="ghost" size="icon" title="Editar centro de costo">
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button size="sm">
            <Plus />
            Nuevo centro de costo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{centro ? `Editar "${centro.nombre}"` : "Nuevo centro de costo"}</DialogTitle>
          <DialogDescription>
            Dimensión opcional para imputar líneas de asiento por tropa, reparto u otra parte del negocio,
            sin duplicar cuentas.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="codigo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código</FormLabel>
                  <FormControl>
                    <Input placeholder="TROPA-01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
