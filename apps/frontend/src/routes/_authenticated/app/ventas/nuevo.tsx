import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { NuevaVentaForm } from "@/modules/ventas/components/nueva-venta-form";
import { useCreateVenta } from "@/modules/ventas/hooks/use-create-venta";
import { useDeleteVenta } from "@/modules/ventas/hooks/use-delete-venta";
import type { CreateVentaInput } from "@/modules/ventas/api/ventas.api";
import type { Venta } from "@/modules/ventas/domain/venta.types";
import { FORMA_VENTA_LABELS } from "@/modules/ventas/domain/venta.types";
import { categoriaCorta } from "@/modules/ventas/domain/categoria-venta";
import { useClientes } from "@/modules/clientes/hooks/use-clientes";
import { nombreCliente } from "@/modules/clientes/domain/cliente.types";
import { useCompras } from "@/modules/compras/hooks/use-compras";
import { compraNumeroYLetra } from "@/modules/compras/domain/compra.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/shared/api/api-response";

export const Route = createFileRoute("/_authenticated/app/ventas/nuevo")({
  component: NuevaVentaPage,
});

/**
 * Carga manual de ventas, una por una — sin pasar por el importador de Excel
 * ni el flujo de boletas (ver `nueva-venta-form.tsx`). Pensada para probar
 * rápido un caso puntual (ej. confirmar que el rinde de un grupo de tropas
 * da lo mismo que en el Excel) y, a futuro, como base de la pantalla de
 * reparto diario.
 *
 * La lista de "cargadas en esta sesión" es solo un historial local (no una
 * consulta al backend): permite ver de un vistazo lo que se fue cargando y
 * deshacerlo con "Quitar" sin tener que ir a buscarlo en otro lado.
 */
function NuevaVentaPage() {
  const createVenta = useCreateVenta();
  const deleteVenta = useDeleteVenta();
  const clientesQuery = useClientes();
  const comprasQuery = useCompras();

  const [cargadas, setCargadas] = useState<Venta[]>([]);

  const nombrePorClienteId = new Map((clientesQuery.data ?? []).map((c) => [c.id, nombreCliente(c)]));
  const compraPorId = new Map((comprasQuery.data ?? []).map((c) => [c.id, c]));

  async function handleSubmit(input: CreateVentaInput) {
    try {
      const venta = await createVenta.mutateAsync(input);
      setCargadas((prev) => [venta, ...prev]);
      toast.success("Venta cargada correctamente");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo cargar la venta";
      toast.error(message);
    }
  }

  function handleQuitar(id: string) {
    deleteVenta.mutate(id, {
      onSuccess: () => {
        setCargadas((prev) => prev.filter((v) => v.id !== id));
        toast.success("Venta eliminada");
      },
      onError: (err) => toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar la venta"),
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link to="/app/ventas">
            <ArrowLeft className="size-4" />
            Ventas
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Cargar venta manual</h1>
        <p className="text-muted-foreground text-sm">
          Cargá una venta directo, sin pasar por el importador ni una boleta — útil para probar un
          caso puntual. Después de guardar, el formulario deja cliente y tropa cargados para seguir
          agregando animales de la misma venta.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de la venta</CardTitle>
        </CardHeader>
        <CardContent>
          <NuevaVentaForm onSubmit={handleSubmit} isSubmitting={createVenta.isPending} />
        </CardContent>
      </Card>

      {cargadas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cargadas en esta sesión ({cargadas.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {cargadas.map((venta) => {
              const compra = venta.compraId ? compraPorId.get(venta.compraId) : undefined;
              return (
                <div
                  key={venta.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm"
                >
                  <div>
                    <span className="font-medium">{nombrePorClienteId.get(venta.clienteId) ?? "—"}</span>
                    {" · "}
                    {FORMA_VENTA_LABELS[venta.formaVenta]}
                    {venta.categoria ? ` ${categoriaCorta(venta.categoria)}` : ""}
                    {venta.garron ? ` · Garrón ${venta.garron}` : ""}
                    {compra ? ` · Tropa ${compraNumeroYLetra(compra)}` : ""}
                    {" · "}
                    {venta.kg} kg
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuitar(venta.id)}
                    disabled={deleteVenta.isPending}
                    title="Quitar"
                  >
                    <Trash2 className="text-destructive size-4" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
