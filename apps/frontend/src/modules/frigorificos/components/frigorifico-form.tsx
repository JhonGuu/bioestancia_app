import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  createFrigorificoSchema,
  type CreateFrigorificoFormValues,
} from "@/modules/frigorificos/domain/frigorifico.schemas";
import type { Frigorifico } from "@/modules/frigorificos/domain/frigorifico.types";

interface FrigorificoFormProps {
  onSubmit: (values: CreateFrigorificoFormValues) => Promise<void>;
  isSubmitting?: boolean;
  /** Si viene, el form arranca precargado con sus datos (edición) en vez de vacío (alta). */
  frigorifico?: Frigorifico;
}

export function FrigorificoForm({ onSubmit, isSubmitting, frigorifico }: FrigorificoFormProps) {
  const form = useForm<CreateFrigorificoFormValues>({
    resolver: zodResolver(createFrigorificoSchema),
    defaultValues: {
      nombre: frigorifico?.nombre ?? "",
      cuit: frigorifico?.cuit ?? "",
      senasaNumero: frigorifico?.senasaNumero ?? "",
      rucaNumero: frigorifico?.rucaNumero ?? "",
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
                <Input placeholder="Ej. Cerdo de Los Andes S.A." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="cuit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CUIT</FormLabel>
                <FormControl>
                  <Input placeholder="30-71890427-3" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="senasaNumero"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SENASA Nº</FormLabel>
                <FormControl>
                  <Input placeholder="17.014.0.02035/00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="rucaNumero"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nº establecimiento RUCA</FormLabel>
                <FormControl>
                  <Input placeholder="2035" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? "Guardando..." : frigorifico ? "Guardar cambios" : "Guardar frigorífico"}
        </Button>
      </form>
    </Form>
  );
}
