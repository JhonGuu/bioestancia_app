import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";

import { useTienePermiso } from "@/modules/auth/hooks/use-tiene-permiso";
import { Permisos } from "@/modules/auth/domain/auth.types";
import { SinPermiso } from "@/shared/components/sin-permiso";
import { useRentabilidadTropas } from "@/modules/informes-compras/hooks/use-rentabilidad-tropas";
import { RentabilidadChart } from "@/modules/informes-compras/components/rentabilidad-chart";
import { PrecioEvolucionChart } from "@/modules/informes-compras/components/precio-evolucion-chart";
import { useCompras } from "@/modules/compras/hooks/use-compras";
import { useProveedores } from "@/modules/proveedores/hooks/use-proveedores";
import { nombreProveedor } from "@/modules/proveedores/domain/proveedor.types";
import { compraNumeroYLetra } from "@/modules/compras/domain/compra.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/compras/informes")({
  component: InformesComprasPage,
});

const moneda = (v: number) => `$${v.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;

/**
 * Rentabilidad por tropa: costo (liquidación de compra al proveedor +
 * liquidación de faena al frigorífico) vs. ingreso de venta de la carne —
 * el cálculo que antes se armaba a mano en el Excel de compras.
 *
 * Solo entran al gráfico y a los KPIs las tropas con `costoTotal` cargado
 * (liquidación de compra y/o de faena ya cargadas) — las demás igual
 * aparecen en la tabla, con "—" donde falte el dato, para que se vea qué
 * falta cargar.
 */
function InformesComprasPage() {
  const rentabilidadQuery = useRentabilidadTropas();
  const proveedoresQuery = useProveedores();
  const comprasQuery = useCompras();
  const tieneAcceso = useTienePermiso(Permisos.VER_RENTABILIDAD_COMPRAS);

  if (!tieneAcceso) {
    return <SinPermiso />;
  }

  if (rentabilidadQuery.isPending) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando informe...
      </div>
    );
  }

  if (rentabilidadQuery.isError) {
    return <p className="text-destructive py-8 text-center text-sm">{rentabilidadQuery.error.message}</p>;
  }

  const tropas = rentabilidadQuery.data;
  const proveedoresPorId = new Map((proveedoresQuery.data ?? []).map((p) => [p.id, p]));

  const conDatos = tropas.filter((t) => t.costoTotal !== null);
  const costoTotal = conDatos.reduce((acc, t) => acc + (t.costoTotal ?? 0), 0);
  const ingresoTotal = conDatos.reduce((acc, t) => acc + t.ingresoVenta, 0);
  const gananciaTotal = Math.round((ingresoTotal - costoTotal) * 100) / 100;
  const rentabilidadPromedio = costoTotal > 0 ? Math.round((gananciaTotal / costoTotal) * 100 * 100) / 100 : null;

  // Serie temporal para el gráfico: ascendente por fecha, últimas 30 con datos completos.
  const paraGrafico = [...conDatos].reverse().slice(-30);

  // `useCompras()` no garantiza orden (el backend no ordena la lista) —
  // se ordena acá por fecha ascendente, solo tropas con precio cargado,
  // últimas 30 para el gráfico de evolución.
  const paraGraficoPrecio = (comprasQuery.data ?? [])
    .filter((c) => c.precioCompraKg !== null)
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    .slice(-30);

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/app/compras">
          <ArrowLeft />
          Compras
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Informes de compras</h1>
        <p className="text-muted-foreground text-sm">
          Rentabilidad por tropa — costo (proveedor + frigorífico) vs. ingreso de venta.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Tropas con datos completos" valor={`${conDatos.length} / ${tropas.length}`} />
        <KpiCard label="Costo total" valor={moneda(costoTotal)} />
        <KpiCard label="Ingreso total" valor={moneda(ingresoTotal)} />
        <KpiCard
          label="Ganancia total"
          valor={moneda(gananciaTotal)}
          destacado={gananciaTotal >= 0 ? "positivo" : "negativo"}
          sufijo={rentabilidadPromedio !== null ? `${rentabilidadPromedio}% de rentabilidad` : undefined}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Costo vs. ingreso por tropa</CardTitle>
          <CardDescription>
            {paraGrafico.length > 0
              ? "Últimas tropas con costo y venta cargados (orden cronológico)."
              : "Todavía no hay ninguna tropa con costo y venta cargados."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paraGrafico.length > 0 ? (
            <RentabilidadChart tropas={paraGrafico} />
          ) : (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Cargá la liquidación de compra y/o de faena de alguna tropa para ver el gráfico.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolución de precios por proveedor ($/kg en pie)</CardTitle>
          <CardDescription>
            {paraGraficoPrecio.length > 0
              ? "Últimas tropas con $/kg cargado, una línea por proveedor (orden cronológico)."
              : "Todavía no hay ninguna tropa con $/kg en pie cargado."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paraGraficoPrecio.length > 0 ? (
            <PrecioEvolucionChart compras={paraGraficoPrecio} proveedoresPorId={proveedoresPorId} />
          ) : (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Cargá el $/kg en pie al crear o editar una compra para ver el gráfico.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalle por tropa</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tropa</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead className="text-right">Costo compra</TableHead>
                <TableHead className="text-right">Costo faena</TableHead>
                <TableHead className="text-right">Ingreso venta</TableHead>
                <TableHead className="text-right">Ganancia</TableHead>
                <TableHead className="text-right">Rentabilidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tropas.map((t) => {
                const proveedor = proveedoresPorId.get(t.proveedorId);
                return (
                  <TableRow key={t.compraId}>
                    <TableCell className="font-medium whitespace-nowrap">
                      <Link
                        to="/app/compras/$compraId"
                        params={{ compraId: t.compraId }}
                        className="hover:underline"
                      >
                        {compraNumeroYLetra(t)}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(t.fecha).toLocaleDateString("es-AR", { timeZone: "UTC" })}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {proveedor ? nombreProveedor(proveedor) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {t.costoCompra !== null ? moneda(t.costoCompra) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {t.costoFaena !== null ? moneda(t.costoFaena) : "—"}
                    </TableCell>
                    <TableCell className="text-right">{moneda(t.ingresoVenta)}</TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium",
                        t.ganancia !== null && (t.ganancia >= 0 ? "text-primary" : "text-destructive"),
                      )}
                    >
                      {t.ganancia !== null ? moneda(t.ganancia) : "—"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right",
                        t.rentabilidadPorcentaje !== null &&
                          (t.rentabilidadPorcentaje >= 0 ? "text-primary" : "text-destructive"),
                      )}
                    >
                      {t.rentabilidadPorcentaje !== null ? `${t.rentabilidadPorcentaje}%` : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  label,
  valor,
  destacado,
  sufijo,
}: {
  label: string;
  valor: string;
  destacado?: "positivo" | "negativo";
  sufijo?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle
          className={cn(
            "text-2xl",
            destacado === "positivo" && "text-primary",
            destacado === "negativo" && "text-destructive",
          )}
        >
          {valor}
        </CardTitle>
        {sufijo && <CardDescription>{sufijo}</CardDescription>}
      </CardHeader>
    </Card>
  );
}
