import { useEffect, useState } from "react";
import { useFieldArray, useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createBoletaSchema,
  type CreateBoletaFormValues,
} from "@/modules/boletas/domain/boleta.schemas";
import { FormaVenta, FORMA_VENTA_LABELS } from "@/modules/ventas/domain/venta.types";
import { CategoriaPorcino } from "@/modules/compras/domain/compra.types";
import type { Compra } from "@/modules/compras/domain/compra.types";
import { useClientes } from "@/modules/clientes/hooks/use-clientes";
import { nombreCliente, type Cliente } from "@/modules/clientes/domain/cliente.types";
import { useClientesFinales } from "@/modules/clientes/hooks/use-clientes-finales";
import { useCreateClienteFinal } from "@/modules/clientes/hooks/use-create-cliente-final";
import type { ClienteFinal } from "@/modules/clientes/domain/cliente-final.types";
import { useCompras } from "@/modules/compras/hooks/use-compras";
import { useBoletas } from "@/modules/boletas/hooks/use-boletas";
import { sugerirProximoNumero } from "@/modules/boletas/domain/sugerir-numero";
import { hoyISO } from "@/shared/lib/date";

type FormInput = z.input<typeof createBoletaSchema>;
type FormOutput = z.output<typeof createBoletaSchema>;
type FormControlType = Control<FormInput, unknown, FormOutput>;

/** "Tropa 379 - A" (o solo "Tropa 379" si no tiene letra asignada todavía). */
function tropaLabel(compra: Compra): string {
  return compra.letra ? `Tropa ${compra.numero} - ${compra.letra}` : `Tropa ${compra.numero}`;
}

/** Presentaciones válidas para un ítem de tropa (todo menos compensación de kg, que no aplica acá). */
type PresentacionTropa = typeof FormaVenta.CABEZA | typeof FormaVenta.MEDIA_RES | typeof FormaVenta.PULPA;
/** Novillo no tiene "pulpa" como opción hoy — reventa siempre entera o por mitad. */
type PresentacionNovillo = typeof FormaVenta.CABEZA | typeof FormaVenta.MEDIA_RES;

/** "Porcina Capón" → "Capón" — más corto y legible en una tarjeta chica. */
function categoriaCorta(categoria: string): string {
  return categoria.replace(/^Porcina\s+/, "");
}

/**
 * Cuenta las cabezas de la boleta hasta el momento — usada solo para
 * sugerir el descuento fijo por cabeza del cliente (`CompensacionesCard`),
 * no afecta lo que se manda al backend. Heurística simple: `cabeza`/reventa
 * entera cuenta 1, `media_res` cuenta 0.5 (es la mitad de un animal), `pulpa`
 * no suma (es un corte, no una cabeza).
 */
function contarCabezas(
  tropas: { items: { formaVenta: FormaVenta }[] }[],
  novillo: { formaVenta: FormaVenta }[],
): number {
  const contarItem = (formaVenta: FormaVenta) => {
    if (formaVenta === FormaVenta.CABEZA) return 1;
    if (formaVenta === FormaVenta.MEDIA_RES) return 0.5;
    return 0;
  };
  const deTropas = tropas.flatMap((t) => t.items).reduce((acc, item) => acc + contarItem(item.formaVenta), 0);
  const deNovillo = novillo.reduce((acc, item) => acc + contarItem(item.formaVenta), 0);
  return deTropas + deNovillo;
}

