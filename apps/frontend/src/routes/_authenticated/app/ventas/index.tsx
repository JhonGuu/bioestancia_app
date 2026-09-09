import { createFileRoute, Link } from "@tanstack/react-router";
import { Banknote, DollarSign, HandCoins, PiggyBank, Percent, PlusCircle, Target, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Permisos } from "@/modules/auth/domain/auth.types";
import { useTienePermiso } from "@/modules/auth/hooks/use-tiene-permiso";
import { useVentas } from "@/modules/ventas/hooks/use-ventas";
import { useCheques } from "@/modules/cheques/hooks/use-cheques";
import { EstadoCheque } from "@/modules/cheques/domain/cheque.types";
import { useProgresoMetasSemanales } from "@/modules/metas-semanales/hooks/use-progreso-metas-semanales";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/ventas/")({
  component: VentasDashboardPage,
});

/**
 * Dashboard de Ventas: nuclea todo lo que conlleva el módulo (precios,
 * cobros, cheques, cuenta corriente) en un solo lugar, con una tarjeta por
 * sección. Las secciones sin vista propia todavía se muestran deshabilitadas
 * ("Próximamente") para anticipar dónde van a aparecer.
 */
function VentasDashboardPage() {
  const ventasQuery = useVentas();
  const pendientesDePrecio = (ventasQuery.data ?? []).filter((v) => v.activo && v.precioKg === null).length;

  const chequesQuery = useCheques({ estado: EstadoCheque.EN_CARTERA });
  const chequesEnCartera = (chequesQuery.data ?? []).length;

  const progresoMetasQuery = useProgresoMetasSemanales();
  const metasCumplidas = (progresoMetasQuery.data ?? []).filter((p) => p.cumplida).length;

  // Estas 3 secciones muestran información sensible protegida por permiso
  // granular (ver `Permisos`) — sin el permiso, ni la tarjeta se muestra
  // (mismo criterio que el filtro de rol en `NAV_ITEMS`/`app-shell.tsx`).
  const tieneAccesoCheques = useTienePermiso(Permisos.VER_CHEQUES);
  const tieneAccesoCuentaCorriente = useTienePermiso(Permisos.VER_CUENTA_CORRIENTE);
  const tieneAccesoPorcentajeCobranza = useTienePermiso(Permisos.VER_PORCENTAJE_COBRANZA);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Ventas</h1>
        <p className="text-muted-foreground text-sm">
          Precios, cobros, cheques y cuenta corriente de clientes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SeccionCard
          to="/app/ventas/nuevo"
          icon={PlusCircle}
          titulo="Cargar venta manual"
          descripcion="Cargá una venta directo, sin importador ni boleta — para probar un caso puntual."
        />
        <SeccionCard
          to="/app/ventas/precios"
          icon={DollarSign}
          titulo="Agregar precio a boletas"
          descripcion="Completá el precio por kg de las boletas cargadas desde el reparto, agrupadas por categoría."
          badge={pendientesDePrecio > 0 ? `${pendientesDePrecio} pendiente${pendientesDePrecio === 1 ? "" : "s"}` : undefined}
        />
        <SeccionCard
          to="/app/ventas/cobros"
          icon={HandCoins}
          titulo="Cobros"
          descripcion="Cargá pagos (efectivo, transferencia, cheque) — se aplican a boletas pendientes solas."
        />
        {tieneAccesoCheques && (
          <SeccionCard
            to="/app/ventas/cheques"
            icon={Banknote}
            titulo="Cheques"
            descripcion="Cartera de cheques: seguimiento y destino (depositados, rechazados, etc.)."
            badge={chequesEnCartera > 0 ? `${chequesEnCartera} en cartera` : undefined}
          />
        )}
        {tieneAccesoCuentaCorriente && (
          <SeccionCard
            to="/app/ventas/cuenta-corriente"
            icon={Wallet}
            titulo="Cuenta corriente"
            descripcion="Resumen de cuenta por cliente: saldo total, saldo vencido y detalle de movimientos."
          />
        )}
        <SeccionCard
          to="/app/ventas/metas-semanales"
          icon={Target}
          titulo="Metas semanales"
          descripcion="Progreso de cabezas/semana de los clientes con meta configurada — no se compensa entre semanas."
          badge={metasCumplidas > 0 ? `${metasCumplidas} cumplida${metasCumplidas === 1 ? "" : "s"}` : undefined}
        />
        {tieneAccesoPorcentajeCobranza && (
          <SeccionCard
            to="/app/ventas/porcentaje-cobranza"
            icon={Percent}
            titulo="Porcentaje de cobranza"
            descripcion="% de la deuda vencida cobrada cada semana, por cliente — sin contar la venta nueva de esa semana."
          />
        )}
        <SeccionCard
          to="/app/ventas/cabezas"
          icon={PiggyBank}
          titulo="Cabezas"
          descripcion="Planificación vs. venta real de cabezas por cliente y semana, por categoría (Capón, Chancha)."
        />
      </div>
    </div>
  );
}

interface SeccionCardProps {
  icon: LucideIcon;
  titulo: string;
  descripcion: string;
  to?:
    | "/app/ventas/nuevo"
    | "/app/ventas/precios"
    | "/app/ventas/cobros"
    | "/app/ventas/cheques"
    | "/app/ventas/cuenta-corriente"
    | "/app/ventas/metas-semanales"
    | "/app/ventas/porcentaje-cobranza"
    | "/app/ventas/cabezas";
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
