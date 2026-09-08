import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Permisos } from "@/modules/auth/domain/auth.types";
import { useTienePermiso } from "@/modules/auth/hooks/use-tiene-permiso";
import { SinPermiso } from "@/shared/components/sin-permiso";
import { useCentrosCosto } from "@/modules/contabilidad/hooks/use-centros-costo";
import { CentroCostoFormDialog } from "@/modules/contabilidad/components/centro-costo-form-dialog";
import { EliminarCentroCostoDialog } from "@/modules/contabilidad/components/eliminar-centro-costo-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/app/contabilidad/centros-costo/")({
  component: CentrosCostoPage,
});

function CentrosCostoPage() {
  const tieneAcceso = useTienePermiso(Permisos.VER_CONTABILIDAD);
  const puedeEditar = useTienePermiso(Permisos.ADMINISTRAR_PLAN_CUENTAS);
  const centrosQuery = useCentrosCosto();

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
            <h1 className="text-2xl font-semibold">Centros de costo</h1>
            <p className="text-muted-foreground text-sm">
              Imputá una misma cuenta por tropa, reparto u otra parte del negocio, sin duplicarla.
            </p>
          </div>
          {puedeEditar && <CentroCostoFormDialog />}
        </div>
      </div>

      <Card>
        <CardContent>
          {centrosQuery.isPending ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando centros de costo...
            </div>
          ) : centrosQuery.isError ? (
            <p className="text-destructive py-8 text-center text-sm">{centrosQuery.error.message}</p>
          ) : centrosQuery.data.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Todavía no hay centros de costo cargados.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Estado</TableHead>
                  {puedeEditar && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {centrosQuery.data.map((centro) => (
                  <TableRow key={centro.id}>
                    <TableCell className="font-mono text-xs">{centro.codigo}</TableCell>
                    <TableCell>{centro.nombre}</TableCell>
                    <TableCell>
                      <Badge variant={centro.activo ? "default" : "secondary"}>
                        {centro.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    {puedeEditar && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <CentroCostoFormDialog centro={centro} />
                          <EliminarCentroCostoDialog centro={centro} />
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
