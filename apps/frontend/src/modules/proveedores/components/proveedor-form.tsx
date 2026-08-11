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
  createProveedorSchema,
  type CreateProveedorFormValues,
} from "@/modules/proveedores/domain/proveedor.schemas";
import {
  CONDICION_FISCAL_LABELS,
  CondicionFiscal,
} from "@/modules/clientes/domain/cliente.types";
import { CodigoAfipPorcino, type Proveedor } from "@/modules/proveedores/domain/proveedor.types";

type TipoPersona = "fisica" | "juridica";

interface ProveedorFormProps {
  onSubmit: (values: CreateProveedorFormValues) => Promise<void>;
  isSubmitting?: boolean;
  /** Si viene, el form arranca precargado con sus datos (edición) en vez de vacío (alta). */
  proveedor?: Proveedor;
}

/**
 * Se usa tanto para alta como para edición: en edición, `proveedor` precarga
 * todos los campos y el tipo de persona inicial se infiere de si tiene
 * `razonSocial` cargada (jurídica) o no (física) — mismo criterio que `ClienteForm`.
 */
export function ProveedorForm({ onSubmit, isSubmitting, proveedor }: ProveedorFormProps) {
  const [tipoPersona, setTipoPersona] = React.useState<TipoPersona>(
    proveedor?.razonSocial ? "juridica" : "fisica",
  );

  const form = useForm<CreateProveedorFormValues>({
    resolver: zodResolver(createProveedorSchema),
    defaultValues: {
      nombre: proveedor?.nombre ?? "",
      apellido: proveedor?.apellido ?? "",
      razonSocial: proveedor?.razonSocial ?? "",
      cuit: proveedor?.cuit ?? "",
      dni: proveedor?.dni ?? "",
      domicilio: proveedor?.domicilio ?? "",
      email: proveedor?.email ?? "",
      pais: proveedor?.pais ?? "",
      provincia: proveedor?.provincia ?? "",
      ubicacion: proveedor?.ubicacion ?? "",
      condicionFiscal: proveedor?.condicionFiscal ?? CondicionFiscal.CONSUMIDOR_FINAL,
      datosBancarios: proveedor?.datosBancarios ?? "",
      porcentajeDesbaste:
        proveedor?.porcentajeDesbaste !== undefined && proveedor?.porcentajeDesbaste !== null
          ? String(proveedor.porcentajeDesbaste)
          : "",
      renspa: proveedor?.renspa ?? "",
      codigoAfip: proveedor?.codigoAfip ?? CodigoAfipPorcino.PRODUCTORES_CRIADORES_COMERCIALES,
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="datosBancarios"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CBU / CVU</FormLabel>
                <FormControl>
                  <Input placeholder="22 dígitos" maxLength={22} {...field} />
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
                <FormLabel>% desbaste por defecto</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Ej. 3.5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="renspa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>RENSPA</FormLabel>
                <FormControl>
                  <Input placeholder="11.016.0.00312/00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="codigoAfip"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código AFIP (liquidación de compra)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(CodigoAfipPorcino).map((value) => (
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

        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? "Guardando..." : proveedor ? "Guardar cambios" : "Guardar proveedor"}
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
