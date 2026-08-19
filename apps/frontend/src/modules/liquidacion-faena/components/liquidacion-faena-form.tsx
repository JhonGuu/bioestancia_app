import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createLiquidacionFaenaSchema,
  type CreateLiquidacionFaenaFormValues,
} from "@/modules/liquidacion-faena/domain/liquidacion-faena.schemas";
import type { CompraConCategorias } from "@/modules/compras/domain/compra.types";
import { useFrigorificos } from "@/modules/frigorificos/hooks/use-frigorificos";

interface LiquidacionFaenaFormProps {
  compra: CompraConCategorias;
  onSubmit: (values: CreateLiquidacionFaenaFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * Carga la liquidación de faena de una compra: lo que el FRIGORÍFICO cobra
 * por faenar, distinto de "Liquidación de compra" (lo que ELLOS le facturan
 * al proveedor). El canon suele variar por categoría (ej. Capón/MEI/Cachorra
 * vs Chancha/Cerda) y ya combina lo facturado + lo efectivo en un solo
 * monto — no se cargan por separado.
 *
 * Una línea por cada categoría de la compra (salen 1 a 1 de
 * `compra.categorias`, no se agregan/quitan acá), con el canon $/animal de
 * esa categoría. El subtotal por línea y el total se calculan en vivo acá
 * (solo para mostrar) y los recalcula el server al guardar.
 */
export function LiquidacionFaenaForm({ compra, onSubmit, isSubmitting }: LiquidacionFaenaFormProps) {
  const frigorificosQuery = useFrigorificos();

  const form = useForm<CreateLiquidacionFaenaFormValues>({
    resolver: zodResolver(createLiquidacionFaenaSchema),
    defaultValues: {
      frigorificoId: "",
      fecha: "",
      comentarios: "",
      categorias: compra.categorias.map((c) => ({
        compraCategoriaId: c.id,
        canonPorAnimal: "",
      })),
    },
  });

  const categoriasField = useFieldArray({ control: form.control, name: "categorias" });
  const categoriasValues = useWatch({ control: form.control, name: "categorias" });

  const subtotales = (categoriasValues ?? []).map((c, index) => {
    const cabezas = compra.categorias[index]?.cabezas ?? 0;
    const canon = Number(c?.canonPorAnimal) || 0;
    return cabezas * canon;
  });
  const total = Math.round(subtotales.reduce((acc, s) => acc + s, 0) * 100) / 100;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="frigorificoId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frigorífico</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Elegí un frigorífico (opcional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(frigorificosQuery.data ?? []).map((frigorifico) => (
                      <SelectItem key={frigorifico.id} value={frigorifico.id}>
                        {frigorifico.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fecha"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="comentarios"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comentarios</FormLabel>
              <FormControl>
                <Textarea {...field} rows={2} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Canon por categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop/tablet: tabla. */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-40">Categoría</TableHead>
                    <TableHead className="text-right">Cabezas</TableHead>
                    <TableHead>$/animal</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoriasField.fields.map((item, index) => {
                    const categoria = compra.categorias[index];
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="min-w-40 font-medium whitespace-normal">
                          {categoria?.categoria}
                          {categoria?.raza ? ` (${categoria.raza})` : ""}
                        </TableCell>
                        <TableCell className="text-right">{categoria?.cabezas}</TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`categorias.${index}.canonPorAnimal`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="number" step="0.01" min={0} className="w-28" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          {subtotales[index] ? subtotales[index].toLocaleString("es-AR") : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3}>Total</TableCell>
                    <TableCell className="text-right font-medium">
                      {total > 0 ? total.toLocaleString("es-AR") : "—"}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Celular: una tarjeta por categoría. */}
            <div className="space-y-3 sm:hidden">
              {categoriasField.fields.map((item, index) => {
                const categoria = compra.categorias[index];
                return (
                  <div key={item.id} className="rounded-lg border p-3">
                    <div className="mb-3 flex items-baseline justify-between gap-2">
                      <p className="font-medium">
                        {categoria?.categoria}
                        {categoria?.raza ? ` (${categoria.raza})` : ""}
                      </p>
                      <p className="text-muted-foreground shrink-0 text-xs">
                        {categoria?.cabezas} cabezas
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name={`categorias.${index}.canonPorAnimal`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">$/animal</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" min={0} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div>
                        <p className="text-muted-foreground text-xs">Subtotal</p>
                        <p className="pt-2 text-sm font-medium">
                          {subtotales[index] ? `$${subtotales[index].toLocaleString("es-AR")}` : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center justify-between rounded-lg border p-3 text-sm font-medium">
                <span>Total</span>
                <span>{total > 0 ? `$${total.toLocaleString("es-AR")}` : "—"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? "Guardando..." : "Guardar liquidación de faena"}
        </Button>
      </form>
    </Form>
  );
}
