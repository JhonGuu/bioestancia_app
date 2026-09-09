import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useGrupoTropas } from "@/modules/grupos-tropas/hooks/use-grupo-tropas";
import { useCerrarGrupoTropas } from "@/modules/grupos-tropas/hooks/use-cerrar-grupo-tropas";
import { useReabrirGrupoTropas } from "@/modules/grupos-tropas/hooks/use-reabrir-grupo-tropas";
import { useAuth } from "@/modules/auth/context/auth-context";
import { Roles } from "@/modules/auth/domain/auth.types";
import { compraNumeroYLetra } from "@/modules/compras/domain/compra.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/shared/api/api-response";

export const Route = createFileRoute("/_authenticated/app/compras/grupos-tropas/$grupoId")({
  component: GrupoTropasDetallePage,
});

function GrupoTropasDetallePage() {
  const { grupoId } = Route.useParams();
  const { empresaActiva } = useAuth();
  const grupoQuery = useGrupoTropas(grupoId);
  const cerrarGrupoTropas = useCerrarGrupoTropas();
  const reabrirGrupoTropas = useReabrirGrupoTropas();

  const puedeEditar = empresaActiva?.rol === Roles.ADMIN || empresaActiva?.rol === Roles.CONTABLE;

  function handleCerrar() {
    cerrarGrupoTropas.mutate(grupoId, {
      onSuccess: () => toast.success("Grupo cerrado correctamente"),
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "No se pudo cerrar el grupo"),
    });
  }

  function handleReabrir() {
    reabrirGrupoTropas.mutate(grupoId, {
      onSuccess: () => toast.success("Grupo reabierto correctamente"),
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "No se pudo reabrir el grupo"),
    });
  }

  if (grupoQuery.isPending) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 py-16 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando grupo...
      </div>
    );
  }

  if (grupoQuery.error || !grupoQuery.data) {
    return <p className="text-destructive py-16 text-center text-sm">{grupoQuery.error?.message ?? "Grupo no encontrado"}</p>;
  }

  const grupo = grupoQuery.data;

  return (
    <div className="max-w-3xl space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/app/compras/grupos-tropas">
          <ArrowLeft />
          Grupos de tropas
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{grupo.nombre ?? `Grupo ${grupo.id.slice(0, 8)}`}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant={grupo.cerrado ? "default" : "secondary"}>
              {grupo.cerrado ? "Cerrado" : "Abierto"}
            </Badge>
            {grupo.alertaSuperavit && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="size-3" />
                Cabezas vendidas de más — probablemente falte un DTE
              </Badge>
            )}
          </div>
        </div>
        {puedeEditar && (
          <div>
            {grupo.cerrado ? (
              <Button variant="outline" onClick={handleReabrir} disabled={reabrirGrupoTropas.isPending}>
                {reabrirGrupoTropas.isPending ? "Reabriendo..." : "Reabrir grupo"}
              </Button>
            ) : (
              <Button onClick={handleCerrar} disabled={cerrarGrupoTropas.isPending}>
                {cerrarGrupoTropas.isPending ? "Cerrando..." : "Cerrar grupo"}
              </Button>
            )}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del grupo</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Peso bruto total</p>
            <p className="font-medium">{grupo.pesoBrutoTotal.toFixed(2)} kg</p>
          </div>
          <div>
            <p className="text-muted-foreground">Peso neto total</p>
            <p className="font-medium">{grupo.pesoNetoTotal.toFixed(2)} kg</p>
          </div>
          <div>
            <p className="text-muted-foreground">Peso vendido final</p>
            <p className="font-medium">{grupo.pesoFinalVentaTotal !== null ? `${grupo.pesoFinalVentaTotal.toFixed(2)} kg` : "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Rinde de despacho</p>
            <p className="font-medium">{grupo.rinde !== null ? `${grupo.rinde}%` : "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Fecha de cierre</p>
            <p className="font-medium">
              {grupo.fechaCierre ? new Date(grupo.fechaCierre).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tropas del grupo</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Peso bruto</TableHead>
                <TableHead>Peso neto</TableHead>
                <TableHead>Peso vendido</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grupo.compras.map((compra) => (
                <TableRow key={compra.id}>
                  <TableCell className="font-medium">
                    <Link to="/app/compras/$compraId" params={{ compraId: compra.id }} className="hover:underline">
                      {compraNumeroYLetra(compra)}
                    </Link>
                  </TableCell>
                  <TableCell>{compra.pesoBruto.toFixed(2)} kg</TableCell>
                  <TableCell>{compra.pesoNeto.toFixed(2)} kg</TableCell>
                  <TableCell>{compra.pesoFinalVenta !== null ? `${compra.pesoFinalVenta.toFixed(2)} kg` : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={compra.cerrada ? "default" : "secondary"}>
                      {compra.cerrada ? "Cerrada" : "Abierta"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-muted-foreground mt-3 text-xs">
            El rinde de despacho se calcula y guarda una sola vez, acá en el grupo — cada tropa no
            tiene un rinde propio mientras esté agrupada.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
