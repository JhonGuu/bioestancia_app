import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, Loader2, Plus } from "lucide-react";

import { useGruposTropas } from "@/modules/grupos-tropas/hooks/use-grupos-tropas";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/app/compras/grupos-tropas/")({
  component: GruposTropasPage,
});

/**
 * Listado de grupos de tropas — ver `plan-unificacion-tropas-despacho.md`.
 * Cada grupo unifica 2+ tropas para calcular un único rinde de despacho.
 */
function GruposTropasPage() {
  const gruposQuery = useGruposTropas();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Button variant="ghost" size="sm" className="-ml-2" asChild>
            <Link to="/app/compras/tropas">
              <ArrowLeft className="size-4" />
              Tropas
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Grupos de tropas</h1>
          <p className="text-muted-foreground text-sm">
            Tropas unificadas para calcular un único rinde de despacho — ver el detalle de cada
            grupo para las tropas que lo componen.
          </p>
        </div>
        <Button asChild>
          <Link to="/app/compras/grupos-tropas/nuevo">
            <Plus />
            Nuevo grupo
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent>
          {gruposQuery.isPending ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando grupos...
            </div>
          ) : gruposQuery.error ? (
            <p className="text-destructive py-8 text-center text-sm">{gruposQuery.error.message}</p>
          ) : gruposQuery.data && gruposQuery.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Peso neto total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Rinde</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gruposQuery.data.map((grupo) => (
                  <TableRow key={grupo.id}>
                    <TableCell className="font-medium">
                      <Link
                        to="/app/compras/grupos-tropas/$grupoId"
                        params={{ grupoId: grupo.id }}
                        className="hover:underline"
                      >
                        {grupo.nombre ?? `Grupo ${grupo.id.slice(0, 8)}`}
                      </Link>
                    </TableCell>
                    <TableCell>{grupo.pesoNetoTotal.toFixed(2)} kg</TableCell>
                    <TableCell>
                      <Badge variant={grupo.cerrado ? "default" : "secondary"}>
                        {grupo.cerrado ? "Cerrado" : "Abierto"}
                      </Badge>
                    </TableCell>
                    <TableCell>{grupo.rinde !== null ? `${grupo.rinde}%` : "—"}</TableCell>
                    <TableCell>
                      {grupo.alertaSuperavit && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="size-3" />
                          Superávit
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Todavía no hay grupos de tropas armados.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
