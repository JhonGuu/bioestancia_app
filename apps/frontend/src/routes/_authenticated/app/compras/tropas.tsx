import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Layers, Loader2, Plus, Upload } from "lucide-react";

import { useAuth } from "@/modules/auth/context/auth-context";
import { Roles } from "@/modules/auth/domain/auth.types";
import { useCompras } from "@/modules/compras/hooks/use-compras";
import { useProveedores } from "@/modules/proveedores/hooks/use-proveedores";
import { ComprasTable } from "@/modules/compras/components/compras-table";
import { GrupoComprasCard } from "@/modules/compras/components/grupo-compras-card";
import {
  agruparCompras,
  CriterioAgrupacion,
  CRITERIO_AGRUPACION_LABELS,
} from "@/modules/compras/domain/agrupar-compras";
import { nombreProveedor } from "@/modules/proveedores/domain/proveedor.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaginacionBar } from "@/shared/components/paginacion-bar";
import { PAGE_SIZES } from "@/shared/api/pagination.types";

export const Route = createFileRoute("/_authenticated/app/compras/tropas")({
  component: TropasPage,
});

const TODOS_LOS_PROVEEDORES = "__todos__";

function TropasPage() {
  const { empresaActiva } = useAuth();
  const comprasQuery = useCompras();
  const proveedoresQuery = useProveedores();

  const [proveedorId, setProveedorId] = useState(TODOS_LOS_PROVEEDORES);
  const [criterio, setCriterio] = useState<CriterioAgrupacion>(CriterioAgrupacion.NINGUNO);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(PAGE_SIZES[1]); // 50 por defecto

  const puedeEditar =
    empresaActiva?.rol === Roles.ADMIN || empresaActiva?.rol === Roles.CONTABLE;

  const cargando = comprasQuery.isPending || proveedoresQuery.isPending;
  const error = comprasQuery.error ?? proveedoresQuery.error;

  const compras = comprasQuery.data ?? [];
  const proveedores = proveedoresQuery.data ?? [];

  const comprasFiltradas =
    proveedorId === TODOS_LOS_PROVEEDORES ? compras : compras.filter((c) => c.proveedorId === proveedorId);

  // Volver a la página 1 cada vez que cambia el filtro o el tamaño de página
  // — si no, se podría quedar en una página que ya no existe para el nuevo
  // resultado (ej. filtrás por un proveedor con pocas tropas estando en la
  // página 5).
  useEffect(() => {
    setPage(1);
  }, [proveedorId, criterio, limit]);

  // Agrupar (por fecha o proveedor) es una vista de PANORAMA: se arma sobre
  // todas las tropas que pasan el filtro, sin paginar — paginar tendría que
  // ser "página de grupos" o "página de filas salteando headers", y ninguna
  // de las dos es lo que alguien espera al pedir "agrupar por mes". Sin
  // agrupar, sí es una lista plana normal y ahí aplica la paginación.
  const sinAgrupar = criterio === CriterioAgrupacion.NINGUNO;
  const comprasPaginaActual = sinAgrupar
    ? comprasFiltradas.slice((page - 1) * limit, page * limit)
    : comprasFiltradas;
  const grupos = agruparCompras(comprasPaginaActual, criterio, proveedores);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Button variant="ghost" size="sm" className="-ml-2" asChild>
            <Link to="/app/compras">
              <ArrowLeft className="size-4" />
              Compras
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Tropas</h1>
          <p className="text-muted-foreground text-sm">
            Tropas compradas a proveedores de la empresa activa.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/app/compras/grupos-tropas">
              <Layers />
              <span className="hidden sm:inline">Grupos de tropas</span>
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/app/compras/importar">
              <Upload />
              <span className="hidden sm:inline">Importar Excel</span>
            </Link>
          </Button>
          <Button asChild>
            <Link to="/app/compras/nuevo">
              <Plus />
              Nueva compra
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-muted-foreground text-xs font-medium">Agrupar por</label>
          <Select value={criterio} onValueChange={(v) => setCriterio(v as CriterioAgrupacion)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(CriterioAgrupacion).map((c) => (
                <SelectItem key={c} value={c}>
                  {CRITERIO_AGRUPACION_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-muted-foreground text-xs font-medium">Proveedor</label>
          <Select value={proveedorId} onValueChange={setProveedorId}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS_LOS_PROVEEDORES}>Todos los proveedores</SelectItem>
              {proveedores.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {nombreProveedor(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {cargando ? (
        <Card>
          <CardContent>
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando compras...
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent>
            <p className="text-destructive py-8 text-center text-sm">{error.message}</p>
          </CardContent>
        </Card>
      ) : sinAgrupar ? (
        <div className="space-y-3">
          <Card>
            <CardContent>
              <ComprasTable compras={comprasPaginaActual} proveedores={proveedores} puedeEditar={puedeEditar} />
            </CardContent>
          </Card>
          <PaginacionBar
            page={page}
            limit={limit}
            total={comprasFiltradas.length}
            onPageChange={setPage}
            onLimitChange={setLimit}
            etiqueta="tropas"
          />
        </div>
      ) : grupos.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-muted-foreground py-8 text-center text-sm">
              Todavía no hay compras cargadas para esta empresa.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {grupos.map((grupo) => (
            <GrupoComprasCard key={grupo.clave} grupo={grupo} proveedores={proveedores} puedeEditar={puedeEditar} />
          ))}
        </div>
      )}
    </div>
  );
}