interface BoletaFormProps {
  onSubmit: (values: CreateBoletaFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * Formulario de carga de boleta — mobile-first (el operario lo usa desde el
 * celular mientras reparte).
 *
 * Una boleta puede juntar ítems de VARIAS tropas distintas para un mismo
 * cliente (ej. 10 animales de la tropa "379-A" + 20 de la "380-F") — por eso
 * la carga es "una card por tropa", no un único selector de tropa arriba.
 * Cada card tiene un generador rápido: elegís presentación + categoría +
 * cantidad UNA vez ("10 medias res de Capón") y arma esa cantidad de líneas
 * ya con esos datos cargados — al operario solo le queda tipear garrón y
 * peso en cada una, que es literalmente lo único que cambia línea a línea en
 * la boleta de papel.
 *
 * "Novillo" (reventa de bovino, sin tropa propia — ver
 * `modules/ventas/domain/categoria-venta.ts`) tiene su propia card aparte,
 * sin selector de tropa.
 */
export function BoletaForm({ onSubmit, isSubmitting }: BoletaFormProps) {
  const clientesQuery = useClientes();
  const comprasQuery = useCompras();
  const boletasQuery = useBoletas();

  // Solo tropas abiertas: una cerrada no debería seguir recibiendo boletas
  // nuevas desde el celular (si hace falta corregir algo, es un caso de
  // back-office).
  const tropasAbiertas = (comprasQuery.data ?? []).filter((c) => !c.cerrada);
  const comprasPorId = new Map(tropasAbiertas.map((c) => [c.id, c]));

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(createBoletaSchema),
    defaultValues: {
      clienteId: "",
      fecha: hoyISO(),
      numero: "",
      comentarios: "",
      tropas: [],
      novillo: [],
      compensaciones: [],
    },
  });

  // Novillo (reventa) solo aplica a clientes marcados `esRevendedor` (ver
  // `cliente-form.tsx`) — hoy, en la práctica, un único cliente ("Ivan").
  const clienteIdSeleccionado = useWatch({ control: form.control, name: "clienteId" });
  const clienteSeleccionado = (clientesQuery.data ?? []).find((c) => c.id === clienteIdSeleccionado);
  const clientesFinalesQuery = useClientesFinales(
    clienteSeleccionado?.esRevendedor ? clienteIdSeleccionado : undefined,
  );

