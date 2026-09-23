import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { useAuth } from "@/modules/auth/context/auth-context";
import { Permisos, Roles } from "@/modules/auth/domain/auth.types";
import { ChoferesTab } from "@/modules/transportes/components/choferes-tab";
import { TransportistasTab } from "@/modules/transportes/components/transportistas-tab";
import { VehiculosTab } from "@/modules/transportes/components/vehiculos-tab";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/transporte/")({
  component: TransportePage,
});

const TABS = [
  { id: "transportistas", label: "Transportistas" },
  { id: "choferes", label: "Choferes" },
  { id: "vehiculos", label: "Vehículos" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function TransportePage() {
  const { empresaActiva } = useAuth();
  const [tab, setTab] = useState<TabId>("transportistas");
  const puedeEditar = empresaActiva?.rol === Roles.ADMIN || empresaActiva?.rol === Roles.CONTABLE;
  const puedeVerDatosPersonales = empresaActiva?.permisos.includes(Permisos.VER_DATOS_CHOFERES) ?? false;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Transporte</h1>
        <p className="text-muted-foreground text-sm">
          Transportistas, choferes y vehículos de la empresa activa. Los choferes y vehículos que pueden
          retirar mercadería de cada cliente se eligen en la ficha del cliente.
        </p>
      </div>

      <div role="tablist" className="bg-muted inline-flex rounded-lg p-1">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              tab === id ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "transportistas" && <TransportistasTab puedeEditar={puedeEditar} />}
      {tab === "choferes" && (
        <ChoferesTab puedeEditar={puedeEditar} puedeVerDatosPersonales={puedeVerDatosPersonales} />
      )}
      {tab === "vehiculos" && <VehiculosTab puedeEditar={puedeEditar} />}
    </div>
  );
}
