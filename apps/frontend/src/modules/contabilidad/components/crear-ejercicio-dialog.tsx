import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
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
import { ejercicioSchema, type EjercicioFormValues } from "@/modules/contabilidad/domain/ejercicio.schemas";
import { useCrearEjercicio } from "@/modules/contabilidad/hooks/use-crear-ejercicio";
import { ApiError } from "@/shared/api/api-response";

/** Crea un ejercicio y sus períodos mensuales de una — cada empresa define su propio cierre. */
export function CrearEjercicioDialog() {
  const [open, setOpen] = useState(false);
  const crear = useCrearEjercicio();

  const form = useForm<EjercicioFormValues>({
    resolver: zodResolver(ejercicioSchema),
    defaultValues: { nombre: "", fechaInicio: "", fechaFin: "" },
  });

  function handleSubmit(values: EjercicioFormValues) {
    crear
      .mutateAsync(values)
      .then((ejercicio) => {
        toast.success(`"${ejercicio.nombre}" creado, con sus períodos mensuales`);
        setOpen(false);
        form.reset();
      })
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo crear el ejercicio");
      });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) form.reset({ nombre: "", fechaInicio: "", fechaFin: "" });
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus />
          Nuevo ejercicio
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo ejercicio contable</DialogTitle>
          <DialogDescription>
            Se generan solos los períodos mensuales entre las dos fechas, ambas inclusive.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder='Ej. "Ejercicio 2026"' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="fechaInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de inicio</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fechaFin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de cierre</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={crear.isPending}>
                {crear.isPending ? "Creando..." : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
