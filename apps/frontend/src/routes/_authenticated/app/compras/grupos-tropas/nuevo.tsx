import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useCompras } from "@/modules/compras/hooks/use-compras";
import { useProveedores } from "@/modules/proveedores/hooks/use-proveedores";
import { useCrearGrupoTropas } from "@/modules/grupos-tropas/hooks/use-crear-grupo-tropas";
import { compraNumeroYLetra } from "@/modules/compras/domain/compra.types";
import { nombreProveedor } from "@/modules/proveedores/domain/proveedor.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/shared/api/api-response";

export const Route = createFileRoute("/_authenticated/app/compras/grupos-tropas/nuevo")({
  component: NuevoGrupoTropasPage,
});

/**
 * Arma un grupo de tropas a partir de 2+ tropas ABIERTAS y sin grupo,
 * repartiendo el peso REAL del grupo entre ellas proporcional a sus cabezas
 * — ver `plan-unificacion-tropas-despacho.md`.
 */
function NuevoGrupoTropasPage() {
  const navigate = useNavigate();
  const comprasQuery = useCompras();
  const proveedoresQuery = useProveedores();
  const crearGrupoTropas = useCrearGrupoTropas();

  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set());
  const [pesoBrutoTotal, setPesoBrutoTotal] = useState("");
  const [nombre, setNombre] = useState("");

  const cargando = comprasQuery.isPending || proveedoresQuery.isPending;

  // Solo se pueden agrupar tropas abiertas y que todavía no pertenezcan a otro grupo.
  const disponibles = (comprasQuery.data ?? []).filter((c) => !c.cerrada && c.grupoTropasId === null);
  const nombrePorProveedorId = new Map((proveedoresQuery.data ?? []).map((p) => [p.id, nombreProveedor(p)]));

  function toggle(compraId: string, checked: boolean) {
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      if (checked) next.add(compraId);
      else next.delete(compraId);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const compraIds = [...seleccionadas];
    const peso = Number(pesoBrutoTotal);
    if (compraIds.length < 2) {
      toast.error("Seleccioná al menos 2 tropas para armar el grupo");
      return;
    }
    if (!peso || peso <= 0) {
      toast.error("Cargá el peso bruto real del grupo completo");
      return;
    }
    crearGrupoTropas.mutate(
      { compraIds, pesoBrutoTotal: peso, nombre: nombre || undefined },
      {
        onSuccess: (data) => {
          toast.success("Grupo de tropas creado correctamente");
          void navigate({ to: "/app/compras/grupos-tropas/$grupoId", params: { grupoId: data.id } });
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : "No se pudo crear el grupo");
        },
      },
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/app/compras/grupos-tropas">
          <ArrowLeft />
          Grupos de tropas
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Nuevo grupo de tropas</h1>
        <p className="text-muted-foreground text-sm">
          Elegí 2 o más tropas abiertas (típicamente, la tropa original y la que se creó por un
          animal de más al faenar) y cargá el peso bruto REAL del grupo completo — el sistema lo
          reparte proporcional a las cabezas de cada tropa.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Tropas a agrupar</CardTitle>
          </CardHeader>
          <CardContent>
            {cargando ? (
              <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Cargando tropas...
              </div>
            ) : disponibles.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No hay tropas abiertas y sin grupo disponibles para agrupar.
              </p>
            ) : (
              <div className="max-h-96 space-y-1 overflow-y-auto">
                {disponibles.map((compra) => (
                  <label
                    key={compra.id}
                    className="hover:bg-accent/50 flex items-start gap-2 rounded-md border p-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      className="accent-primary mt-0.5 size-4 shrink-0"
                      checked={seleccionadas.has(compra.id)}
                      onChange={(e) => toggle(compra.id, e.target.checked)}
                    />
                    <span className="flex flex-1 flex-wrap items-center justify-between gap-2">
                      <span>
                        <span className="font-medium">{compraNumeroYLetra(compra)}</span> ·{" "}
                        {nombrePorProveedorId.get(compra.proveedorId) ?? "—"} ·{" "}
                        {new Date(compra.fecha).toLocaleDateString("es-AR", { timeZone: "UTC" })}
                      </span>
                      <span className="text-muted-foreground font-mono text-xs">
                        {compra.pesoBruto.toFixed(2)} kg brutos
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Peso real del grupo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="pesoBrutoTotal">Peso bruto total (kg de báscula, todas las tropas juntas)</Label>
              <Input
                id="pesoBrutoTotal"
                type="number"
                step="0.01"
                min="0"
                value={pesoBrutoTotal}
                onChange={(e) => setPesoBrutoTotal(e.target.value)}
                placeholder="Ej. 15150"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nombre">Nombre del grupo (opcional)</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Tropas 100/100-B"
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={crearGrupoTropas.isPending}>
          {crearGrupoTropas.isPending ? "Creando..." : "Crear grupo"}
        </Button>
      </form>
    </div>
  );
}
