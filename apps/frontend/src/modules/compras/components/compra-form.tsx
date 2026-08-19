import { useEffect } from "react";
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
  createCompraSchema,
  type CreateCompraFormValues,
} from "@/modules/compras/domain/compra.schemas";
import {
  CategoriaPorcino,
  ESPECIE_ANIMAL_LABELS,
  EspecieAnimal,
  RazaPorcino,
} from "@/modules/compras/domain/compra.types";
import { useProveedores } from "@/modules/proveedores/hooks/use-proveedores";
import { nombreProveedor } from "@/modules/proveedores/domain/proveedor.types";
import { useCompras } from "@/modules/compras/hooks/use-compras";
import { sugerirProximoNumeroTropa } from "@/modules/compras/domain/sugerir-numero-tropa";
import {
  DTE_PLACEHOLDER,
  formatearDte,
  formatearRemito,
  REMITO_PLACEHOLDER,
} from "@/modules/compras/domain/formato-documentos";

// `categoria` es obligatoria (a diferencia de `raza`), así que arranca en un
// valor real del catálogo en vez de "" — mismo criterio que `condicionFiscal`
// en `cliente-form.tsx`/`proveedor-form.tsx` (un <Select> controlado no
// puede arrancar en un valor fuera de su propio enum). Anotado explícito
// para que no se widen "Porcina Capón" a `string` al inferir el objeto.
const CATEGORIA_VACIA: { categoria: CategoriaPorcino; raza: RazaPorcino | ""; cabezas: string } = {
  categoria: CategoriaPorcino.CAPON,
  raza: "",
  cabezas: "",
};

interface CompraFormProps {
  onSubmit: (values: CreateCompraFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function CompraForm({ onSubmit, isSubmitting }: CompraFormProps) {
  const proveedoresQuery = useProveedores();
  const comprasQuery = useCompras();

  // 3 parámetros de tipo: el form maneja el shape "input" (los numéricos
  // pueden ser string mientras se tipea), pero `onSubmit` recibe el shape
  // "output" ya coercido por zod (`z.coerce.number()` → number). Necesita
  // react-hook-form >=7.45 (ver package.json).
  const form = useForm<
    z.input<typeof createCompraSchema>,
    unknown,
    z.output<typeof createCompraSchema>
  >({
    resolver: zodResolver(createCompraSchema),
    defaultValues: {
      proveedorId: "",
      numero: "",
      especie: EspecieAnimal.PORCINO,
      letra: "",
      fecha: "",
      dte: "",
      remito: "",
      precioCompraKg: "",
      porcentajeDesbaste: "",
      pesoBruto: "",
      comentarios: "",
      categorias: [CATEGORIA_VACIA],
    },
  });

  const categoriasField = useFieldArray({ control: form.control, name: "categorias" });

  // Sugiere el próximo número de tropa apenas se cargan las compras
  // existentes — solo si todavía no se tocó el campo a mano. Se reinicia en
  // "1" si la última compra es de un año anterior (ver sugerir-numero-tropa.ts).
  useEffect(() => {
    if (comprasQuery.data && !form.formState.dirtyFields.numero) {
      const sugerido = sugerirProximoNumeroTropa(comprasQuery.data);
      if (sugerido) form.setValue("numero", sugerido);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comprasQuery.data]);

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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
          <FormField
            control={form.control}
            name="porcentajeDesbaste"
            render={({ field }) => (
              <FormItem>
                <FormLabel>% desbaste (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Usa el del proveedor"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
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
                    placeholder="Peso de toda la tropa, sin discriminar por categoría"
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
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="Precio negociado con el proveedor, sin IVA"
                    {...field}
                  />
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
          {isSubmitting ? "Guardando..." : "Guardar compra"}
        </Button>
      </form>
    </Form>
  );
}
