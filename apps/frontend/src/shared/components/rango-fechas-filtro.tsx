import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { RangoFechas } from "@/shared/lib/rango-fechas";
import { rangoDeSemanasIso, semanaIsoActual } from "@/shared/lib/semana-iso";

interface RangoFechasFiltroProps {
  /** `null` = sin filtro (se muestra todo). */
  rango: RangoFechas | null;
  onChange: (rango: RangoFechas | null) => void;
  cantidadResultados?: number;
  etiquetaResultados?: string;
}

function anioActual(): number {
  return new Date().getFullYear();
}

/**
 * Filtro de rango de fechas — pensado ante todo para elegir por NÚMERO de
 * semana ISO (Año + Semana desde/hasta), que es como el negocio piensa el
 * calendario (mismo par de campos que ya existe en "Porcentaje de
 * cobranza"), con un rango de fechas libre como alternativa para casos
 * puntuales que no calzan con una semana.
 */
export function RangoFechasFiltro({
  rango,
  onChange,
  cantidadResultados,
  etiquetaResultados = "resultados",
}: RangoFechasFiltroProps) {
  const [anio, setAnio] = useState(anioActual());
  const [semanaDesde, setSemanaDesde] = useState("");
  const [semanaHasta, setSemanaHasta] = useState("");

  // Últimos 2 años + actual + próximo — mismo criterio que el selector de año de "Porcentaje de cobranza".
  const opcionesAnio = [anioActual() - 2, anioActual() - 1, anioActual(), anioActual() + 1];

  function aplicarSemana(nuevoAnio: number, desde: string, hasta: string) {
    const desdeNum = desde ? Number(desde) : null;
    if (!desdeNum) return;
    const hastaNum = hasta ? Number(hasta) : undefined;
    onChange(rangoDeSemanasIso(nuevoAnio, desdeNum, hastaNum));
  }

  function irASemanaActual() {
    const actual = semanaIsoActual();
    setAnio(actual.anio);
    setSemanaDesde(String(actual.semana));
    setSemanaHasta("");
    onChange(rangoDeSemanasIso(actual.anio, actual.semana));
  }

  function limpiar() {
    setSemanaDesde("");
    setSemanaHasta("");
    onChange(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label className="text-muted-foreground text-xs font-medium">Año</label>
          <Select
            value={String(anio)}
            onValueChange={(v) => {
              const nuevoAnio = Number(v);
              setAnio(nuevoAnio);
              aplicarSemana(nuevoAnio, semanaDesde, semanaHasta);
            }}
          >
            <SelectTrigger className="w-24">
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
        <div className="space-y-1">
          <label className="text-muted-foreground text-xs font-medium">Semana desde</label>
          <Input
            type="number"
            min={1}
            max={53}
            value={semanaDesde}
            placeholder="1"
            onChange={(e) => {
              setSemanaDesde(e.target.value);
              aplicarSemana(anio, e.target.value, semanaHasta);
            }}
            className="w-20"
          />
        </div>
        <div className="space-y-1">
          <label className="text-muted-foreground text-xs font-medium">hasta</label>
          <Input
            type="number"
            min={1}
            max={53}
            value={semanaHasta}
            placeholder={semanaDesde || "—"}
            onChange={(e) => {
              setSemanaHasta(e.target.value);
              aplicarSemana(anio, semanaDesde, e.target.value);
            }}
            className="w-20"
          />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={irASemanaActual}>
          Semana actual
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label className="text-muted-foreground text-xs font-medium">o elegí fechas libres — Desde</label>
          <Input
            type="date"
            value={rango?.desde ?? ""}
            onChange={(e) => onChange({ desde: e.target.value, hasta: rango?.hasta ?? e.target.value })}
            className="w-fit"
          />
        </div>
        <div className="space-y-1">
          <label className="text-muted-foreground text-xs font-medium">Hasta</label>
          <Input
            type="date"
            value={rango?.hasta ?? ""}
            onChange={(e) => onChange({ desde: rango?.desde ?? e.target.value, hasta: e.target.value })}
            className="w-fit"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn("text-muted-foreground", !rango && "invisible")}
          onClick={limpiar}
        >
          Ver todo
        </Button>
      </div>

      {cantidadResultados !== undefined && (
        <p className="text-muted-foreground text-sm">
          {cantidadResultados} {etiquetaResultados}
          {rango ? "" : " (todo el historial)"}
        </p>
      )}
    </div>
  );
}
