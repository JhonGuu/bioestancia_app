import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PrecioGrupoForm } from "@/modules/ventas/components/precio-grupo-form";
import type { BoletaPendientePrecio } from "@/modules/ventas/domain/agrupar-ventas-pendientes";
import { nombreCliente } from "@/modules/clientes/domain/cliente.types";

interface BoletaPendientePrecioCardProps {
  grupo: BoletaPendientePrecio;
}

/** Una boleta con sus grupos de ítems pendientes de precio (uno por categoría+presentación). */
export function BoletaPendientePrecioCard({ grupo }: BoletaPendientePrecioCardProps) {
  const totalItems = grupo.grupos.reduce((acc, g) => acc + g.ventas.length, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {grupo.boleta?.numero ? `Boleta ${grupo.boleta.numero}` : "Sin boleta asociada"}
          {" · "}
          {grupo.cliente ? nombreCliente(grupo.cliente) : "Cliente sin datos"}
        </CardTitle>
        <CardDescription>
          {new Date(grupo.fecha).toLocaleDateString("es-AR", { timeZone: "UTC" })} · {totalItems} ítem
          {totalItems === 1 ? "" : "s"} pendiente{totalItems === 1 ? "" : "s"} de precio
        </CardDescription>
      </CardHeader>
      <CardContent>
        {grupo.grupos.map((g) => (
          <PrecioGrupoForm key={g.clave} grupo={g} />
        ))}
      </CardContent>
    </Card>
  );
}
