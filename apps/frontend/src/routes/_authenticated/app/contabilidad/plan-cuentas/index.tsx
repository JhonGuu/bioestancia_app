import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Upload } from "lucide-react";

import { Permisos } from "@/modules/auth/domain/auth.types";
import { useTienePermiso } from "@/modules/auth/hooks/use-tiene-permiso";
import { SinPermiso } from "@/shared/components/sin-permiso";
import { usePlanCuentas } from "@/modules/contabilidad/hooks/use-plan-cuentas";
import { PlanCuentasTree } from "@/modules/contabilidad/components/plan-cuentas-tree";
import { CuentaFormDialog } from "@/modules/contabilidad/components/cuenta-form-dialog";
import { SembrarPlanCuentasButton } from "@/modules/contabilidad/components/sembrar-plan-cuentas-button";
import { aplanarArbol } from "@/modules/contabilidad/domain/cuenta.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/contabilidad/plan-cuentas/")({
  component: PlanCuentasPage,
});

function PlanCuentasPage() {
  const tieneAcceso = useTienePermiso(Permisos.VER_CONTABILIDAD);
  const puedeEditar = useTienePermiso(Permisos.ADMINISTRAR_PLAN_CUENTAS);
  const planCuentasQuery = usePlanCuentas();

  if (!tieneAcceso) return <SinPermiso />;

  return (
    <div className="space-y-4">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link to="/app/contabilidad">
            <ArrowLeft className="size-4" />
            Contabilidad
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold">Plan de cuentas</h1>
            <p className="text-muted-foreground text-sm">
              Jerarquía completa, editable — el catálogo base es solo un punto de partida.
            </p>
          </div>
          {puedeEditar && planCuentasQuery.data && (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/app/contabilidad/plan-cuentas/importar">
                  <Upload className="size-4" />
                  Importar Excel
                </Link>
              </Button>
              <SembrarPlanCuentasButton hayAlgunaCuenta={planCuentasQuery.data.cuentas.length > 0} />
              <CuentaFormDialog cuentasPlanas={aplanarArbol(planCuentasQuery.data.arbol)} />
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardContent>
          {planCuentasQuery.isPending ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando plan de cuentas...
            </div>
          ) : planCuentasQuery.isError ? (
            <p className="text-destructive py-8 text-center text-sm">{planCuentasQuery.error.message}</p>
          ) : (
            <PlanCuentasTree arbol={planCuentasQuery.data.arbol} puedeEditar={puedeEditar} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
