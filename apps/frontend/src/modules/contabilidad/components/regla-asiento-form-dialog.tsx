import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  reglaAsientoSchema,
  type ReglaAsientoFormValues,
} from "@/modules/contabilidad/domain/regla-asiento.schemas";
import {
  EVENTOS_ASIENTO_LABELS,
  EXPRESION_LABELS,
  EventoAsiento,
  type ExpresionMontoRegla,
  type ReglaAsiento,
} from "@/modules/contabilidad/domain/regla-asiento.types";
import { aplanarArbol } from "@/modules/contabilidad/domain/cuenta.types";
import { TIPO_AUXILIAR_LABELS, TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import { usePlanCuentas } from "@/modules/contabilidad/hooks/use-plan-cuentas";
import { useEventosAsiento } from "@/modules/contabilidad/hooks/use-eventos-asiento";
import { useCrearReglaAsiento } from "@/modules/contabilidad/hooks/use-crear-regla-asiento";
import { useActualizarReglaAsiento } from "@/modules/contabilidad/hooks/use-actualizar-regla-asiento";
import { CuentaSelect } from "@/modules/contabilidad/components/cuenta-select";
import { MedioPago, MEDIO_PAGO_LABELS } from "@/modules/cobros/domain/cobro.types";
import { ApiError } from "@/shared/api/api-response";

const LINEA_VACIA = { lado: "debe" as const, cuentaId: "", expresion: "", auxiliarResolver: null };

interface ReglaAsientoFormDialogProps {
  /** Si viene, el form edita esta regla (evento fijo, no se puede cambiar). Si no, crea una nueva. */
  regla?: ReglaAsiento;
}

function valoresPorDefecto(regla?: ReglaAsiento): ReglaAsientoFormValues {
  return {
    evento: regla?.evento ?? "",
    nombre: regla?.nombre ?? "",
    activa: regla?.activa ?? true,
    prioridad: regla?.prioridad ?? 0,
    medioPago: regla?.condicion?.medioPago ?? "",
    lineas: regla
      ? regla.lineas
          .slice()
          .sort((a, b) => a.orden - b.orden)
          .map((l) => ({
            lado: l.lado,
            cuentaId: l.cuentaId,
            expresion: l.expresion,
            auxiliarResolver: l.auxiliarResolver,
          }))
      : [
          { ...LINEA_VACIA, lado: "debe" },
          { ...LINEA_VACIA, lado: "haber" },
        ],
  };
}

/**
 * ABM de una regla de asiento automático (fase 2). El evento define qué
 * `expresion`/`auxiliarResolver` tienen sentido en cada línea (ver
 * `useEventosAsiento`) — por eso, al crear, cambiar de evento reinicia las
 * líneas: la configuración de un evento no tiene por qué servir para otro.
 * Una vez creada la regla, el evento queda fijo (igual que `tipo` en un
 * asiento) porque el backend no lo deja editar.
 */
export function ReglaAsientoFormDialog({ regla }: ReglaAsientoFormDialogProps) {
  const [open, setOpen] = useState(false);
  const eventosQuery = useEventosAsiento();
  const planCuentasQuery = usePlanCuentas();
  const crear = useCrearReglaAsiento();
  const actualizar = useActualizarReglaAsiento();
  const isPending = crear.isPending || actualizar.isPending;

  const cuentasImputables = (planCuentasQuery.data ? aplanarArbol(planCuentasQuery.data.arbol) : []).filter(
    (c) => c.imputable && c.activa,
  );

  const form = useForm<ReglaAsientoFormValues>({
    resolver: zodResolver(reglaAsientoSchema),
    defaultValues: valoresPorDefecto(regla),
  });

  const lineasField = useFieldArray({ control: form.control, name: "lineas" });
  const eventoSeleccionado = form.watch("evento");
  const eventoInfo = eventosQuery.data?.find((e) => e.evento === eventoSeleccionado);

  function handleEventoChange(nuevoEvento: string) {
    form.setValue("evento", nuevoEvento, { shouldValidate: true });
    if (!regla) {
      form.setValue("medioPago", "");
      lineasField.replace([
        { ...LINEA_VACIA, lado: "debe" },
        { ...LINEA_VACIA, lado: "haber" },
      ]);
    }
  }

  function handleSubmit(values: ReglaAsientoFormValues) {
    const condicion =
      values.evento === EventoAsiento.COBRO_REGISTRADO && values.medioPago ? { medioPago: values.medioPago } : null;

    const lineas = values.lineas.map((l) => ({
      lado: l.lado,
      cuentaId: l.cuentaId,
      expresion: l.expresion,
      auxiliarResolver: l.auxiliarResolver || null,
    }));

    const accion = regla
      ? actualizar.mutateAsync({
          id: regla.id,
          input: { nombre: values.nombre, activa: values.activa, prioridad: values.prioridad, condicion, lineas },
        })
      : crear.mutateAsync({
          evento: values.evento,
          nombre: values.nombre,
          activa: values.activa,
          prioridad: values.prioridad,
          condicion,
          lineas,
        });

    accion
      .then(() => {
        toast.success(regla ? "Regla de asiento actualizada correctamente" : "Regla de asiento creada correctamente");
        setOpen(false);
        form.reset();
      })
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo guardar la regla de asiento");
      });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) form.reset(valoresPorDefecto(regla));
      }}
    >
      <DialogTrigger asChild>
        {regla ? (
          <Button variant="ghost" size="icon" title="Editar regla de asiento">
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button size="sm">
            <Plus />
            Nueva regla
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{regla ? `Editar "${regla.nombre}"` : "Nueva regla de asiento"}</DialogTitle>
          <DialogDescription>
            Cuando pasa el evento elegido, se genera un asiento en borrador con estas líneas — el monto y el
            auxiliar de cada una se resuelven según el documento puntual.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="evento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Evento</FormLabel>
                    <Select onValueChange={handleEventoChange} value={field.value} disabled={!!regla}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Elegí un evento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regla ? (
                          <SelectItem value={regla.evento}>{EVENTOS_ASIENTO_LABELS[regla.evento]}</SelectItem>
                        ) : (
                          (eventosQuery.data ?? []).map((e) => (
                            <SelectItem key={e.evento} value={e.evento}>
                              {e.etiqueta}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Cobro en efectivo a Caja" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="prioridad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" {...field} />
                    </FormControl>
                    <p className="text-muted-foreground text-xs">
                      Si varias reglas activas matchean, se usa la de menor número.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="activa"
                render={({ field }) => (
                  <FormItem>
                    <label className="flex h-9 w-fit cursor-pointer items-center gap-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="accent-primary size-4"
                        />
                      </FormControl>
                      <span className="text-sm font-medium">Activa</span>
                    </label>
                  </FormItem>
                )}
              />
              {eventoSeleccionado === EventoAsiento.COBRO_REGISTRADO && (
                <FormField
                  control={form.control}
                  name="medioPago"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Solo si el medio de pago es (opcional)</FormLabel>
                      <Select
                        value={field.value || "__cualquiera__"}
                        onValueChange={(v) => field.onChange(v === "__cualquiera__" ? "" : v)}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__cualquiera__">— Cualquiera —</SelectItem>
                          {Object.values(MedioPago).map((mp) => (
                            <SelectItem key={mp} value={mp}>
                              {MEDIO_PAGO_LABELS[mp]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-muted-foreground text-xs">
                        Vacío = aplica a cualquier medio de pago. Usalo para armar una regla por medio (ej. una
                        para efectivo a Caja, otra para transferencia a Banco).
                      </p>
                    </FormItem>
                  )}
                />
              )}
            </div>

            {!eventoSeleccionado ? (
              <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
                Elegí un evento para configurar las líneas.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Líneas</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => lineasField.append({ ...LINEA_VACIA })}
                  >
                    <Plus />
                    Línea
                  </Button>
                </div>
                {lineasField.fields.map((item, index) => (
                  <div key={item.id} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[5rem_2fr_1fr_1fr_auto]">
                    <FormField
                      control={form.control}
                      name={`lineas.${index}.lado`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lado</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="debe">Debe</SelectItem>
                              <SelectItem value="haber">Haber</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
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
                      name={`lineas.${index}.expresion`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Importe</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Elegí" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(eventoInfo?.expresiones ?? []).map((exp: ExpresionMontoRegla) => (
                                <SelectItem key={exp} value={exp}>
                                  {EXPRESION_LABELS[exp]}
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
                      name={`lineas.${index}.auxiliarResolver`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Auxiliar</FormLabel>
                          <Select
                            value={field.value || "__ninguno__"}
                            onValueChange={(v) => field.onChange(v === "__ninguno__" ? null : v)}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="__ninguno__">— Ninguno —</SelectItem>
                              {(eventoInfo?.auxiliares ?? []).map((aux) => (
                                <SelectItem key={aux} value={aux}>
                                  {TIPO_AUXILIAR_LABELS[aux as TipoAuxiliar]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-6"
                      disabled={lineasField.fields.length === 1}
                      onClick={() => lineasField.remove(index)}
                      title="Quitar línea"
                    >
                      <Trash2 className="text-destructive size-4" />
                    </Button>
                  </div>
                ))}
                {form.formState.errors.lineas?.message && (
                  <p className="text-destructive text-sm">{form.formState.errors.lineas.message}</p>
                )}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
