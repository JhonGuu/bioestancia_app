import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, FolderTree, GitCompare, Landmark, ListTree, Scale, Sprout, Tags, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Permisos } from "@/modules/auth/domain/auth.types";
import { useTienePermiso } from "@/modules/auth/hooks/use-tiene-permiso";
import { SinPermiso } from "@/shared/components/sin-permiso";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/contabilidad/")({
  component: ContabilidadDashboardPage,
});

/**
 * Dashboard del módulo contable: núcleo (fase 1) completo — plan de
 * cuentas, ejercicios/períodos, asientos con partida doble en vivo, y los
 * tres informes clásicos (diario, mayor, sumas y saldos). Las fases
 * siguientes (automáticos, tesorería, conciliación, cierre) se suman acá
 * mismo cuando estén listas.
 */
function ContabilidadDashboardPage() {
  const tieneAcceso = useTienePermiso(Permisos.VER_CONTABILIDAD);
  if (!tieneAcceso) return <SinPermiso />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Contabilidad</h1>
        <p className="text-muted-foreground text-sm">
          Partida doble, plan de cuentas jerárquico, libro diario, mayores y sumas y saldos — números reales
          de gestión, con o sin comprobante fiscal.
        </p>
      </div>

      <div>
        <h2 className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">Estructura</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SeccionCard
            to="/app/contabilidad/plan-cuentas"
            icon={FolderTree}
            titulo="Plan de cuentas"
            descripcion="Jerarquía completa, editable — creá cuentas o sembrá el catálogo base para una empresa comercial."
          />
          <SeccionCard
            to="/app/contabilidad/centros-costo"
            icon={Tags}
            titulo="Centros de costo"
            descripcion="Imputá una cuenta por tropa, reparto u otra parte del negocio, sin duplicarla."
          />
          <SeccionCard
            to="/app/contabilidad/ejercicios"
            icon={ListTree}
            titulo="Ejercicios y períodos"
            descripcion="Cada empresa define su propio cierre. Cerrar un período es la única barrera dura del sistema."
          />
        </div>
      </div>

      <div>
        <h2 className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">Asientos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SeccionCard
            to="/app/contabilidad/asientos"
            icon={BookOpen}
            titulo="Asientos"
            descripcion="Carga manual con validación de partida doble en vivo — borrador editable hasta confirmar."
          />
          <SeccionCard
            to="/app/contabilidad/asientos/apertura"
            icon={Sprout}
            titulo="Generador de apertura"
            descripcion="Cargá los saldos iniciales con signo — el sistema arma el asiento y decide el lado natural."
          />
          <SeccionCard
            to="/app/contabilidad/reglas-asiento"
            icon={Zap}
            titulo="Reglas de asiento"
            descripcion="Configurá qué asiento se genera solo cuando pasa un evento — boleta facturada, cobro, cheque depositado, y más."
          />
        </div>
      </div>

      <div>
        <h2 className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">Informes</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SeccionCard
            to="/app/contabilidad/reportes/diario"
            icon={BookOpen}
            titulo="Libro diario"
            descripcion="Todos los asientos confirmados en orden cronológico, con el control de partida doble."
          />
          <SeccionCard
            to="/app/contabilidad/reportes/mayor"
            icon={Landmark}
            titulo="Mayor"
            descripcion="Movimientos de una cuenta con saldo corrido — abrible por cliente, proveedor u otro auxiliar."
          />
          <SeccionCard
            to="/app/contabilidad/reportes/sumas-y-saldos"
            icon={Scale}
            titulo="Sumas y saldos"
            descripcion="A cualquier fecha de corte, con la jerarquía completa del plan de cuentas."
          />
          <SeccionCard
            to="/app/contabilidad/reportes/conciliacion"
            icon={GitCompare}
            titulo="Conciliación"
            descripcion="Compará el saldo de cuenta corriente de cada cliente contra el saldo contable confirmado."
          />
        </div>
      </div>
    </div>
  );
}

interface SeccionCardProps {
  icon: LucideIcon;
  titulo: string;
  descripcion: string;
  to:
    | "/app/contabilidad/plan-cuentas"
    | "/app/contabilidad/centros-costo"
    | "/app/contabilidad/ejercicios"
    | "/app/contabilidad/asientos"
    | "/app/contabilidad/asientos/apertura"
    | "/app/contabilidad/reportes/diario"
    | "/app/contabilidad/reportes/mayor"
    | "/app/contabilidad/reportes/sumas-y-saldos"
    | "/app/contabilidad/reportes/conciliacion"
    | "/app/contabilidad/reglas-asiento";
}

function SeccionCard({ icon: Icon, titulo, descripcion, to }: SeccionCardProps) {
  return (
    <Link to={to} className="block">
      <Card className={cn("h-full transition-colors", "hover:border-primary/50 cursor-pointer")}>
        <CardHeader>
          <Icon className="text-muted-foreground size-6" />
          <CardTitle className="pt-2">{titulo}</CardTitle>
          <CardDescription>{descripcion}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
