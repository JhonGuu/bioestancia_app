import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useAuth } from "@/modules/auth/context/auth-context";
import { useChangePassword } from "@/modules/auth/hooks/use-change-password";
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from "@/modules/auth/domain/auth.schemas";
import { ApiError } from "@/shared/api/api-response";
import { ThemeToggle } from "@/shared/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

/**
 * Pantalla de bloqueo total: se muestra en vez de cualquier otra ruta cuando
 * `user.mustChangePassword` está en `true` (usuario nuevo creado por un admin
 * con contraseña temporal — ver `POST /account/users`). No hay forma de
 * saltearla ni de llegar al selector de empresa o al resto de la app hasta
 * completarla (ver `_authenticated.tsx`).
 */
export function ForcedChangePasswordScreen() {
  const { logout } = useAuth();
  const changePassword = useChangePassword();

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
  });

  async function onSubmit(values: ChangePasswordFormValues) {
    try {
      await changePassword.mutateAsync(values);
      toast.success("Contraseña actualizada. Ya podés continuar.");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "No se pudo cambiar la contraseña";
      toast.error(message);
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <ThemeToggle className="absolute top-4 right-4" />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-xl">Cambiá tu contraseña</CardTitle>
          <CardDescription className="text-center">
            Tu cuenta se creó con una contraseña temporal. Elegí una nueva antes de continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña temporal</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <Button type="submit" className="mt-2 w-full" disabled={changePassword.isPending}>
                {changePassword.isPending ? "Guardando..." : "Cambiar contraseña"}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={logout}>
                Cerrar sesión
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
