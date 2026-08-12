import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import {
  createClienteSchema,
  type CreateClienteFormValues,
} from "@/modules/clientes/domain/cliente.schemas";
import {
  CONDICION_FISCAL_LABELS,
  CondicionFiscal,
  DIAS_PLAZO_PAGO_DEFAULT,
  type Cliente,
} from "@/modules/clientes/domain/cliente.types";

type TipoPersona = "fisica" | "juridica";

interface ClienteFormProps {
  onSubmit: (values: CreateClienteFormValues) => Promise<void>;
  isSubmitting?: boolean;
  /** Si viene, el form arranca precargado con sus datos (edición) en vez de vacío (alta). */
  cliente?: Cliente;
}

/**
 * Se usa tanto para alta como para edición: en edición, `cliente` precarga
 * todos los campos y el tipo de persona inicial se infiere de si tiene
 * `razonSocial` cargada (jurídica) o no (física) — el mismo criterio que usa
 * `nombreCliente()`.
 */
export function ClienteForm({ onSubmit, isSubmitting, cliente }: ClienteFormProps) {
  const [tipoPersona, setTipoPersona] = React.useState<TipoPersona>(
    cliente?.razonSocial ? "juridica" : "fisica",
  );

  const form = useForm<CreateClienteFormValues>({
    resolver: zodResolver(createClienteSchema),
    defaultValues: {
      nombre: cliente?.nombre ?? "",
      apellido: cliente?.apellido ?? "",
      razonSocial: cliente?.razonSocial ?? "",
      cuit: cliente?.cuit ?? "",
      dni: cliente?.dni ?? "",
      domicilio: cliente?.domicilio ?? "",
      email: cliente?.email ?? "",
      pais: cliente?.pais ?? "",
      provincia: cliente?.provincia ?? "",
      ubicacion: cliente?.ubicacion ?? "",
      condicionFiscal: cliente?.condicionFiscal ?? CondicionFiscal.CONSUMIDOR_FINAL,
      esRevendedor: cliente?.esRevendedor ?? false,
      diasPlazoPago:
        cliente?.diasPlazoPago !== undefined && cliente?.diasPlazoPago !== null
          ? String(cliente.diasPlazoPago)
          : "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
        <div className="flex gap-2">
          <TipoPersonaButton
            label="Persona física"
            active={tipoPersona === "fisica"}
            onClick={() => setTipoPersona("fisica")}
          />
          <TipoPersonaButton
            label="Persona jurídica"
            active={tipoPersona === "juridica"}
            onClick={() => setTipoPersona("juridica")}
          />
        </div>

        {tipoPersona === "fisica" ? (
          <div className="grid grid-cols-2 gap-4">
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
            <FormField
              control={form.control}
              name="apellido"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dni"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DNI</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="razonSocial"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Razón social</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cuit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CUIT</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="condicionFiscal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condición fiscal</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(CondicionFiscal).map((value) => (
                      <SelectItem key={value} value={value}>
                        {CONDICION_FISCAL_LABELS[value]}
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="pais"
            render={({ field }) => (
              <FormItem>
                <FormLabel>País</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="provincia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provincia</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ubicacion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ubicación</FormLabel>
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
          name="diasPlazoPago"
          render={({ field }) => (
            <FormItem className="max-w-xs">
              <FormLabel>Días de plazo para pagar</FormLabel>
              <FormControl>
                <Input type="number" placeholder={`Default: ${DIAS_PLAZO_PAGO_DEFAULT}`} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="domicilio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Domicilio</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="esRevendedor"
          render={({ field }) => (
            <FormItem>
              <label className="flex w-fit cursor-pointer items-start gap-2">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="accent-primary mt-1 size-4"
                  />
                </FormControl>
                <span>
                  <span className="text-sm font-medium">Es revendedor</span>
                  <span className="text-muted-foreground block text-xs">
                    Reparte a sus propios clientes (ej. Ivan) — habilita la reventa de Novillo y un
                    catálogo de sus destinos al cargar boletas.
                  </span>
                </span>
              </label>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? "Guardando..." : cliente ? "Guardar cambios" : "Guardar cliente"}
        </Button>
      </form>
    </Form>
  );
}

function TipoPersonaButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent",
      )}
    >
      {label}
    </button>
  );
}
