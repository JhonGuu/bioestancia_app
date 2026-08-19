import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { RentabilidadTropa } from "@/modules/informes-compras/domain/rentabilidad-tropa.types";
import { compraNumeroYLetra } from "@/modules/compras/domain/compra.types";

interface RentabilidadChartProps {
  /** Solo tropas con `costoTotal` cargado (ver filtro en la página) — ordenadas ascendente por fecha para leerlas como serie temporal. */
  tropas: RentabilidadTropa[];
}

const formatoMoneda = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

/**
 * Costo vs. ingreso por tropa (barras agrupadas) — la comparación central
 * del informe de rentabilidad. Usa `var(--primary)`/`var(--destructive)`
 * para respetar el tema claro/oscuro de la app en vez de colores fijos.
 */
export function RentabilidadChart({ tropas }: RentabilidadChartProps) {
  const data = tropas.map((t) => ({
    nombre: compraNumeroYLetra(t),
    costo: t.costoTotal ?? 0,
    ingreso: t.ingresoVenta,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="nombre"
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          tickFormatter={(v: number) => formatoMoneda.format(v)}
          width={70}
        />
        <Tooltip
          formatter={(value) => `$${formatoMoneda.format(Number(value ?? 0))}`}
          contentStyle={{
            backgroundColor: "var(--card, #fff)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="costo" name="Costo total" fill="var(--destructive)" radius={[3, 3, 0, 0]} />
        <Bar dataKey="ingreso" name="Ingreso venta" fill="var(--primary)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
