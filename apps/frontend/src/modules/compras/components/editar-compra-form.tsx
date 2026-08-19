import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";

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
  updateCompraSchema,
  type UpdateCompraFormValues,
} from "@/modules/compras/domain/compra.schemas";
import {
  CategoriaPorcino,
  ESPECIE_ANIMAL_LABELS,
  EspecieAnimal,
  RazaPorcino,
  type CompraConCategorias,
} from "@/modules/compras/domain/compra.types";
import { useProveedores } from "@/modules/proveedores/hooks/use-proveedores";
import { nombreProveedor } from "@/modules/proveedores/domain/proveedor.types";
import {
  DTE_PLACEHOLDER,
  formatearDte,
  formatearRemito,
  REMITO_PLACEHOLDER,
} from "@/modules/compras/domain/formato-documentos";

// Misma razón que en `compra-form.tsx`: `categoria` es obligatoria y un
// <Select> controlado no puede arrancar en un valor fuera de su enum. Sin
// `id` — una línea nueva agregada acá todavía no existe en el backend.
const CATEGORIA_VACIA: { categoria: CategoriaPorcino; raza: RazaPorcino | ""; cabezas: string } = {
  categoria: CategoriaPorcino.CAPON,
  raza: "",
  cabezas: "",
};

interface EditarCompraFormProps {
  compra: CompraConCategorias;
  onSubmit: (values: UpdateCompraFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * Edita todos los campos de una compra: proveedor, especie, datos generales
 * y el detalle de categorías/razas/cabezas (agregar, quitar o modificar
 * líneas existentes). El `id` de cada línea existente viaja en un input
 * oculto para que el backend sepa qué línea actualizar vs. crear (ver
 * `syncForCompra`). Bloqueado por el backend si la compra ya está cerrada;
 * la página que usa este form se encarga de no mostrarlo en ese caso (ver
 * `$compraId/editar.tsx`).
 */
export function EditarCompraForm({ compra, onSubmit, isSubmitting }: EditarCompraFormProps) {
  const proveedoresQuery = useProveedores();

  // 3 parámetros de tipo: el form maneja el shape "input" (los numéricos
  // pueden ser string mientras se tipea), pero `onSubmit` recibe el shape
  // "output" ya coercido por zod.
  const form = useForm<
    z.input<typeof updateCompraSchema>,
    unknown,
    z.output<typeof updateCompraSchema>
  >({
    resolver: zodResolver(updateCompraSchema),
    defaultValues: {
      proveedorId: compra.proveedorId,
      especie: compra.especie,
      numero: compra.numero,
      letra: compra.letra ?? "",
      fecha: compra.fecha.slice(0, 10),
      dte: compra.dte,
      remito: compra.remito,
      precioCompraKg: compra.precioCompraKg !== null ? String(compra.precioCompraKg) : "",
      porcentajeDesbaste: String(compra.porcentajeDesbaste),
      pesoBruto: compra.pesoBruto,
      comentarios: compra.comentarios ?? "",
      categorias: compra.categorias.map((c) => ({
        id: c.id,
        categoria: c.categoria,
        raza: c.raza ?? "",
        cabezas: c.cabezas,
      })),
    },
  });

  const categoriasField = useFieldArray({ control: form.control, name: "categorias" });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="proveedorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proveedor</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Elegí un proveedor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(proveedoresQuery.data ?? []).map((proveedor) => (
                      <SelectItem key={proveedor.id} value={proveedor.id}>
                        {nombreProveedor(proveedor)}
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
            name="especie"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Especie</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(EspecieAnimal).map((value) => (
                      <SelectItem key={value} value={value}>
                        {ESPECIE_ANIMAL_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="numero"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de tropa</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="letra"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Letra (para la boleta)</FormLabel>
                <FormControl>
                  <Input {...field} maxLength={5} />
                </FormControl>
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="dte"
            render={({ field }) => (
              <FormItem>
                <FormLabel>DTE (SENASA)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(e) => field.onChange(formatearDte(e.target.value))}
                    inputMode="numeric"
                    placeholder={DTE_PLACEHOLDER}
                    maxLength={11}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="remito"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remito</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(e) => field.onChange(formatearRemito(e.target.value))}
                    inputMode="numeric"
                    placeholder={REMITO_PLACEHOLDER}
                    maxLength={11}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="porcentajeDesbaste"
            render={({ field }) => (
              <FormItem>
                <FormLabel>% desbaste</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pesoBruto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Peso bruto total (kg vivo de báscula)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    {...field}
                    value={field.value as string | number}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="precioCompraKg"
            render={({ field }) => (
              <FormItem>
                <FormLabel>$/kg en pie (opcional)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min={0} placeholder="Sin IVA" {...field} />
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Categorías / razas</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => categoriasField.append(CATEGORIA_VACIA)}
              >
                <Plus />
                Agregar categoría
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoriasField.fields.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_2fr_1fr_auto] sm:items-end">
                <input type="hidden" {...form.register(`categorias.${index}.id`)} />
                <FormField
                  control={form.control}
                  name={`categorias.${index}.categoria`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Elegí una categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(CategoriaPorcino).map((value) => (
                            <SelectItem key={value} value={value}>
                              {value}
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
                  name={`categorias.${index}.raza`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Raza</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Elegí una raza" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(RazaPorcino).map((value) => (
                            <SelectItem key={value} value={value}>
                              {value}
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
                  name={`categorias.${index}.cabezas`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cabezas</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          value={field.value as string | number}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={categoriasField.fields.length === 1}
                  onClick={() => categoriasField.remove(index)}
                  title="Quitar categoría"
                >
                  <Trash2 className="text-destructive size-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? "Guardando..." : "Guardar cambios"}
        </Button>
      </form>
    </Form>
  );
}
