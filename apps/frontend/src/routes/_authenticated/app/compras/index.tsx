import { createFileRoute, Link } from "@tanstack/react-router";
import { Banknote, Boxes, Building2, LineChart, Receipt, Scale, ShoppingCart } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useCompras } from "@/modules/compras/hooks/use-compras";
import { useStockTropas } from "@/modules/compras/hooks/use-stock-tropas";
import { useFrigorificos } from "@/modules/frigorificos/hooks/use-frigorificos";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/compras/")({
  component: ComprasDashboardPage,
});

/**
 * Dashboard de Compras: nuclea todo lo que conlleva el módulo (tropas, stock,
 * resultado de faena, liquidación) en un solo lugar, con una tarjeta por
 * sección — mismo criterio que `VentasDashboardPage`. Las secciones sin
 * vista propia todavía se muestran deshabilitadas ("Próximamente") para
 * anticipar dónde van a aparecer.
 */
function ComprasDashboardPage() {
  const comprasQuery = useCompras();
  const tropasAbiertas = (comprasQuery.data ?? []).filter((c) => c.activo && !c.cerrada).length;

  const stockQuery = useStockTropas();
  const tropasConStock = (stockQuery.data ?? []).filter((t) => t.stockRestante > 0).length;

  const frigorificosQuery = useFrigorificos();
  const cantidadFrigorificos = (frigorificosQuery.data ?? []).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Compras</h1>
        <p className="text-muted-foreground text-sm">
          Tropas compradas a proveedores: alta, cierre, stock y resultados.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SeccionCard
          to="/app/compras/tropas"
          icon={ShoppingCart}
          titulo="Tropas"
          descripcion="Alta de compras, categorías/razas, cierre y reapertura de cada tropa."
          badge={tropasAbiertas > 0 ? `${tropasAbiertas} abierta${tropasAbiertas === 1 ? "" : "s"}` : undefined}
        />
        <SeccionCard
          to="/app/compras/stock"
          icon={Boxes}
          titulo="Stock de tropas"
          descripcion="Stock teórico de cada tropa abierta: cabezas compradas menos cabezas ya vendidas."
          badge={tropasConStock > 0 ? `${tropasConStock} con stock` : undefined}
        />
        <SeccionCard
          to="/app/compras/frigorificos"
          icon={Building2}
          titulo="Frigoríficos"
          descripcion="Establecimientos faenadores — catálogo para el resultado de faena de cada tropa."
          badge={cantidadFrigorificos > 0 ? `${cantidadFrigorificos}` : undefined}
        />
        <SeccionCard
          to="/app/compras/tropas"
          icon={Scale}
          titulo="Resultado de faena"
          descripcion="Rendimiento, kg de carne y % de magro por categoría — se carga desde el detalle de cada tropa."
        />
        <SeccionCard
          to="/app/compras/tropas"
          icon={Banknote}
          titulo="Liquidación de faena"
          descripcion="Lo que cobra el frigorífico por faenar (canon por categoría) — se carga desde el detalle de cada tropa."
        />
        <SeccionCard
          to="/app/compras/tropas"
          icon={Receipt}
          titulo="Liquidación de compra"
          descripcion="Liquidación fiscal de la tropa al proveedor, con emisión de CAE (AFIP/WSLSP) — se carga desde el detalle de cada tropa."
        />
        <SeccionCard
          to="/app/compras/informes"
          icon={LineChart}
          titulo="Informes"
          descripcion="Rentabilidad por tropa: costo (proveedor + frigorífico) vs. ingreso de venta."
        />
      </div>
    </div>
  );
}

interface SeccionCardProps {
  icon: LucideIcon;
  titulo: string;
  descripcion: string;
  to?: "/app/compras/tropas" | "/app/compras/stock" | "/app/compras/frigorificos" | "/app/compras/informes";
  proximamente?: boolean;
  badge?: string;
}

function SeccionCard({ icon: Icon, titulo, descripcion, to, proximamente, badge }: SeccionCardProps) {
  const contenido = (
    <Card
      className={cn(
        "h-full transition-colors",
        proximamente ? "opacity-60" : "hover:border-primary/50 cursor-pointer",
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <Icon className="text-muted-foreground size-6" />
          {proximamente ? (
            <Badge variant="secondary">Próximamente</Badge>
          ) : badge ? (
            <Badge>{badge}</Badge>
          ) : null}
        </div>
        <CardTitle className="pt-2">{titulo}</CardTitle>
        <CardDescription>{descripcion}</CardDescription>
      </CardHeader>
    </Card>
  );

  if (proximamente || !to) {
    return contenido;
  }

  return (
    <Link to={to} className="block">
      {contenido}
    </Link>
  );
}
