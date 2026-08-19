import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { useStockTropas } from "@/modules/compras/hooks/use-stock-tropas";
import { StockTropasResumenCard } from "@/modules/compras/components/stock-tropas-resumen-card";
import { useInformeCabezas } from "@/modules/cabezas/hooks/use-informe-cabezas";
import { BloqueCabezasTable } from "@/modules/cabezas/components/bloque-cabezas-table";
import { fechasDeSemanaIso, obtenerSemanaIso, semanaIsoActual } from "@/shared/lib/semana-iso";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/app/ventas/cabezas/")({
  component: CabezasPage,
});

function anioActual(): number {
  return new Date().getFullYear();
}

function formatoCorto(fechaIso: string): string {
  const [, mes, dia] = fechaIso.split("-");
  return `${dia}/${mes}`;
}

function CabezasPage() {
  const actual = semanaIsoActual();
  const [anio, setAnio] = useState(actual.anio);
  const [semana, setSemana] = useState(actual.semana);

  const informeQuery = useInformeCabezas({ anio, semana });
  const stockTropasQuery = useStockTropas();

  const opcionesAnio = [anioActual() - 2, anioActual() - 1, anioActual(), anioActual() + 1];
  const rango = fechasDeSemanaIso({ anio, semana });

  /**
   * Suma/resta una semana calendario y recalcula a qué semana ISO (y año ISO
   * — puede cruzar el borde de diciembre/enero) cae la fecha resultante, en
   * vez de simplemente sumar 1 a `semana` — así `irASemana` nunca produce un
   * número de semana inválido para el año (ej. "semana 54").
   */
  function irASemana(delta: number) {
    const fecha = new Date(`${rango.desde}T00:00:00Z`);
    fecha.setUTCDate(fecha.getUTCDate() + delta * 7);
    const nueva = obtenerSemanaIso(fecha);
    setAnio(nueva.anio);
    setSemana(nueva.semana);
  }

  function irASemanaActual() {
    setAnio(actual.anio);
    setSemana(actual.semana);
  }

  const cargando = informeQuery.isPending;
  const error = informeQuery.error;

  return (
    <div className="space-y-4">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link to="/app/ventas">
            <ArrowLeft className="size-4" />
            Ventas
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Cabezas</h1>
          <p className="text-muted-foreground text-sm">
            Planificación vs. venta real de cabezas por cliente, semana a semana — un bloque por categoría
            (Capón, Chancha).
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">Año</span>
          <Select value={String(anio)} onValueChange={(v) => setAnio(Number(v))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {opcionesAnio.map((a) => (
                <SelectItem key={a} value={String(a)}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">Semana</span>
          <Input
            type="number"
            min={1}
            max={53}
            value={semana}
            onChange={(e) => setSemana(Number(e.target.value) || 1)}
            className="w-20"
          />
        </div>

        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => irASemana(-1)} title="Semana anterior">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => irASemana(1)} title="Semana siguiente">
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <Button variant="ghost" size="sm" onClick={irASemanaActual}>
          Esta semana
        </Button>

        <span className="text-muted-foreground ml-1 text-sm">
          {formatoCorto(rango.desde)} al {formatoCorto(rango.hasta)}
        </span>
      </div>

      {!stockTropasQuery.isPending && !stockTropasQuery.error && (
        <StockTropasResumenCard tropas={stockTropasQuery.data ?? []} />
      )}

      {cargando ? (
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-16 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Cargando...
        </div>
      ) : error ? (
        <p className="text-destructive py-16 text-center text-sm">{error.message}</p>
      ) : (
        <div className="space-y-4">
          {(informeQuery.data?.bloques ?? []).map((bloque) => (
            <BloqueCabezasTable key={bloque.grupo} bloque={bloque} />
          ))}
        </div>
      )}
    </div>
  );
}
