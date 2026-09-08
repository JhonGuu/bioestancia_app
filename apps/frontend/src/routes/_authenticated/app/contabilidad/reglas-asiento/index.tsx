import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Permisos } from "@/modules/auth/domain/auth.types";
import { useTienePermiso } from "@/modules/auth/hooks/use-tiene-permiso";
import { SinPermiso } from "@/shared/components/sin-permiso";
import { useReglasAsiento } from "@/modules/contabilidad/hooks/use-reglas-asiento";
import { ReglaAsientoFormDialog } from "@/modules/contabilidad/components/regla-asiento-form-dialog";
import { EliminarReglaAsientoDialog } from "@/modules/contabilidad/components/eliminar-regla-asiento-dialog";
import { EVENTOS_ASIENTO_LABELS } from "@/modules/contabilidad/domain/regla-asiento.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/app/contabilidad/reglas-asiento/")({
  component: ReglasAsientoPage,
});

function ReglasAsientoPage() {
  const tieneAcceso = useTienePermiso(Permisos.VER_CONTABILIDAD);
  const puedeEditar = useTienePermiso(Permisos.ADMINISTRAR_REGLAS_ASIENTO);
  const reglasQuery = useReglasAsiento();

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
            <h1 className="text-2xl font-semibold">Reglas de asiento</h1>
            <p className="text-muted-foreground text-sm">
              Cuando pasa un evento de negocio (una boleta se factura, se registra un cobro, se deposita un
              cheque...) la regla activa que matchea genera un asiento en borrador — queda para revisar y
              confirmar, nunca se confirma solo.
            </p>
          </div>
          {puedeEditar && <ReglaAsientoFormDialog />}
        </div>
      </div>

      <Card>
        <CardContent>
          {reglasQuery.isPending ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando reglas de asiento...
            </div>
          ) : reglasQuery.isError ? (
            <p className="text-destructive py-8 text-center text-sm">{reglasQuery.error.message}</p>
          ) : reglasQuery.data.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Todavía no hay reglas de asiento configuradas — sin reglas, ningún evento genera asientos
              automáticos.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Condición</TableHead>
                  <TableHead className="text-right">Prioridad</TableHead>
                  <TableHead className="text-right">Líneas</TableHead>
                  <TableHead>Estado</TableHead>
                  {puedeEditar && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {reglasQuery.data.map((regla) => (
                  <TableRow key={regla.id}>
                    <TableCell>{EVENTOS_ASIENTO_LABELS[regla.evento]}</TableCell>
                    <TableCell>{regla.nombre}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {regla.condicion
                        ? Object.entries(regla.condicion)
                            .map(([k, v]) => `${k}=${v}`)
                            .join(", ")
                        : "— Siempre —"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">{regla.prioridad}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{regla.lineas.length}</TableCell>
                    <TableCell>
                      <Badge variant={regla.activa ? "default" : "secondary"}>
                        {regla.activa ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    {puedeEditar && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <ReglaAsientoFormDialog regla={regla} />
                          <EliminarReglaAsientoDialog regla={regla} />
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
