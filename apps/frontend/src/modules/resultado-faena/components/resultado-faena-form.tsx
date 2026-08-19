import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Wand2 } from "lucide-react";

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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createResultadoFaenaSchema,
  type CreateResultadoFaenaFormValues,
} from "@/modules/resultado-faena/domain/resultado-faena.schemas";
import { totalCabezas, type CompraConCategorias } from "@/modules/compras/domain/compra.types";
import { useFrigorificos } from "@/modules/frigorificos/hooks/use-frigorificos";

interface ResultadoFaenaFormProps {
  compra: CompraConCategorias;
  onSubmit: (values: CreateResultadoFaenaFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * Carga el resultado de faena (documento SENASA) de una compra: un header
 * (frigorífico, fecha, número/autorización) + una línea por cada categoría
 * YA cargada en la compra (kg vivo de faena, kg de carne, %magro, destino,
 * cuartos, decomiso sanitario) — las líneas no se agregan/quitan acá, salen
 * 1 a 1 de `compra.categorias`. El rendimiento, los totales y los comisos
 * del header los calcula el server sumando las líneas.
 *
 * El decomiso (comisos) se carga POR CATEGORÍA porque el frigorífico
 * siempre le atribuye el decomiso sanitario a una categoría puntual —
 * ver la explicación del usuario en el historial de esta feature. A partir
 * de esas cabezas decomisadas, se sugiere (no se fuerza) un "kg vivo faena"
 * para esa categoría: `kg/animal = round(pesoNeto de la compra / cabezas
 * totales originales)`, `sugerido = kg/animal × (cabezas de la categoría −
 * comisosCabezas)` — mismo criterio que usa el usuario a mano hoy.
 *
 * Advertencia NO bloqueante (decisión explícita del usuario): si la suma de
 * "kg vivo faena" difiere del `pesoNeto` de la compra, se muestra un aviso
 * pero el submit sigue habilitado.
 */
export function ResultadoFaenaForm({ compra, onSubmit, isSubmitting }: ResultadoFaenaFormProps) {
  const frigorificosQuery = useFrigorificos();

  const form = useForm<CreateResultadoFaenaFormValues>({
    resolver: zodResolver(createResultadoFaenaSchema),
    defaultValues: {
      frigorificoId: "",
      fechaFaena: "",
      numero: "",
      numeroAutorizacion: "",
      comentarios: "",
      categorias: compra.categorias.map((c) => ({
        compraCategoriaId: c.id,
        kgVivoFaena: "",
        kgCarne: "",
        porcentajeMagro: "",
        destinoComercial: "",
        cuartosDelantero: "",
        cuartosTrasero: "",
        comisosCabezas: "",
        comisosKg: "",
      })),
    },
  });

  const categoriasField = useFieldArray({ control: form.control, name: "categorias" });
  const categoriasValues = useWatch({ control: form.control, name: "categorias" });

  const sumaKgVivoFaena = (categoriasValues ?? []).reduce(
    (acc, c) => acc + (Number(c?.kgVivoFaena) || 0),
    0,
  );
  const hayDatosCargados = sumaKgVivoFaena > 0;
  const diferencia = Math.round((sumaKgVivoFaena - compra.pesoNeto) * 100) / 100;
  // Tolerancia chica para no marcar diferencias de simple redondeo.
  const noCoincide = hayDatosCargados && Math.abs(diferencia) > 0.5;

  // Kg/animal para sugerir kgVivoFaena por categoría — ver comentario arriba.
  const cabezasTotalesOriginales = totalCabezas(compra.categorias);
  const kgPorAnimal =
    cabezasTotalesOriginales > 0 ? Math.round(compra.pesoNeto / cabezasTotalesOriginales) : 0;

  function sugerirKgVivoFaena(index: number): number | null {
    const categoria = compra.categorias[index];
    if (!categoria || kgPorAnimal <= 0) return null;
    const comisosCabezasValue = Number(categoriasValues?.[index]?.comisosCabezas) || 0;
    const cabezasReales = categoria.cabezas - comisosCabezasValue;
    if (cabezasReales <= 0) return null;
    return Math.round(kgPorAnimal * cabezasReales * 100) / 100;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            name="fechaFaena"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de faena</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="numero"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nº de documento (opcional)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="numeroAutorizacion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nº autorización de faena (opcional)</FormLabel>
                <FormControl>
                  <Input {...field} />
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
            <CardTitle className="text-base">Categorías / razas</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop/tablet: tabla con scroll horizontal propio si hace falta. */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-40">Categoría</TableHead>
                    <TableHead className="text-right">Cabezas</TableHead>
                    <TableHead className="min-w-28">Comisos, cab.</TableHead>
                    <TableHead className="min-w-28">Comisos, kg</TableHead>
                    <TableHead className="min-w-32">Kg vivo faena</TableHead>
                    <TableHead>Kg carne</TableHead>
                    <TableHead>% magro</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Cuartos del.</TableHead>
                    <TableHead>Cuartos tra.</TableHead>
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
                            name={`categorias.${index}.comisosCabezas`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="number" min={0} className="w-20" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`categorias.${index}.comisosKg`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="number" step="0.01" min={0} className="w-20" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`categorias.${index}.kgVivoFaena`}
                            render={({ field }) => {
                              const sugerido = sugerirKgVivoFaena(index);
                              return (
                                <FormItem>
                                  <FormControl>
                                    <Input type="number" step="0.01" min={0} className="w-24" {...field} />
                                  </FormControl>
                                  {sugerido !== null && (
                                    <button
                                      type="button"
                                      onClick={() => form.setValue(`categorias.${index}.kgVivoFaena`, String(sugerido))}
                                      className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs underline-offset-2 hover:underline"
                                    >
                                      <Wand2 className="size-3" />
                                      Sug: {sugerido} kg
                                    </button>
                                  )}
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`categorias.${index}.kgCarne`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="number" step="0.01" min={0} className="w-24" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`categorias.${index}.porcentajeMagro`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    max={100}
                                    className="w-16"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`categorias.${index}.destinoComercial`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input maxLength={10} className="w-20" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`categorias.${index}.cuartosDelantero`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="number" min={0} className="w-16" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`categorias.${index}.cuartosTrasero`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="number" min={0} className="w-16" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Celular: una tarjeta por categoría, campos apilados de a 2 —
                nada de scroll horizontal ni columnas que no entran. */}
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
                        name={`categorias.${index}.comisosCabezas`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Comisos, cabezas</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`categorias.${index}.comisosKg`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Comisos, kg</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" min={0} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`categorias.${index}.kgVivoFaena`}
                        render={({ field }) => {
                          const sugerido = sugerirKgVivoFaena(index);
                          return (
                            <FormItem>
                              <FormLabel className="text-xs">Kg vivo faena</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" min={0} {...field} />
                              </FormControl>
                              {sugerido !== null && (
                                <button
                                  type="button"
                                  onClick={() => form.setValue(`categorias.${index}.kgVivoFaena`, String(sugerido))}
                                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs underline-offset-2 hover:underline"
                                >
                                  <Wand2 className="size-3" />
                                  Sug: {sugerido} kg
                                </button>
                              )}
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                      <FormField
                        control={form.control}
                        name={`categorias.${index}.kgCarne`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Kg carne</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" min={0} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`categorias.${index}.porcentajeMagro`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">% magro</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" min={0} max={100} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`categorias.${index}.destinoComercial`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Destino</FormLabel>
                            <FormControl>
                              <Input maxLength={10} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`categorias.${index}.cuartosDelantero`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Cuartos del.</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`categorias.${index}.cuartosTrasero`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Cuartos tra.</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {noCoincide && (
          <div className="flex items-start gap-2 rounded-md border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>
              La suma de "kg vivo faena" ({sumaKgVivoFaena.toFixed(2)} kg) no coincide con el peso
              neto de la tropa ({compra.pesoNeto} kg) — diferencia de {diferencia.toFixed(2)} kg. Se
              puede guardar igual, pero conviene revisar los datos antes de continuar.
            </p>
          </div>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? "Guardando..." : "Guardar resultado de faena"}
        </Button>
      </form>
    </Form>
  );
}