  // Sugiere el próximo número de boleta apenas se cargan las boletas
  // existentes — solo si el operario todavía no tocó el campo a mano.
  useEffect(() => {
    if (boletasQuery.data && !form.formState.dirtyFields.numero) {
      const sugerido = sugerirProximoNumero(boletasQuery.data);
      if (sugerido) form.setValue("numero", sugerido);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boletasQuery.data]);

  const tropasField = useFieldArray({ control: form.control, name: "tropas" });
  const novilloField = useFieldArray({ control: form.control, name: "novillo" });
  const compensacionesField = useFieldArray({ control: form.control, name: "compensaciones" });

  // Cabezas actuales de la boleta (para sugerir el descuento fijo por
  // cabeza del cliente, si tiene uno configurado — ver `CompensacionesCard`).
  // Media res cuenta como media cabeza; pulpa/novillo sin garrón no suman.
  const tropasActuales = useWatch({ control: form.control, name: "tropas" });
  const novilloActual = useWatch({ control: form.control, name: "novillo" });
  const cabezasActuales = contarCabezas(tropasActuales, novilloActual);

  // Si se cambia a un cliente que no es revendedor, la card de Novillo
  // desaparece — limpiamos lo que se hubiera cargado para no mandar ítems de
  // reventa "huérfanos" de un cliente que ya no es el seleccionado.
  useEffect(() => {
    if (!clienteSeleccionado?.esRevendedor && novilloField.fields.length > 0) {
      novilloField.replace([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteSeleccionado?.esRevendedor]);

  const tropasAgregadasIds = new Set(tropasField.fields.map((f) => f.compraId));
  const tropasDisponibles = tropasAbiertas.filter((t) => !tropasAgregadasIds.has(t.id));

  // El error de "agregá al menos un ítem" (refine a nivel del form entero,
  // path ["tropas"]) puede quedar en `errors.tropas.message` o en
  // `errors.tropas.root.message` según la versión de RHF/resolver — se
  // castea a un shape laxo y se chequean los dos, para no depender de ese
  // detalle interno (el tipo que expone RHF para errores de field array es
  // el de cada línea, no el de un mensaje a nivel del array completo).
  const tropasErrorState = form.formState.errors.tropas as
    | { message?: string; root?: { message?: string } }
    | undefined;
  const errorTropas = tropasErrorState?.message ?? tropasErrorState?.root?.message;

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

        <FormField
          control={form.control}
          name="numero"
          render={({ field }) => (
            <FormItem className="max-w-xs">
              <FormLabel>Número de boleta</FormLabel>
              <FormControl>
                <Input {...field} placeholder="El impreso en el papel" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold">Tropas</h2>
            <TropaPickerSheet
              tropasDisponibles={tropasDisponibles}
              onSelect={(compraId) => tropasField.append({ compraId, items: [] })}
            />
          </div>

          {errorTropas && <p className="text-destructive text-sm">{errorTropas}</p>}

          {tropasField.fields.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Agregá una tropa arriba para empezar a cargar animales.
            </p>
          )}

          {tropasField.fields.map((field, tropaIndex) => (
            <TropaCard
              key={field.id}
              control={form.control}
              tropaIndex={tropaIndex}
              compra={comprasPorId.get(field.compraId)}
              onRemove={() => tropasField.remove(tropaIndex)}
            />
          ))}
        </div>

        {clienteSeleccionado?.esRevendedor && (
          <NovilloCard
            control={form.control}
            field={novilloField}
            clienteId={clienteIdSeleccionado}
            clientesFinales={clientesFinalesQuery.data ?? []}
          />
        )}

        <CompensacionesCard
          control={form.control}
          field={compensacionesField}
          cliente={clienteSeleccionado}
          cabezasActuales={cabezasActuales}
        />

        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-fit">
          {isSubmitting ? "Guardando..." : "Guardar boleta"}
        </Button>
      </form>
    </Form>
  );
}

/** Card de una tropa dentro de la boleta: generador rápido de lotes + lista de garrón/kg por línea. */
function TropaCard({
  control,
  tropaIndex,
  compra,
  onRemove,
}: {
  control: FormControlType;
  tropaIndex: number;
  compra?: Compra;
  onRemove: () => void;
}) {
  const itemsField = useFieldArray({ control, name: `tropas.${tropaIndex}.items` });

  const [quickForma, setQuickForma] = useState<PresentacionTropa>(FormaVenta.MEDIA_RES);
  const [quickCategoria, setQuickCategoria] = useState<CategoriaPorcino>(CategoriaPorcino.CAPON);
  const [quickCantidad, setQuickCantidad] = useState("10");

  function agregarLote() {
    const cantidad = Math.max(1, Math.floor(Number(quickCantidad) || 1));
    itemsField.append(
      Array.from({ length: cantidad }, () => ({
        formaVenta: quickForma,
        categoria: quickCategoria,
        garron: "",
        kg: "",
      })),
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{compra ? tropaLabel(compra) : "Tropa"}</CardTitle>
        <Button type="button" variant="ghost" size="icon" onClick={onRemove} title="Quitar tropa">
          <Trash2 className="text-destructive size-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="bg-muted/50 flex flex-col gap-2 rounded-md p-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-muted-foreground text-xs font-medium">Presentación</label>
            <Select value={quickForma} onValueChange={(v) => setQuickForma(v as PresentacionTropa)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[FormaVenta.CABEZA, FormaVenta.MEDIA_RES, FormaVenta.PULPA].map((v) => (
                  <SelectItem key={v} value={v}>
                    {FORMA_VENTA_LABELS[v]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-muted-foreground text-xs font-medium">Categoría</label>
            <Select value={quickCategoria} onValueChange={(v) => setQuickCategoria(v as CategoriaPorcino)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(CategoriaPorcino).map((v) => (
                  <SelectItem key={v} value={v}>
                    {categoriaCorta(v)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full space-y-1 sm:w-20">
            <label className="text-muted-foreground text-xs font-medium">Cant.</label>
            <Input
              inputMode="numeric"
              value={quickCantidad}
              onChange={(e) => setQuickCantidad(e.target.value)}
            />
          </div>
          <Button type="button" onClick={agregarLote} className="w-full sm:w-fit">
            <Plus />
            Agregar
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          {itemsField.fields.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Agregá un lote arriba (ej. "10 medias res de Capón") para que aparezcan las líneas.
            </p>
          )}
          {itemsField.fields.map((item, itemIndex) => {
            const necesitaGarron = item.formaVenta !== FormaVenta.PULPA;
            return (
              <div key={item.id} className="flex flex-wrap items-end gap-2 rounded-md border p-2">
                <Badge variant="outline" className="h-9">
                  {FORMA_VENTA_LABELS[item.formaVenta]} · {categoriaCorta(item.categoria)}
                </Badge>
                {necesitaGarron && (
                  <FormField
                    control={control}
                    name={`tropas.${tropaIndex}.items.${itemIndex}.garron`}
                    render={({ field }) => (
                      <FormItem className="w-24">
                        <FormLabel className="sr-only">Garrón</FormLabel>
                        <FormControl>
                          <Input inputMode="numeric" placeholder="Garrón" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={control}
                  name={`tropas.${tropaIndex}.items.${itemIndex}.kg`}
                  render={({ field }) => (
                    <FormItem className="w-24">
                      <FormLabel className="sr-only">Peso</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          placeholder="Kg"
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
                  onClick={() => itemsField.remove(itemIndex)}
                  title="Quitar línea"
                >
                  <Trash2 className="text-destructive size-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Sheet (hoja inferior, cómoda para el pulgar en celular) para elegir la
 * tropa a agregar — reemplaza al `Select` nativo porque con muchas compras
 * cargadas se vuelve una lista larguísima, difícil de recorrer con el dedo.
 * Ofrece las últimas 4 tropas (por fecha de compra) como accesos directos, y
 * un buscador por número/letra para el resto.
 */
function TropaPickerSheet({
  tropasDisponibles,
  onSelect,
}: {
  tropasDisponibles: Compra[];
  onSelect: (compraId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const recientes = [...tropasDisponibles]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 4);

  const busquedaNormalizada = busqueda.trim().toLowerCase();
  const resultados = busquedaNormalizada
    ? tropasDisponibles.filter((t) =>
        `${t.numero} ${t.letra ?? ""}`.toLowerCase().includes(busquedaNormalizada),
      )
    : tropasDisponibles;

  function elegir(compraId: string) {
    onSelect(compraId);
    setOpen(false);
    setBusqueda("");
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" className="w-fit gap-1" disabled={tropasDisponibles.length === 0}>
          <Plus className="size-4" />
          Agregar tropa
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="flex max-h-[85vh] flex-col gap-0">
        <SheetHeader>
          <SheetTitle>Agregar tropa</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 overflow-y-auto p-4">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por número o letra..."
              className="pl-9"
              autoFocus
            />
          </div>

          {!busquedaNormalizada && recientes.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-muted-foreground text-xs font-medium">Recientes</p>
              <div className="flex flex-col gap-2">
                {recientes.map((compra) => (
                  <TropaPickerRow key={compra.id} compra={compra} onClick={() => elegir(compra.id)} />
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {!busquedaNormalizada && (
              <p className="text-muted-foreground text-xs font-medium">Todas las tropas abiertas</p>
            )}
            {resultados.length === 0 && (
              <p className="text-muted-foreground text-sm">Sin resultados para tu búsqueda.</p>
            )}
            {resultados.map((compra) => (
              <TropaPickerRow key={compra.id} compra={compra} onClick={() => elegir(compra.id)} />
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** `0.8` con 2 decimales fijos, sin ceros de más (`0.80` → `0.8`). */
function formatearKg(valor: number): string {
  return (Math.round(valor * 100) / 100).toString();
}

/**
 * Ajustes de kg sin animal físico (descuentos por cerdo golpeado, o el
 * descuento fijo por cabeza de ciertos clientes) — ver
 * `compensacionItemSchema` en `boleta.schemas.ts`. Siempre resta: el
 * operario tipea la magnitud en POSITIVO acá (menos tipeo, sin riesgo de
 * cargarlo con el signo al revés) y `boletas.api.ts` la manda ya en negativo
 * al backend.
 *
 * Si el cliente elegido tiene `descuentoKgPorCabeza` configurado (ver
 * `cliente-form.tsx`), muestra un botón con el descuento sugerido
 * (cabezas actuales × descuento del cliente) para agregarlo con un click —
 * la línea queda editable/borrable como cualquier otra (por ejemplo para
 * bajarlo a 0.5 o 0.4 en un caso puntual), no se fuerza ni se recalcula sola
 * si después se agregan más animales.
 */
function CompensacionesCard({
  control,
  field,
  cliente,
  cabezasActuales,
}: {
  control: FormControlType;
  field: ReturnType<typeof useFieldArray<FormInput, "compensaciones">>;
  cliente?: Cliente;
  cabezasActuales: number;
}) {
  const descuentoCliente = cliente?.descuentoKgPorCabeza;
  const sugerencia =
    descuentoCliente && cabezasActuales > 0 ? Math.round(cabezasActuales * descuentoCliente * 100) / 100 : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Compensación de kg</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-xs">
          Descuento sin animal asociado (ej. un cerdo que vino golpeado) — cargá el kg en positivo, se
          descuenta solo.
        </p>

        {sugerencia !== null && (
          <Button
            type="button"
            variant="outline"
            className="w-fit"
            onClick={() => field.append({ kg: sugerencia, comentarios: "Descuento por cabeza del cliente" })}
          >
            <Plus className="size-4" />
            Aplicar descuento del cliente: {formatearKg(sugerencia)} kg ({cabezasActuales} cabezas ×{" "}
            {descuentoCliente}kg)
          </Button>
        )}

        <div className="flex flex-col gap-2">
          {field.fields.map((item, itemIndex) => (
            <div key={item.id} className="flex flex-wrap items-end gap-2 rounded-md border p-2">
              <FormField
                control={control}
                name={`compensaciones.${itemIndex}.kg`}
                render={({ field: kgField }) => (
                  <FormItem className="w-28">
                    <FormLabel className="sr-only">Kg</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        placeholder="Kg a descontar"
                        {...kgField}
                        value={kgField.value as string | number}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`compensaciones.${itemIndex}.comentarios`}
                render={({ field: comentariosField }) => (
                  <FormItem className="min-w-40 flex-1">
                    <FormLabel className="sr-only">Motivo (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Motivo (opcional)" {...comentariosField} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => field.remove(itemIndex)}
                title="Quitar línea"
              >
                <Trash2 className="text-destructive size-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => field.append({ kg: "", comentarios: "" })}
        >
          <Plus className="size-4" />
          Agregar línea manual
        </Button>
      </CardContent>
    </Card>
  );
}

function TropaPickerRow({ compra, onClick }: { compra: Compra; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hover:bg-accent flex items-center justify-between rounded-md border p-3 text-left"
    >
      <span className="font-medium">{tropaLabel(compra)}</span>
      <span className="text-muted-foreground text-xs">
        {new Date(compra.fecha).toLocaleDateString("es-AR", { timeZone: "UTC" })}
      </span>
    </button>
  );
}

/**
 * Card de reventa de Novillo: sin selector de tropa (no sale de ninguna
 * compra nuestra) y sin selector de categoría (siempre es "Novillo", el
 * único valor de `CategoriaReventa` hoy — ver `boletas.api.ts`, que lo
 * completa al armar el payload). Solo se muestra para clientes `esRevendedor`
 * (ver `BoletaForm`).
 *
 * `clientesFinales` es el catálogo de destinos propios del cliente
 * seleccionado (ej. los locales a los que "Ivan" le reparte) — se elige UNA
 * vez en el generador rápido (como presentación/categoría en `TropaCard`), no
 * por línea, porque en la práctica un lote entero va al mismo destino.
 */
function NovilloCard({
  control,
  field,
  clienteId,
  clientesFinales,
}: {
  control: FormControlType;
  field: ReturnType<typeof useFieldArray<FormInput, "novillo">>;
  clienteId: string;
  clientesFinales: ClienteFinal[];
}) {
  const [quickForma, setQuickForma] = useState<PresentacionNovillo>(FormaVenta.MEDIA_RES);
  const [quickDestino, setQuickDestino] = useState("");
  const [quickCantidad, setQuickCantidad] = useState("1");
  const [nuevoDestinoOpen, setNuevoDestinoOpen] = useState(false);
  const [nuevoDestinoNombre, setNuevoDestinoNombre] = useState("");
  const createClienteFinal = useCreateClienteFinal(clienteId);

  const destinosPorId = new Map(clientesFinales.map((d) => [d.id, d]));

  function agregarLote() {
    const cantidad = Math.max(1, Math.floor(Number(quickCantidad) || 1));
    field.append(
      Array.from({ length: cantidad }, () => ({
        formaVenta: quickForma,
        clienteFinalId: quickDestino,
        garron: "",
        kg: "",
      })),
    );
  }

  async function crearDestino() {
    if (!nuevoDestinoNombre.trim()) return;
    const creado = await createClienteFinal.mutateAsync(nuevoDestinoNombre.trim());
    setQuickDestino(creado.id);
    setNuevoDestinoNombre("");
    setNuevoDestinoOpen(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Novillo (reventa)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-xs">
          No sale de ninguna tropa nuestra — solo la logística de entrega.
        </p>

        <div className="bg-muted/50 flex flex-col gap-2 rounded-md p-3 sm:flex-row sm:items-end sm:flex-wrap">
          <div className="flex-1 space-y-1">
            <label className="text-muted-foreground text-xs font-medium">Presentación</label>
            <Select value={quickForma} onValueChange={(v) => setQuickForma(v as PresentacionNovillo)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[FormaVenta.CABEZA, FormaVenta.MEDIA_RES].map((v) => (
                  <SelectItem key={v} value={v}>
                    {FORMA_VENTA_LABELS[v]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-muted-foreground text-xs font-medium">Destino (a quién reparte)</label>
            <div className="flex gap-1">
              <Select value={quickDestino} onValueChange={setQuickDestino}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin destino" />
                </SelectTrigger>
                <SelectContent>
                  {clientesFinales.map((destino) => (
                    <SelectItem key={destino.id} value={destino.id}>
                      {destino.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={nuevoDestinoOpen} onOpenChange={setNuevoDestinoOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="icon" title="Nuevo destino">
                    <Plus className="size-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nuevo destino</DialogTitle>
                  </DialogHeader>
                  <Input
                    value={nuevoDestinoNombre}
                    onChange={(e) => setNuevoDestinoNombre(e.target.value)}
                    placeholder="Ej. Almacén Don Pepe"
                    autoFocus
                  />
                  <DialogFooter>
                    <Button
                      type="button"
                      onClick={crearDestino}
                      disabled={!nuevoDestinoNombre.trim() || createClienteFinal.isPending}
                    >
                      {createClienteFinal.isPending ? "Guardando..." : "Guardar destino"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="w-full space-y-1 sm:w-20">
            <label className="text-muted-foreground text-xs font-medium">Cant.</label>
            <Input
              inputMode="numeric"
              value={quickCantidad}
              onChange={(e) => setQuickCantidad(e.target.value)}
            />
          </div>
          <Button type="button" onClick={agregarLote} className="w-full sm:w-fit">
            <Plus />
            Agregar
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          {field.fields.map((item, itemIndex) => {
            const destinoNombre = item.clienteFinalId
              ? destinosPorId.get(item.clienteFinalId)?.nombre
              : undefined;
            return (
            <div key={item.id} className="flex flex-wrap items-end gap-2 rounded-md border p-2">
              <Badge variant="outline" className="h-9">
                {FORMA_VENTA_LABELS[item.formaVenta]}
                {destinoNombre ? ` · ${destinoNombre}` : ""}
              </Badge>
              <FormField
                control={control}
                name={`novillo.${itemIndex}.garron`}
                render={({ field: garronField }) => (
                  <FormItem className="w-28">
                    <FormLabel className="sr-only">Referencia (opcional)</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" placeholder="Referencia" {...garronField} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`novillo.${itemIndex}.kg`}
                render={({ field: kgField }) => (
                  <FormItem className="w-24">
                    <FormLabel className="sr-only">Peso</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        placeholder="Kg"
                        {...kgField}
                        value={kgField.value as string | number}
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
                onClick={() => field.remove(itemIndex)}
                title="Quitar línea"
              >
                <Trash2 className="text-destructive size-4" />
              </Button>
            </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
