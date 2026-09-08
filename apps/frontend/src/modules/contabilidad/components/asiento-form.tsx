import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { asientoSchema, type AsientoFormValues } from "@/modules/contabilidad/domain/asiento.schemas";
import {
  RESPALDO_LABELS,
  RespaldoAsiento,
  TIPO_ASIENTO_LABELS,
  TipoAsiento,
  calcularTotales,
  type Asiento,
} from "@/modules/contabilidad/domain/asiento.types";
import { aplanarArbol, type CuentaNodo } from "@/modules/contabilidad/domain/cuenta.types";
import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import { usePlanCuentas } from "@/modules/contabilidad/hooks/use-plan-cuentas";
import { useCentrosCosto } from "@/modules/contabilidad/hooks/use-centros-costo";
import { CuentaSelect } from "@/modules/contabilidad/components/cuenta-select";
import { AuxiliarPicker } from "@/modules/contabilidad/components/auxiliar-picker";
import { cn } from "@/lib/utils";

const LINEA_VACIA = {
  cuentaId: "",
  debe: "",
  haber: "",
  detalle: "",
  auxiliarTipo: undefined,
  auxiliarId: "",
  centroCostoId: "",
};

interface AsientoFormProps {
  /** Si viene, el form edita este asiento (tipo fijo, no se puede cambiar). Si no, crea uno nuevo. */
  asiento?: Asiento;
  onSubmit: (values: AsientoFormValues, confirmar: boolean) => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * Form de carga/edición de un asiento, con validación de partida doble en
 * vivo (el total de debe/haber se recalcula en cada tecla, igual que la
 * regla que valida el backend al guardar).
 */
export function AsientoForm({ asiento, onSubmit, isSubmitting }: AsientoFormProps) {
  const planCuentasQuery = usePlanCuentas();
  const centrosCostoQuery = useCentrosCosto();

  const cuentasImputables = (planCuentasQuery.data ? aplanarArbol(planCuentasQuery.data.arbol) : []).filter(
    (c: CuentaNodo) => c.imputable && c.activa,
  );
  const cuentasPorId = new Map(cuentasImputables.map((c) => [c.id, c]));

  const form = useForm<z.input<typeof asientoSchema>, unknown, z.output<typeof asientoSchema>>({
    resolver: zodResolver(asientoSchema),
    defaultValues: {
      fecha: asiento?.fecha ? asiento.fecha.slice(0, 10) : "",
      descripcion: asiento?.descripcion ?? "",
      tipo: asiento?.tipo ?? TipoAsiento.MANUAL,
      respaldo: asiento?.respaldo ?? RespaldoAsiento.SIN_COMPROBANTE,
      lineas: asiento
        ? asiento.lineas.map((l) => ({
            cuentaId: l.cuentaId,
            debe: l.debe,
            haber: l.haber,
            detalle: l.detalle ?? "",
            auxiliarTipo: l.auxiliarTipo ?? undefined,
            auxiliarId: l.auxiliarId ?? "",
            centroCostoId: l.centroCostoId ?? "",
          }))
        : [{ ...LINEA_VACIA }, { ...LINEA_VACIA }],
    },
  });

  const lineasField = useFieldArray({ control: form.control, name: "lineas" });
  const lineasActuales = form.watch("lineas");
  const totales = calcularTotales(lineasActuales.map((l) => ({ debe: Number(l.debe) || 0, haber: Number(l.haber) || 0 })));
  const balanceado = totales.diferencia === 0 && totales.debe > 0;

  function handleSubmit(confirmar: boolean) {
    return form.handleSubmit((values) => onSubmit(values, confirmar));
  }

  return (
    <Form {...form}>
      <form className="grid gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!!asiento}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(TipoAsiento).map((value) => (
                      <SelectItem key={value} value={value}>
                        {TIPO_ASIENTO_LABELS[value]}
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
            name="respaldo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Respaldo documental</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(RespaldoAsiento).map((value) => (
                      <SelectItem key={value} value={value}>
                        {RESPALDO_LABELS[value]}
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
            name="descripcion"
            render={({ field }) => (
              <FormItem className="sm:col-span-2 lg:col-span-1">
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">Líneas</CardTitle>
              <div className="flex items-center gap-3">
                <TotalesBadge label="Debe" valor={totales.debe} />
                <TotalesBadge label="Haber" valor={totales.haber} />
                <span
                  className={cn(
                    "text-sm font-medium",
                    balanceado ? "text-green-600 dark:text-green-500" : "text-destructive",
                  )}
                >
                  {balanceado ? "Balanceado" : `Diferencia: ${totales.diferencia.toFixed(2)}`}
                </span>
                <Button type="button" variant="outline" size="sm" onClick={() => lineasField.append({ ...LINEA_VACIA })}>
                  <Plus />
                  Línea
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {lineasField.fields.map((item, index) => {
              const cuentaId = form.watch(`lineas.${index}.cuentaId`);
              const cuenta = cuentasPorId.get(cuentaId);
              const pideAuxiliar = cuenta && cuenta.requiereAuxiliar !== TipoAuxiliar.NINGUNO;

              return (
                <div key={item.id} className="grid gap-3 rounded-lg border p-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
                    <FormField
                      control={form.control}
                      name={`lineas.${index}.cuentaId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cuenta</FormLabel>
                          <FormControl>
                            <CuentaSelect cuentas={cuentasImputables} value={field.value} onChange={field.onChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`lineas.${index}.debe`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Debe</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min={0} {...field} value={field.value as string | number} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`lineas.${index}.haber`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Haber</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min={0} {...field} value={field.value as string | number} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-6"
                      disabled={lineasField.fields.length === 2}
                      onClick={() => lineasField.remove(index)}
                      title="Quitar línea"
                    >
                      <Trash2 className="text-destructive size-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name={`lineas.${index}.detalle`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Detalle</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    {pideAuxiliar && cuenta && (
                      <FormField
                        control={form.control}
                        name={`lineas.${index}.auxiliarId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{cuenta.nombre} — auxiliar</FormLabel>
                            <FormControl>
                              <AuxiliarPicker
                                tipo={cuenta.requiereAuxiliar}
                                value={field.value ?? ""}
                                onChange={(v) => {
                                  field.onChange(v);
                                  form.setValue(`lineas.${index}.auxiliarTipo`, cuenta.requiereAuxiliar);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={form.control}
                      name={`lineas.${index}.centroCostoId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Centro de costo</FormLabel>
                          <Select value={field.value || "__ninguno__"} onValueChange={(v) => field.onChange(v === "__ninguno__" ? "" : v)}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="__ninguno__">— Ninguno —</SelectItem>
                              {(centrosCostoQuery.data ?? [])
                                .filter((c) => c.activo)
                                .map((centro) => (
                                  <SelectItem key={centro.id} value={centro.id}>
                                    {centro.codigo} {centro.nombre}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              );
            })}
            {form.formState.errors.lineas?.message && (
              <p className="text-destructive text-sm">{form.formState.errors.lineas.message}</p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={isSubmitting} onClick={handleSubmit(false)} variant={asiento ? "default" : "outline"}>
            {isSubmitting ? "Guardando..." : asiento ? "Guardar cambios" : "Guardar borrador"}
          </Button>
          {!asiento && (
            <Button type="button" disabled={isSubmitting} onClick={handleSubmit(true)}>
              {isSubmitting ? "Guardando..." : "Guardar y confirmar"}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}

function TotalesBadge({ label, valor }: { label: string; valor: number }) {
  return (
    <span className="text-muted-foreground text-sm">
      {label}: <span className="text-foreground font-medium">{valor.toFixed(2)}</span>
    </span>
  );
}
