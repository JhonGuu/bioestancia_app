import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useAuth } from "@/modules/auth/context/auth-context";
import { useChangePassword } from "@/modules/auth/hooks/use-change-password";
import { useUpdateMyAccount } from "@/modules/auth/hooks/use-update-my-account";
import {
  changePasswordSchema,
  updateMyAccountSchema,
  type ChangePasswordFormValues,
  type UpdateMyAccountFormValues,
} from "@/modules/auth/domain/auth.schemas";
import { ApiError } from "@/shared/api/api-response";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export const Route = createFileRoute("/_authenticated/app/cuenta/")({
  component: CuentaPage,
});

function CuentaPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mi cuenta</h1>
        <p className="text-muted-foreground text-sm">
          Tus datos personales y tu contraseña de acceso.
        </p>
      </div>
      <DatosPersonalesCard />
      <CambiarContrasenaCard />
    </div>
  );
}

function DatosPersonalesCard() {
  const { user } = useAuth();
  const update = useUpdateMyAccount();

  const form = useForm<UpdateMyAccountFormValues>({
    resolver: zodResolver(updateMyAccountSchema),
    // `values` (no `defaultValues`): el formulario se rellena solo cuando
    // llega/cambia el usuario, y `reset` al guardar toma lo ya persistido.
    values: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      phoneNumber: user?.phoneNumber ?? "",
    },
  });

  async function onSubmit(values: UpdateMyAccountFormValues) {
    try {
      await update.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        phoneNumber: values.phoneNumber === "" ? null : values.phoneNumber,
      });
      toast.success("Datos actualizados");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudieron guardar los datos");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos personales</CardTitle>
        <CardDescription>
          El email y el usuario los define un administrador y no se pueden cambiar desde acá.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="cuenta-email">Email</Label>
                <Input id="cuenta-email" value={user?.email ?? ""} disabled readOnly />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cuenta-username">Usuario</Label>
                <Input id="cuenta-username" value={user?.username ?? ""} disabled readOnly />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input autoComplete="given-name" {...field} />
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
                      <Input autoComplete="family-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="Solo números"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Button type="submit" disabled={update.isPending || !form.formState.isDirty}>
                {update.isPending ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function CambiarContrasenaCard() {
  const changePassword = useChangePassword();

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
  });

  async function onSubmit(values: ChangePasswordFormValues) {
    try {
      await changePassword.mutateAsync(values);
      form.reset();
      toast.success("Contraseña actualizada");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudo cambiar la contraseña");
    }
  }

  return (
    // `id` + `scroll-mt`: el menú del usuario linkea acá con `#contrasena`.
    <Card id="contrasena" className="scroll-mt-20">
      <CardHeader>
        <CardTitle>Cambiar contraseña</CardTitle>
        <CardDescription>Mínimo 8 caracteres. Te va a pedir tu contraseña actual.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña actual</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña nueva</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmNewPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repetir contraseña nueva</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div>
              <Button type="submit" disabled={changePassword.isPending}>
                {changePassword.isPending ? "Guardando..." : "Cambiar contraseña"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
