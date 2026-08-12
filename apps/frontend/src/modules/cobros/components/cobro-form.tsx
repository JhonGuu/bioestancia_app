import { useFieldArray, useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { createCobroSchema, type CreateCobroFormValues } from "@/modules/cobros/domain/cobro.schemas";
import { MedioPago, MEDIO_PAGO_LABELS, esMedioPagoCheque } from "@/modules/cobros/domain/cobro.types";
import { useClientes } from "@/modules/clientes/hooks/use-clientes";
import { nombreCliente } from "@/modules/clientes/domain/cliente.types";
import { useSaldoCliente } from "@/modules/cuenta-corriente/hooks/use-saldo-cliente";

type FormInput = z.input<typeof createCobroSchema>;
type FormOutput = z.output<typeof createCobroSchema>;
type FormControlType = Control<FormInput, unknown, FormOutput>;

const formatoMoneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function lineaVacia() {
  return {
    medioPago: MedioPago.EFECTIVO,
    monto: "",
    numeroCheque: "",
    bancoCheque: "",
    cuitLibradorCheque: "",
    titularCheque: "",
    fechaEmisionCheque: "",
    fechaPagoCheque: "",
  };
}

interface CobroFormProps {
  onSubmit: (values: CreateCobroFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * Formulario de carga de un cobro: cliente + fecha + una o más líneas de
 * pago (medios distintos en un mismo cobro, ej. parte efectivo + parte
 * cheque). El backend aplica el monto total a las boletas pendientes del
 * cliente con FIFO al guardar — acá solo se muestra el saldo actual como
 * referencia, no se elige a qué boleta se aplica.
 */
export function CobroForm({ onSubmit, isSubmitting }: CobroFormProps) {
  const clientesQuery = useClientes();

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(createCobroSchema),
    defaultValues: {
      clienteId: "",
      fecha: hoyISO(),
      comentarios: "",
      lineas: [lineaVacia()],
    },
  });

  const clienteId = useWatch({ control: form.control, name: "clienteId" });
  const saldoQuery = useSaldoCliente(clienteId || undefined);

  const lineasField = useFieldArray({ control: form.control, name: "lineas" });
  const lineasValues = useWatch({ control: form.control, name: "lineas" });
  const totalCobro = (lineasValues ?? []).reduce((acc, l) => acc + (Number(l?.monto) || 0), 0);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="clienteId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Elegí un cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(clientesQuery.data ?? []).map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {nombreCliente(cliente)}
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

        {clienteId && saldoQuery.data && (
          <Card className="bg-muted/30">
            <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <SaldoDato label="Vencido" valor={saldoQuery.data.saldoVencido} destacado />
              <SaldoDato label="Por vencer" valor={saldoQuery.data.saldoPorVencer} />
              <SaldoDato label="Total" valor={saldoQuery.data.saldoTotal} />
              <SaldoDato label="A favor" valor={saldoQuery.data.saldoAFavor} />
            </CardContent>
          </Card>
        )}

        <FormField
          control={form.control}
          name="comentarios"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comentarios (opcional)</FormLabel>
              <FormControl>
                <Textarea {...field} rows={2} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Líneas de pago</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => lineasField.append(lineaVacia())}
            >
              <Plus className="size-4" />
              Agregar línea
            </Button>
          </div>

          {lineasField.fields.map((field, index) => (
            <LineaCobroRow
              key={field.id}
              control={form.control}
              index={index}
              onRemove={lineasField.fields.length > 1 ? () => lineasField.remove(index) : undefined}
            />
          ))}

          <p className="text-right text-sm font-medium">Total: {formatoMoneda.format(totalCobro)}</p>
        </div>

        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-fit">
          {isSubmitting ? "Guardando..." : "Guardar cobro"}
        </Button>
      </form>
    </Form>
  );
}

function SaldoDato({ label, valor, destacado }: { label: string; valor: number; destacado?: boolean }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={destacado && valor > 0 ? "text-destructive font-semibold" : "font-medium"}>
        {formatoMoneda.format(valor)}
      </p>
    </div>
  );
}

/** Una línea de pago — muestra los campos de cheque solo si el medio elegido es CHEQUE o ECHEQ. */
function LineaCobroRow({
  control,
  index,
  onRemove,
}: {
  control: FormControlType;
  index: number;
  onRemove?: () => void;
}) {
  const medioPago = useWatch({ control, name: `lineas.${index}.medioPago` });
  const esCheque = esMedioPagoCheque(medioPago);

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-2">
          <FormField
            control={control}
            name={`lineas.${index}.medioPago`}
            render={({ field }) => (
              <FormItem className="min-w-48 flex-1">
                <FormLabel>Medio de pago</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(MedioPago).map((valor) => (
                      <SelectItem key={valor} value={valor}>
                        {MEDIO_PAGO_LABELS[valor]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`lineas.${index}.monto`}
            render={({ field }) => (
              <FormItem className="w-32">
                <FormLabel>Monto</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    {...field}
                    value={field.value as string | number}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {onRemove && (
            <Button type="button" variant="ghost" size="icon" onClick={onRemove} title="Quitar línea">
              <Trash2 className="text-destructive size-4" />
            </Button>
          )}
        </div>

        {esCheque && (
          <div className="bg-muted/50 grid grid-cols-1 gap-3 rounded-md p-3 sm:grid-cols-2">
            <FormField
              control={control}
              name={`lineas.${index}.numeroCheque`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de cheque</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`lineas.${index}.bancoCheque`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banco</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`lineas.${index}.fechaEmisionCheque`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de emisión</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`lineas.${index}.fechaPagoCheque`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de pago</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`lineas.${index}.cuitLibradorCheque`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CUIT del librador (opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`lineas.${index}.titularCheque`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titular (opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
