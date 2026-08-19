import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, Clock, Upload, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useCargos } from "@/modules/cargos/hooks/use-cargos";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/personal/")({
  component: PersonalDashboardPage,
});

/**
 * Dashboard de Personal: legajo de empleados, catálogo de cargos y (en fases
 * siguientes) fichajes y cálculo de jornada — mismo criterio que
 * `ComprasDashboardPage`.
 */
function PersonalDashboardPage() {
  const cargosQuery = useCargos();
  const cantidadCargos = (cargosQuery.data ?? []).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Personal</h1>
        <p className="text-muted-foreground text-sm">
          Legajo de empleados, cargos, horarios pactados y asistencia.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SeccionCard
          to="/app/personal/empleados"
          icon={Users}
          titulo="Empleados"
          descripcion="Legajo completo: datos personales, laborales, horario pactado y copia del DNI."
        />
        <SeccionCard
          to="/app/personal/cargos"
          icon={Briefcase}
          titulo="Cargos"
          descripcion="Catálogo de cargos y su tolerancia de tardanza."
          badge={cantidadCargos > 0 ? `${cantidadCargos}` : undefined}
        />
        <SeccionCard
          to="/app/personal/fichajes/importar"
          icon={Upload}
          titulo="Importar fichajes"
          descripcion="Subí el Excel del lector de huellas y resolvé los nombres que no matcheen."
        />
        <SeccionCard
          to="/app/personal/balance-horas"
          icon={Clock}
          titulo="Balance de horas extra"
          descripcion="Horas acumuladas por empleado con selector de período (semanal/quincenal/mensual)."
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
    | "/app/personal/empleados"
    | "/app/personal/cargos"
    | "/app/personal/fichajes/importar"
    | "/app/personal/balance-horas";
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
