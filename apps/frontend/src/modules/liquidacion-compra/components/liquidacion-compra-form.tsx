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
  createLiquidacionCompraSchema,
  type CreateLiquidacionCompraFormValues,
} from "@/modules/liquidacion-compra/domain/liquidacion-compra.schemas";
import type { CompraConCategorias } from "@/modules/compras/domain/compra.types";

interface LiquidacionCompraFormProps {
  /** Todas las líneas de `compra.categorias` tienen que tener `kgVivoFaena` cargado (ver gate en la página). */
  compra: CompraConCategorias;
  onSubmit: (values: CreateLiquidacionCompraFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * Carga la liquidación de compra: el comprobante fiscal (AFIP) que se le
 * emite al proveedor. Se factura sobre `kgVivoFaena` de cada línea (el kg
 * vivo verificado en planta, ya cargado por `resultado-faena`) — por eso
 * cada categoría necesita ese dato antes de poder liquidar.
 *
 * `numeroComprobante`/`cae`/`fechaVencimientoCae` hoy se cargan a mano (el
 * comprobante ya se emitió en AFIP por fuera) — el botón "Emitir CAE" de la
 * vista de solo lectura es la vía automática para el día que haya
 * certificado digital configurado.
 */
export function LiquidacionCompraForm({ compra, onSubmit, isSubmitting }: LiquidacionCompraFormProps) {
  const form = useForm<CreateLiquidacionCompraFormValues>({
    resolver: zodResolver(createLiquidacionCompraSchema),
    defaultValues: {
      numeroComprobante: "",
      fecha: "",
      fechaOperacion: "",
      cae: "",
      fechaVencimientoCae: "",
      totalGastos: "",
      ivaSobreGastos: "",
      totalTributos: "",
      comentarios: "",
      categorias: compra.categorias.map((c) => ({
        compraCategoriaId: c.id,
        precioKg: "",
        porcentajeIva: "",
      })),
    },
  });

  const categoriasField = useFieldArray({ control: form.control, name: "categorias" });
  const categoriasValues = useWatch({ control: form.control, name: "categorias" });
  const [totalGastos, ivaSobreGastos, totalTributos] = useWatch({
    control: form.control,
    name: ["totalGastos", "ivaSobreGastos", "totalTributos"],
  });

  const lineas = (categoriasValues ?? []).map((c, index) => {
    const kgVivoFaena = compra.categorias[index]?.kgVivoFaena ?? 0;
    const precioKg = Number(c?.precioKg) || 0;
    const porcentajeIva = Number(c?.porcentajeIva) || 0;
    const importeBruto = kgVivoFaena * precioKg;
    const importeIva = importeBruto * (porcentajeIva / 100);
    return { importeBruto, importeIva };
  });
  const importeBrutoTotal = lineas.reduce((acc, l) => acc + l.importeBruto, 0);
  const ivaSobreBrutoTotal = lineas.reduce((acc, l) => acc + l.importeIva, 0);
  const importeNeto =
    importeBrutoTotal +
    ivaSobreBrutoTotal +
    (Number(totalGastos) || 0) +
    (Number(ivaSobreGastos) || 0) +
    (Number(totalTributos) || 0);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="numeroComprobante"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nº de comprobante</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Tal como salió en AFIP" />
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
          <FormField
            control={form.control}
            name="fechaOperacion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de operación (opcional)</FormLabel>
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
            name="cae"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CAE (opcional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Si ya lo tenés de AFIP" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fechaVencimientoCae"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vencimiento del CAE (opcional)</FormLabel>
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
            name="totalGastos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total gastos (opcional)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ivaSobreGastos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IVA sobre gastos (opcional)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="totalTributos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total tributos (opcional)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min={0} {...field} />
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
            <CardTitle className="text-base">Facturación por categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop/tablet: tabla. */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-40">Categoría</TableHead>
                    <TableHead className="text-right">Kg vivo faena</TableHead>
                    <TableHead>$/kg</TableHead>
                    <TableHead>% IVA</TableHead>
                    <TableHead className="text-right">Importe bruto</TableHead>
                    <TableHead className="text-right">IVA</TableHead>
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
                        <TableCell className="text-right">{categoria?.kgVivoFaena}</TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`categorias.${index}.precioKg`}
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
                            name={`categorias.${index}.porcentajeIva`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    max={100}
                                    className="w-16"
                                    placeholder="10.5"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          {lineas[index]?.importeBruto ? lineas[index].importeBruto.toLocaleString("es-AR") : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {lineas[index]?.importeIva ? lineas[index].importeIva.toLocaleString("es-AR") : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4}>Importe bruto + IVA</TableCell>
                    <TableCell className="text-right font-medium">
                      {importeBrutoTotal ? importeBrutoTotal.toLocaleString("es-AR") : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {ivaSobreBrutoTotal ? ivaSobreBrutoTotal.toLocaleString("es-AR") : "—"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5}>Importe neto (+ gastos/tributos)</TableCell>
                    <TableCell className="text-right font-medium">
                      {importeNeto ? importeNeto.toLocaleString("es-AR") : "—"}
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
                        {categoria?.kgVivoFaena} kg vivo
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name={`categorias.${index}.precioKg`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">$/kg</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" min={0} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`categorias.${index}.porcentajeIva`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">% IVA</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" min={0} max={100} placeholder="10.5" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div>
                        <p className="text-muted-foreground text-xs">Importe bruto</p>
                        <p className="pt-2 text-sm font-medium">
                          {lineas[index]?.importeBruto
                            ? `$${lineas[index].importeBruto.toLocaleString("es-AR")}`
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">IVA</p>
                        <p className="pt-2 text-sm font-medium">
                          {lineas[index]?.importeIva
                            ? `$${lineas[index].importeIva.toLocaleString("es-AR")}`
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="space-y-1 rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Importe bruto + IVA</span>
                  <span className="font-medium">
                    {importeBrutoTotal ? `$${importeBrutoTotal.toLocaleString("es-AR")}` : "—"}
                    {ivaSobreBrutoTotal ? ` + $${ivaSobreBrutoTotal.toLocaleString("es-AR")}` : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span>Importe neto (+ gastos/tributos)</span>
                  <span>{importeNeto ? `$${importeNeto.toLocaleString("es-AR")}` : "—"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? "Guardando..." : "Guardar liquidación de compra"}
        </Button>
      </form>
    </Form>
  );
}
