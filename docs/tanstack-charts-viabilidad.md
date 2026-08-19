# TanStack Charts — evaluación de viabilidad

> Repo: https://github.com/TanStack/charts · npm: `@tanstack/charts`, `@tanstack/react-charts` · Investigado: agosto 2026.

## Veredicto corto

**No, todavía no.** Es de los mismos creadores de TanStack (Tanner Linsley, el mismo autor de Router y Query, que ya usamos), pero está en **pre-alpha real**, no solo de nombre. Para los gráficos de Compras (Fase 5 del plan) conviene usar **Recharts** ahora y volver a evaluar esta librería más adelante, cuando estabilice.

## Por qué no todavía

1. **El propio proyecto se declara no apto para producción.** El README dice textualmente: _"TanStack Charts is currently an unpublished `0.0.0` product proof. The packages are not published or ready for production use yet."_ — y lo repite cada página de docs: _"it is pre-alpha and its API may change between releases."_

2. **Ritmo de cambios muy alto, sin ningún historial de estabilidad.** El paquete se creó en npm el **29 de julio de 2026** y ya lleva **26 versiones** hasta `0.12.0`, publicada **ayer** (12 de agosto). Es, en la práctica, código nuevo cambiando todos los días — no una librería que se pueda fijar en una versión y olvidarse.

3. **La API ya cambió de raíz entre lo publicado y lo que viene.** La versión publicada (`0.12.0`) usa un paquete separado por framework (`@tanstack/react-charts`, con `import { Chart } from '@tanstack/react-charts'`). La documentación de la rama `main` (no liberada todavía) ya describe una estructura totalmente distinta: un solo paquete `@tanstack/charts` con subpaths (`@tanstack/charts/react`). Es decir, cualquier código que escribamos hoy contra `0.12.0` muy probablemente haya que reescribirlo en la próxima versión mayor.

4. **Cero evidencia de adopción real.** 92 estrellas en GitHub, un solo watcher, sin casos de uso en producción documentados. El propio README aclara que _"almost all of the implementation was produced with AI coding agents"_ bajo supervisión del autor — interesante como proyecto, pero sin el rodaje que uno quiere en algo de lo que depende un sistema de facturación/gestión real.

## A favor (por qué vale la pena vigilarla)

- Mismos creadores que TanStack Router/Query, que ya son la base del frontend de Bioestancia — buen encaje de filosofía y probable buena integración a futuro.
- Diseño sólido: gráficos accesibles, responsive, SSR-friendly, con Canvas opcional para datasets grandes, y una gramática de capas (marks + channels + scales) inspirada en Observable Plot / ggplot2 — mucho más flexible a largo plazo que una librería de "chart types" fija.
- Muy liviana y tree-shakeable (subpaths exactos, sin paquete `d3` completo).
- React 19 ya es un peer dependency compatible con lo que usa el frontend (`react@^19.2.7`).

## Recomendación para el plan de Compras

Usar **Recharts** para los gráficos de Fase 5 (rentabilidad por tropa/proveedor/frigorífico). Es estable, ampliamente usado, tiene buena integración con los componentes `chart` de shadcn/ui (que ya seguimos como base de diseño), y no exige apostar a una API que puede cambiar antes de que terminemos de construir el módulo.

Reevaluar TanStack Charts cuando llegue a `1.0` o al menos deje de decir "pre-alpha" en su propio README.

---

## Cómo se usaría (referencia, si en el futuro se adopta)

Documentado con la versión publicada `0.12.0` (paquete `@tanstack/react-charts`), no con la API de `main` que todavía no se liberó.

### Instalación

```bash
pnpm add @tanstack/charts @tanstack/react-charts
```

Requiere `react`/`react-dom` `^19.0.0` (ya cumplido en este proyecto).

### Ejemplo mínimo — gráfico de línea

```tsx
import { scaleBand, scaleLinear } from "d3-scale";
import { defineChart, lineY } from "@tanstack/charts";
import { Chart } from "@tanstack/react-charts";

interface RentabilidadMes {
  mes: string;
  rentabilidad: number;
}

const datos: RentabilidadMes[] = [
  { mes: "Ene", rentabilidad: 0.14 },
  { mes: "Feb", rentabilidad: 0.18 },
  { mes: "Mar", rentabilidad: 0.11 },
];

const rentabilidadChart = defineChart({
  marks: [
    lineY(datos, {
      x: "mes",
      y: "rentabilidad",
      stroke: "#2563eb",
    }),
  ],
  x: { scale: () => scaleBand().padding(0.2) },
  y: { scale: scaleLinear, nice: true, grid: true, label: "Rentabilidad" },
});

export function RentabilidadChart() {
  return (
    <Chart
      definition={rentabilidadChart}
      height={320}
      ariaLabel="Rentabilidad mensual"
      tooltip
    />
  );
}
```

### Conceptos clave

- **`defineChart`**: arma la definición del gráfico (framework-agnóstica) — `marks` (líneas, barras, puntos, etc.), y las escalas `x`/`y`.
- **`marks`**: cada mark (ej. `lineY`, `barY`, `dot`) recibe los datos originales directamente (sin transformarlos a un formato de "serie" propio) y mapea columnas a canales visuales (`x`, `y`, `stroke`, `fill`, etc.).
- **Escalas D3**: usa fábricas de escalas de `d3-scale` (`scaleLinear`, `scaleBand`, etc.) — no reinventa su propia API de escalas, así que lo que ya se sepa de D3 aplica directo.
- **`<Chart>`** (adaptador de React): monta la definición, maneja el ciclo de vida, responsive width, accesibilidad (`ariaLabel`) y tooltips.
- **Canvas opcional**: para datasets grandes, cambiar el import a `@tanstack/react-charts/canvas` sin tocar la definición del gráfico.
- **Memoización**: como la identidad de la definición es la que dispara actualizaciones, hay que envolver `defineChart(...)` en `useMemo` cuando dependa de datos que cambian.

### Links útiles

- Docs: https://tanstack.com/charts
- Quick start: https://github.com/TanStack/charts/blob/main/docs/quick-start.md
- Comparación con Chart.js/ECharts/Recharts/Observable Plot: https://github.com/TanStack/charts/blob/main/docs/comparison.md
- Roadmap y gates de producción: https://github.com/TanStack/charts/blob/main/PLAN.md
