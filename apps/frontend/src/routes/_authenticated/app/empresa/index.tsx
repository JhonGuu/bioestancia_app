import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/modules/auth/context/auth-context";
import { Roles } from "@/modules/auth/domain/auth.types";
import { useEmpresas } from "@/modules/empresas/hooks/use-empresas";
import { useUpdateEmpresa } from "@/modules/empresas/hooks/use-update-empresa";
import { EmpresaForm } from "@/modules/empresas/components/empresa-form";
import type { UpdateEmpresaFormValues } from "@/modules/empresas/domain/empresa.schemas";
import { ApiError } from "@/shared/api/api-response";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/empresa/")({
  component: EmpresaPage,
});

/**
 * Edita cuit/teléfono/dirección de la empresa activa — solo admin (mismo
 * criterio que `PATCH /empresas/:id` en el backend). No hay ruta para
 * verla/editarla si no sos admin: ni el nav item ni esta página se muestran.
 */
function EmpresaPage() {
  const { empresaActiva } = useAuth();
  const empresasQuery = useEmpresas();
  const empresa = empresasQuery.data?.find((e) => e.id === empresaActiva?.empresaId);
  const updateEmpresa = useUpdateEmpresa(empresa?.id ?? "");

  async function handleSubmit(values: UpdateEmpresaFormValues) {
    try {
      await updateEmpresa.mutateAsync(values);
      toast.success("Datos de la empresa actualizados correctamente");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudieron guardar los cambios";
      toast.error(message);
    }
  }

  // El nav item ya está oculto para no-admin (ver `app-shell.tsx`), pero
  // alguien podría entrar a `/app/empresa` a mano — la query queda
  // deshabilitada para ese caso (ver `useEmpresas`), así que cortamos acá
  // antes de mostrar un spinner que nunca termina.
  if (empresaActiva?.rol !== Roles.ADMIN) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Solo un administrador puede ver esta página.
      </p>
    );
  }

  if (empresasQuery.isPending) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando datos de la empresa...
      </div>
    );
  }

  if (empresasQuery.isError) {
    return <p className="text-destructive py-8 text-center text-sm">{empresasQuery.error.message}</p>;
  }

  if (!empresa) {
    return (
      <p className="text-destructive py-8 text-center text-sm">
        No se encontró la empresa activa en el listado.
      </p>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Datos de la empresa</h1>
        <p className="text-muted-foreground text-sm">
          CUIT, teléfono y dirección — aparecen en el encabezado del PDF de boleta.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contacto</CardTitle>
        </CardHeader>
        <CardContent>
          <EmpresaForm empresa={empresa} onSubmit={handleSubmit} isSubmitting={updateEmpresa.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
