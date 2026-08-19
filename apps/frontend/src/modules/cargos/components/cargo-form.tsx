import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  createCargoSchema,
  type CreateCargoFormValues,
} from "@/modules/cargos/domain/cargo.schemas";
import type { Cargo } from "@/modules/cargos/domain/cargo.types";

interface CargoFormProps {
  onSubmit: (values: CreateCargoFormValues) => Promise<void>;
  isSubmitting?: boolean;
  /** Si viene, el form arranca precargado con sus datos (edición) en vez de vacío (alta). */
  cargo?: Cargo;
}

export function CargoForm({ onSubmit, isSubmitting, cargo }: CargoFormProps) {
  const form = useForm<CreateCargoFormValues>({
    resolver: zodResolver(createCargoSchema),
    defaultValues: {
      nombre: cargo?.nombre ?? "",
      toleranciaMinutos: cargo?.toleranciaMinutos != null ? String(cargo.toleranciaMinutos) : "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Operario de planta" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="toleranciaMinutos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tolerancia de tardanza (minutos)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={180}
                  placeholder="Ej. 10"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Opcional. Si no se completa, se usa la tolerancia de la empresa.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? "Guardando..." : cargo ? "Guardar cambios" : "Guardar cargo"}
        </Button>
      </form>
    </Form>
  );
}
