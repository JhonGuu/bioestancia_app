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
  updateEmpresaSchema,
  type UpdateEmpresaFormValues,
} from "@/modules/empresas/domain/empresa.schemas";
import type { Empresa } from "@/modules/empresas/domain/empresa.types";

interface EmpresaFormProps {
  empresa: Empresa;
  onSubmit: (values: UpdateEmpresaFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * Solo edita cuit/teléfono/dirección — son los datos que aparecen en el
 * encabezado del PDF de boleta (ver `BoletaPdfGenerator` en el backend).
 * `razonSocial`/`rubro` se muestran de referencia pero no son editables acá:
 * son estructurales, cambiarlos tiene implicancias en todo el sistema.
 */
export function EmpresaForm({ empresa, onSubmit, isSubmitting }: EmpresaFormProps) {
  const form = useForm<UpdateEmpresaFormValues>({
    resolver: zodResolver(updateEmpresaSchema),
    defaultValues: {
      cuit: empresa.cuit ?? "",
      telefono: empresa.telefono ?? "",
      direccion: empresa.direccion ?? "",
      toleranciaTardanzaMinutos:
        empresa.toleranciaTardanzaMinutos != null ? String(empresa.toleranciaTardanzaMinutos) : "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
        <div>
          <span className="text-muted-foreground block text-xs">Razón social</span>
          <span className="text-sm font-medium">{empresa.razonSocial}</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="cuit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CUIT</FormLabel>
                <FormControl>
                  <Input placeholder="30-12345678-9" {...field} />
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
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input placeholder="011 4444-5555" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="direccion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input placeholder="Ruta 5 Km 120, Tandil, Buenos Aires" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="toleranciaTardanzaMinutos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tolerancia de tardanza general (minutos)</FormLabel>
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
                Se usa para el cálculo de asistencia cuando el cargo o el empleado no tienen una
                tolerancia propia configurada.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <p className="text-muted-foreground text-xs">
          Estos datos aparecen en el encabezado del PDF de boleta. Dejar un campo vacío lo borra.
        </p>

        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? "Guardando..." : "Guardar cambios"}
        </Button>
      </form>
    </Form>
  );
}
