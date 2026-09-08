import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { aperturaSchema, type AperturaFormValues } from "@/modules/contabilidad/domain/apertura.schemas";
import { aplanarArbol, type CuentaNodo } from "@/modules/contabilidad/domain/cuenta.types";
import { tieneSaldoDeudor } from "@/modules/contabilidad/domain/tipo-cuenta";
import { redondear2 } from "@/modules/contabilidad/domain/asiento.types";
import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import type { EjercicioConPeriodos } from "@/modules/contabilidad/domain/ejercicio.types";
import { usePlanCuentas } from "@/modules/contabilidad/hooks/use-plan-cuentas";
import { CuentaSelect } from "@/modules/contabilidad/components/cuenta-select";
import { AuxiliarPicker } from "@/modules/contabilidad/components/auxiliar-picker";
import { cn } from "@/lib/utils";

const SALDO_VACIO = { cuentaId: "", importe: "", auxiliarId: "", detalle: "" };

export interface SaldoImportadoFormValues {
  cuentaId: string;
  importe: string;
  auxiliarId: string;
  detalle: string;
}

interface AperturaFormProps {
  ejerciciosAbiertos: EjercicioConPeriodos[];
  onSubmit: (values: AperturaFormValues, confirmar: boolean) => Promise<void>;
  isSubmitting?: boolean;
  /**
   * Saldos resueltos por la importación desde Excel (ver
   * `ImportarSaldosButton` en `apertura.tsx`) — al cambiar `nonce`
   * reemplaza las filas actuales, así el usuario los revisa y edita acá
   * mismo antes de generar el asiento.
   */
  saldosImportados?: { saldos: SaldoImportadoFormValues[]; nonce: number } | null;
}

/**
 * Genera el asiento de apertura a partir de los saldos iniciales: vos cargás
 * cuánto tiene cada cuenta (con signo) y el sistema decide de qué lado va
 * según su naturaleza — mismo cálculo que `tieneSaldoDeudor` en el backend,
 * así el control de partida doble se ve en vivo acá también.
 */
export function AperturaForm({ ejerciciosAbiertos, onSubmit, isSubmitting, saldosImportados }: AperturaFormProps) {
  const planCuentasQuery = usePlanCuentas();
  const cuentasImputables = (planCuentasQuery.data ? aplanarArbol(planCuentasQuery.data.arbol) : []).filter(
    (c: CuentaNodo) => c.imputable && c.activa,
  );
  const cuentasPorId = new Map(cuentasImputables.map((c) => [c.id, c]));

  const form = useForm<z.input<typeof aperturaSchema>, unknown, z.output<typeof aperturaSchema>>({
    resolver: zodResolver(aperturaSchema),
    defaultValues: {
      ejercicioId: ejerciciosAbiertos[0]?.id ?? "",
      fecha: "",
      descripcion: "",
      cuentaAjusteId: "",
      saldos: [{ ...SALDO_VACIO }],
    },
  });

  const saldosField = useFieldArray({ control: form.control, name: "saldos" });
  const saldosActuales = form.watch("saldos");

  useEffect(() => {
    if (!saldosImportados) return;
    saldosField.replace(saldosImportados.saldos.length > 0 ? saldosImportados.saldos : [{ ...SALDO_VACIO }]);
    // Solo cuando cambia el lote importado (`nonce`), no en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saldosImportados?.nonce]);

  let totalDebe = 0;
  let totalHaber = 0;
  for (const saldo of saldosActuales) {
    const cuenta = cuentasPorId.get(saldo.cuentaId);
    const importe = Number(saldo.importe) || 0;
    if (!cuenta || importe === 0) continue;
    const alDebe = tieneSaldoDeudor(cuenta.tipo) === importe > 0;
    if (alDebe) totalDebe += Math.abs(importe);
    else totalHaber += Math.abs(importe);
  }
  totalDebe = redondear2(totalDebe);
  totalHaber = redondear2(totalHaber);
  const diferencia = redondear2(totalDebe - totalHaber);
  const balanceado = diferencia === 0 && totalDebe > 0;

  function handleSubmit(confirmar: boolean) {
    return form.handleSubmit((values) => onSubmit(values, confirmar));
  }

  return (
    <Form {...form}>
      <form className="grid gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField
            control={form.control}
            name="ejercicioId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ejercicio</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Elegí un ejercicio abierto" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ejerciciosAbiertos.map((ejercicio) => (
                      <SelectItem key={ejercicio.id} value={ejercicio.id}>
                        {ejercicio.nombre}
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
                <FormLabel>Fecha (opcional)</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <p className="text-muted-foreground text-xs">Si no se indica, usa el inicio del ejercicio.</p>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="descripcion"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Descripción (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder='Por defecto: "Asiento de apertura — <ejercicio>"' {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">Saldos iniciales</CardTitle>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-sm">
                  Debe: <span className="text-foreground font-medium">{totalDebe.toFixed(2)}</span>
                </span>
                <span className="text-muted-foreground text-sm">
                  Haber: <span className="text-foreground font-medium">{totalHaber.toFixed(2)}</span>
                </span>
                <span className={cn("text-sm font-medium", balanceado ? "text-green-600 dark:text-green-500" : "text-destructive")}>
                  {balanceado ? "Cierra" : `Diferencia: ${diferencia.toFixed(2)}`}
                </span>
                <Button type="button" variant="outline" size="sm" onClick={() => saldosField.append({ ...SALDO_VACIO })}>
                  <Plus />
                  Saldo
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {saldosField.fields.map((item, index) => {
              const cuentaId = form.watch(`saldos.${index}.cuentaId`);
              const cuenta = cuentasPorId.get(cuentaId);
              const pideAuxiliar = cuenta && cuenta.requiereAuxiliar !== TipoAuxiliar.NINGUNO;

              return (
                <div key={item.id} className="grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-[2fr_1fr_2fr_auto]">
                  <FormField
                    control={form.control}
                    name={`saldos.${index}.cuentaId`}
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
                    name={`saldos.${index}.importe`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Importe</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value as string | number} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {pideAuxiliar && cuenta ? (
                    <FormField
                      control={form.control}
                      name={`saldos.${index}.auxiliarId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{cuenta.nombre} — auxiliar</FormLabel>
                          <FormControl>
                            <AuxiliarPicker tipo={cuenta.requiereAuxiliar} value={field.value ?? ""} onChange={field.onChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name={`saldos.${index}.detalle`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Detalle (opcional)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6"
                    disabled={saldosField.fields.length === 1}
                    onClick={() => saldosField.remove(index)}
                    title="Quitar saldo"
                  >
                    <Trash2 className="text-destructive size-4" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {!balanceado && totalDebe + totalHaber > 0 && (
          <FormField
            control={form.control}
            name="cuentaAjusteId"
            render={({ field }) => (
              <FormItem className="max-w-sm">
                <FormLabel>Cuenta de ajuste (si no cierra)</FormLabel>
                <Select value={field.value || "__ninguna__"} onValueChange={(v) => field.onChange(v === "__ninguna__" ? "" : v)}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sin cuenta de ajuste" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__ninguna__">— Sin cuenta de ajuste —</SelectItem>
                    {cuentasImputables.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.codigo} {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  Si no cierra y no elegís una cuenta de ajuste, el servidor va a rechazar el asiento.
                </p>
              </FormItem>
            )}
          />
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={handleSubmit(false)}>
            {isSubmitting ? "Guardando..." : "Generar borrador"}
          </Button>
          <Button type="button" disabled={isSubmitting} onClick={handleSubmit(true)}>
            {isSubmitting ? "Guardando..." : "Generar y confirmar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
