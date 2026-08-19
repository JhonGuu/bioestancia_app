import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { compraNumeroYLetra, type Compra } from "@/modules/compras/domain/compra.types";
import { nombreProveedor, type Proveedor } from "@/modules/proveedores/domain/proveedor.types";

interface PrecioEvolucionChartProps {
  /** Solo compras con `precioCompraKg` cargado — no hace falta que vengan ordenadas, el componente ordena. */
  compras: Compra[];
  proveedoresPorId: Map<string, Proveedor>;
}

const formatoMoneda = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

// Paleta fija (no depende de las CSS vars del tema, que solo definen
// primary/destructive) — elegida para distinguirse bien tanto en claro
// como en oscuro. Se recicla si hay más proveedores que colores.
const COLORES = ["#2563eb", "#16a34a", "#ea580c", "#9333ea", "#dc2626", "#0891b2", "#ca8a04", "#db2777"];

/**
 * $/kg en pie pagado a cada proveedor ("criadero"), tropa por tropa en el
 * tiempo — una línea por proveedor para poder comparar si alguno viene
 * cobrando más caro o si todos se mueven parejo. Formato "ancho": cada fila
 * del dataset es UNA compra puntual, con el valor cargado solo en la
 * columna de SU proveedor (las demás quedan `undefined` esa fila) —
 * `connectNulls` en cada `<Line>` hace que el trazo de cada proveedor
 * ignore esos huecos y una solo sus propios puntos.
 */
export function PrecioEvolucionChart({ compras, proveedoresPorId }: PrecioEvolucionChartProps) {
  const ordenados = [...compras].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
  );

  const proveedorIds = [...new Set(ordenados.map((c) => c.proveedorId))].sort((a, b) => {
    const nombreA = proveedoresPorId.get(a) ? nombreProveedor(proveedoresPorId.get(a)!) : a;
    const nombreB = proveedoresPorId.get(b) ? nombreProveedor(proveedoresPorId.get(b)!) : b;
    return nombreA.localeCompare(nombreB);
  });

  const data = ordenados.map((c) => ({
    label: `${new Date(c.fecha).toLocaleDateString("es-AR", { timeZone: "UTC", day: "2-digit", month: "2-digit" })} · ${compraNumeroYLetra(c)}`,
    [c.proveedorId]: c.precioCompraKg ?? undefined,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          tickFormatter={(v: number) => formatoMoneda.format(v)}
          width={60}
          domain={["auto", "auto"]}
        />
        <Tooltip
          formatter={(value) => `$${formatoMoneda.format(Number(value ?? 0))}/kg`}
          contentStyle={{
            backgroundColor: "var(--card, #fff)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {proveedorIds.map((proveedorId, index) => (
          <Line
            key={proveedorId}
            type="monotone"
            dataKey={proveedorId}
            name={proveedoresPorId.get(proveedorId) ? nombreProveedor(proveedoresPorId.get(proveedorId)!) : "—"}
            stroke={COLORES[index % COLORES.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
