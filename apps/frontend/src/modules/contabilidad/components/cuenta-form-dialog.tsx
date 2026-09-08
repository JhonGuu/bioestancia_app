import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus } from "lucide-react";
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
import { cuentaSchema, type CuentaFormValues } from "@/modules/contabilidad/domain/cuenta.schemas";
import type { Cuenta, CuentaNodo } from "@/modules/contabilidad/domain/cuenta.types";
import { TIPO_CUENTA_LABELS, TipoCuenta } from "@/modules/contabilidad/domain/tipo-cuenta";
import { TIPO_AUXILIAR_LABELS, TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import { useCrearCuenta } from "@/modules/contabilidad/hooks/use-crear-cuenta";
import { useActualizarCuenta } from "@/modules/contabilidad/hooks/use-actualizar-cuenta";
import { ApiError } from "@/shared/api/api-response";

interface CuentaFormDialogProps {
  /** Lista plana ya en orden jerárquico (ver `aplanarArbol`), para el selector de padre. */
  cuentasPlanas: CuentaNodo[];
  /** Si viene, el diálogo edita esta cuenta; si no, crea una nueva. */
  cuenta?: Cuenta;
  /** Sugiere este padre al crear (ej. botón "Agregar sub-cuenta" en una fila del árbol). */
  parentIdSugerido?: string;
}

/** Prefijo visual de nivel, para que el selector de padre se lea como el árbol. */
function nivelDe(nodo: CuentaNodo, porId: Map<string, CuentaNodo>): number {
  let nivel = 0;
  let actual: CuentaNodo | undefined = nodo;
  while (actual?.parentId) {
    actual = porId.get(actual.parentId);
    nivel += 1;
  }
  return nivel;
}

export function CuentaFormDialog({ cuentasPlanas, cuenta, parentIdSugerido }: CuentaFormDialogProps) {
  const [open, setOpen] = useState(false);
  const crear = useCrearCuenta();
  const actualizar = useActualizarCuenta();
  const isPending = crear.isPending || actualizar.isPending;

  const porId = new Map(cuentasPlanas.map((c) => [c.id, c]));
  // Solo cuentas de agrupación (no imputables) pueden ser padre — y una cuenta no puede ser su propio padre.
  const padresPosibles = cuentasPlanas.filter((c) => !c.imputable && c.id !== cuenta?.id);

  const form = useForm<CuentaFormValues>({
    resolver: zodResolver(cuentaSchema),
    defaultValues: {
      codigo: cuenta?.codigo ?? "",
      nombre: cuenta?.nombre ?? "",
      tipo: cuenta?.tipo ?? TipoCuenta.ACTIVO,
      parentId: cuenta?.parentId ?? parentIdSugerido ?? "",
      imputable: cuenta?.imputable ?? true,
      monetaria: cuenta?.monetaria ?? false,
      requiereAuxiliar: cuenta?.requiereAuxiliar ?? TipoAuxiliar.NINGUNO,
    },
  });

  const imputable = form.watch("imputable");
  const parentId = form.watch("parentId");

  // Sugiere el próximo código dentro del padre elegido, mientras el campo no se haya tocado a mano.
  useEffect(() => {
    if (form.formState.dirtyFields.codigo) return;
    if (!parentId) return;
    const padre = porId.get(parentId);
    if (!padre) return;
    const hijos = cuentasPlanas.filter((c) => c.parentId === parentId);
    form.setValue("codigo", `${padre.codigo}.${String(hijos.length + 1).padStart(2, "0")}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentId]);

  // Si se elige un padre, la cuenta hereda su tipo (no se puede mezclar — lo valida también el backend).
  useEffect(() => {
    if (!parentId) return;
    const padre = porId.get(parentId);
    if (padre) form.setValue("tipo", padre.tipo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentId]);

  function handleSubmit(values: CuentaFormValues) {
    const input = { ...values, parentId: values.parentId || null };
    const accion = cuenta
      ? actualizar.mutateAsync({ id: cuenta.id, input })
      : crear.mutateAsync(input);

    accion
      .then(() => {
        toast.success(cuenta ? "Cuenta actualizada correctamente" : "Cuenta creada correctamente");
        setOpen(false);
        form.reset();
      })
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo guardar la cuenta");
      });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          form.reset({
            codigo: cuenta?.codigo ?? "",
            nombre: cuenta?.nombre ?? "",
            tipo: cuenta?.tipo ?? TipoCuenta.ACTIVO,
            parentId: cuenta?.parentId ?? parentIdSugerido ?? "",
            imputable: cuenta?.imputable ?? true,
            monetaria: cuenta?.monetaria ?? false,
            requiereAuxiliar: cuenta?.requiereAuxiliar ?? TipoAuxiliar.NINGUNO,
          });
        }
      }}
    >
      <DialogTrigger asChild>
        {cuenta ? (
          <Button variant="ghost" size="icon" title="Editar cuenta">
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <Plus />
            {parentIdSugerido ? "Sub-cuenta" : "Nueva cuenta"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{cuenta ? `Editar "${cuenta.codigo} ${cuenta.nombre}"` : "Nueva cuenta"}</DialogTitle>
          <DialogDescription>
            El código define el orden y la jerarquía — se sugiere solo al elegir la cuenta padre, pero se
            puede pisar.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuenta padre</FormLabel>
                  <Select value={field.value || "__ninguna__"} onValueChange={(v) => field.onChange(v === "__ninguna__" ? "" : v)}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__ninguna__">— Ninguna (cuenta de primer nivel) —</SelectItem>
                      {padresPosibles.map((padre) => (
                        <SelectItem key={padre.id} value={padre.id}>
                          {"— ".repeat(nivelDe(padre, porId))}
                          {padre.codigo} {padre.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_2fr]">
              <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input placeholder="1.1.01.001" {...field} />
                    </FormControl>
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!!parentId}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(TipoCuenta).map((value) => (
                        <SelectItem key={value} value={value}>
                          {TIPO_CUENTA_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-wrap gap-6">
              <FormField
                control={form.control}
                name="imputable"
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="accent-primary size-4"
                    />
                    Imputable (recibe movimientos)
                  </label>
                )}
              />
              <FormField
                control={form.control}
                name="monetaria"
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="accent-primary size-4"
                    />
                    Monetaria (no se ajusta por inflación)
                  </label>
                )}
              />
            </div>

            {imputable && (
              <FormField
                control={form.control}
                name="requiereAuxiliar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auxiliar obligatorio</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(TipoAuxiliar).map((value) => (
                          <SelectItem key={value} value={value}>
                            {TIPO_AUXILIAR_LABELS[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
