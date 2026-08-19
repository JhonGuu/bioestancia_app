import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, Plus } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Roles } from "@/modules/auth/domain/auth.types";
import { ROL_LABELS } from "@/modules/usuarios/domain/rol-labels";
import { crearUsuarioSchema, type CrearUsuarioFormValues } from "@/modules/usuarios/domain/usuario.schemas";
import { useCrearUsuario } from "@/modules/usuarios/hooks/use-crear-usuario";
import type { CrearUsuarioResult } from "@/modules/usuarios/domain/usuario.types";
import { ApiError } from "@/shared/api/api-response";

const DEFAULT_VALUES: CrearUsuarioFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  username: "",
  phoneNumber: "",
  rol: Roles.OPERARIO,
};

/**
 * Alta de usuario nuevo: crea la cuenta + le otorga acceso a la empresa
 * activa con el rol elegido, en un solo paso. La contraseña la genera el
 * sistema — se muestra UNA SOLA VEZ al terminar, para que el admin se la
 * pase al usuario. No queda guardada en ningún lado después de cerrar esto.
 */
export function CrearUsuarioDialog() {
  const [open, setOpen] = useState(false);
  const [resultado, setResultado] = useState<CrearUsuarioResult | null>(null);
  const crearUsuario = useCrearUsuario();

  const form = useForm<CrearUsuarioFormValues>({
    resolver: zodResolver(crearUsuarioSchema),
    defaultValues: DEFAULT_VALUES,
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      // Al cerrar (sea por "Listo" o por afuera) reseteamos todo — la
      // contraseña temporal no se vuelve a mostrar.
      setResultado(null);
      form.reset(DEFAULT_VALUES);
    }
  }

  async function onSubmit(values: CrearUsuarioFormValues) {
    try {
      const data = await crearUsuario.mutateAsync(values);
      setResultado(data);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo crear el usuario";
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Nuevo usuario
        </Button>
      </DialogTrigger>
      <DialogContent>
        {resultado ? (
          <ContrasenaTemporalStep resultado={resultado} onListo={() => handleOpenChange(false)} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Nuevo usuario</DialogTitle>
              <DialogDescription>
                Se crea con acceso a esta empresa y una contraseña temporal que tiene que cambiar en
                su primer login.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
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
                    name="lastName"
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
                </div>
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Usuario</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono (opcional)</FormLabel>
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
                  name="rol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(Roles).map((valor) => (
                            <SelectItem key={valor} value={valor}>
                              {ROL_LABELS[valor]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={crearUsuario.isPending}>
                    {crearUsuario.isPending ? "Creando..." : "Crear usuario"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ContrasenaTemporalStep({
  resultado,
  onListo,
}: {
  resultado: CrearUsuarioResult;
  onListo: () => void;
}) {
  const [copiado, setCopiado] = useState(false);

  async function handleCopiar() {
    await navigator.clipboard.writeText(resultado.temporaryPassword);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Usuario creado</DialogTitle>
        <DialogDescription>
          Pasale esta contraseña temporal a {resultado.user.firstName} {resultado.user.lastName} — no
          se vuelve a mostrar. Va a tener que cambiarla en su primer login.
        </DialogDescription>
      </DialogHeader>
      <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
        <code className="flex-1 font-mono text-sm">{resultado.temporaryPassword}</code>
        <Button type="button" variant="ghost" size="icon" onClick={handleCopiar} title="Copiar">
          {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </div>
      <DialogFooter>
        <Button onClick={onListo}>Listo</Button>
      </DialogFooter>
    </>
  );
}
