import { useState } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { nombreCliente, type Cliente } from "@/modules/clientes/domain/cliente.types";
import {
  BANDA_COBRANZA_EMOJI,
  BANDA_COBRANZA_LABELS,
  BANDA_COBRANZA_ORDEN,
  type BandaCobranza,
  type PorcentajeCobranzaCliente,
  type SemanaCobranza,
} from "@/modules/porcentaje-cobranza/domain/porcentaje-cobranza.types";
import { BANDA_COBRANZA_CLASSNAME, SIN_BANDA_CLASSNAME } from "@/modules/porcentaje-cobranza/components/banda-cobranza-styles";

interface PorcentajeCobranzaTableProps {
  clientes: Cliente[];
  datos: PorcentajeCobranzaCliente[];
}

type Orden = "ninguno" | "peor" | "mejor";

const formatoMoneda = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

function formatoPorcentaje(valor: number | null): string {
  if (valor === null) return "—";
  return `${Math.round(valor * 100)}%`;
}

function fecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", { timeZone: "UTC" });
}

/** `true` si el rango [aDesde, aHasta] se superpone con [bDesde, bHasta] (todo inclusive). */
function seSuperponen(aDesde: Date, aHasta: Date, bDesde: Date, bHasta: Date): boolean {
  return aDesde.getTime() <= bHasta.getTime() && bDesde.getTime() <= aHasta.getTime();
}

/**
 * Tabla cliente × semana ISO del `% de cobranza de deuda vencida` — MISMA
 * disposición de columnas que la hoja "Porcentaje de cobranza" de
 * "VENTAS 2026.xlsm", desfasaje incluido: bajo el encabezado "SEM N" (N≥2)
 * van 5 columnas: `Saldo con el que inicia SEM` y `% Cobr.` SON de la
 * semana N, pero el `Remanente` que aparece ahí es el sobrante de la
 * semana ANTERIOR (N-1) — así está en el Excel a propósito, se mantiene
 * igual. La semana 1 es la única con 4 columnas (no tiene remanente previo
 * que mostrar): Vendido, Saldo inicial, Cobrado, % Cobr.
 *
 * Cliente + encabezado quedan fijos al scrollear (un solo contenedor con
 * scroll en las dos direcciones — ver el `<div>` con `overflow-auto` más
 * abajo; el `<table>` se arma a mano, sin el wrapper propio de `Table` de
 * shadcn, porque ese wrapper agrega SU PROPIO scroll horizontal y con dos
 * contenedores de scroll anidados `position: sticky` deja de funcionar).
 */
export function PorcentajeCobranzaTable({ clientes, datos }: PorcentajeCobranzaTableProps) {
  const [busqueda, setBusqueda] = useState("");
  const [semanaDesde, setSemanaDesde] = useState("");
  const [semanaHasta, setSemanaHasta] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [orden, setOrden] = useState<Orden>("ninguno");
  const [bandasSeleccionadas, setBandasSeleccionadas] = useState<Set<BandaCobranza>>(new Set());

  const datosPorCliente = new Map(datos.map((d) => [d.clienteId, d]));
  const semanasReferencia = datos[0]?.semanas ?? [];
  const totalSemanas = semanasReferencia.length;

  if (totalSemanas === 0) {
    return <p className="text-muted-foreground py-8 text-center text-sm">Sin datos para este año.</p>;
  }

  // Índices (0-based, sobre el array COMPLETO de semanas del año) que se
  // muestran como columna — el resto de la lógica (desfasaje del
  // remanente, etc.) sigue trabajando con el índice original, no con la
  // posición dentro de este subconjunto.
  const desdeNum = semanaDesde ? Number(semanaDesde) : 1;
  const hastaNum = semanaHasta ? Number(semanaHasta) : totalSemanas;
  const rangoFechaDesde = fechaDesde ? new Date(`${fechaDesde}T00:00:00Z`) : null;
  const rangoFechaHasta = fechaHasta ? new Date(`${fechaHasta}T23:59:59.999Z`) : null;

  const indicesVisibles = semanasReferencia
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.semana >= desdeNum && s.semana <= hastaNum)
    .filter(({ s }) => {
      if (!rangoFechaDesde && !rangoFechaHasta) return true;
      const desde = rangoFechaDesde ?? new Date(s.fechaDesde);
      const hasta = rangoFechaHasta ?? new Date(s.fechaHasta);
      return seSuperponen(new Date(s.fechaDesde), new Date(s.fechaHasta), desde, hasta);
    })
    .map(({ i }) => i);

  const ultimoIndiceVisible = indicesVisibles[indicesVisibles.length - 1];

  const busquedaNormalizada = busqueda.trim().toLowerCase();
  let clientesFiltrados = (
    busquedaNormalizada ? clientes.filter((c) => nombreCliente(c).toLowerCase().includes(busquedaNormalizada)) : clientes
  ).filter((c) => datosPorCliente.has(c.id));

  if (bandasSeleccionadas.size > 0 && ultimoIndiceVisible !== undefined) {
    clientesFiltrados = clientesFiltrados.filter((c) => {
      const banda = datosPorCliente.get(c.id)?.semanas[ultimoIndiceVisible]?.banda;
      return banda !== null && banda !== undefined && bandasSeleccionadas.has(banda);
    });
  }

  if (orden !== "ninguno" && ultimoIndiceVisible !== undefined) {
    const signo = orden === "peor" ? 1 : -1;
    clientesFiltrados = [...clientesFiltrados].sort((a, b) => {
      const pa = datosPorCliente.get(a.id)?.semanas[ultimoIndiceVisible]?.porcentaje;
      const pb = datosPorCliente.get(b.id)?.semanas[ultimoIndiceVisible]?.porcentaje;
      if (pa === null || pa === undefined) return 1;
      if (pb === null || pb === undefined) return -1;
      return (pa - pb) * signo;
    });
  }

  function toggleBanda(banda: BandaCobranza) {
    setBandasSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(banda)) next.delete(banda);
      else next.add(banda);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative max-w-xs">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar cliente..."
            className="pl-9"
          />
        </div>

        <div className="flex items-end gap-1">
          <div className="space-y-1">
            <label className="text-muted-foreground text-xs font-medium">Semana desde</label>
            <Input
              type="number"
              min={1}
              max={totalSemanas}
              value={semanaDesde}
              onChange={(e) => setSemanaDesde(e.target.value)}
              placeholder="1"
              className="w-20"
            />
          </div>
          <div className="space-y-1">
            <label className="text-muted-foreground text-xs font-medium">hasta</label>
            <Input
              type="number"
              min={1}
              max={totalSemanas}
              value={semanaHasta}
              onChange={(e) => setSemanaHasta(e.target.value)}
              placeholder={String(totalSemanas)}
              className="w-20"
            />
          </div>
        </div>

        <div className="flex items-end gap-1">
          <div className="space-y-1">
            <label className="text-muted-foreground text-xs font-medium">Fecha desde</label>
            <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="w-36" />
          </div>
          <div className="space-y-1">
            <label className="text-muted-foreground text-xs font-medium">hasta</label>
            <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="w-36" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-muted-foreground text-xs font-medium">Ordenar por %</label>
          <Select value={orden} onValueChange={(v) => setOrden(v as Orden)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ninguno">Sin ordenar</SelectItem>
              <SelectItem value="peor">Peor primero</SelectItem>
              <SelectItem value="mejor">Mejor primero</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-xs font-medium">Filtrar por banda (última semana visible):</span>
        {BANDA_COBRANZA_ORDEN.map((banda) => {
          const activa = bandasSeleccionadas.has(banda);
          return (
            <button key={banda} type="button" onClick={() => toggleBanda(banda)}>
              <Badge
                variant={activa ? "default" : "outline"}
                className={cn("cursor-pointer", activa && BANDA_COBRANZA_CLASSNAME[banda])}
              >
                {BANDA_COBRANZA_EMOJI[banda]} {BANDA_COBRANZA_LABELS[banda]}
              </Badge>
            </button>
          );
        })}
      </div>

      {clientesFiltrados.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">Sin resultados.</p>
      ) : (
        <div className="max-h-[70vh] overflow-auto rounded-md border">
          <table className="w-full border-separate border-spacing-0 caption-bottom text-xs">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="bg-background sticky top-0 left-0 z-30 min-w-48 align-bottom text-sm">
                  Cliente
                </TableHead>
                {indicesVisibles.map((indiceOriginal) => (
                  <TableHead
                    key={indiceOriginal}
                    colSpan={indiceOriginal === 0 ? 4 : 5}
                    className="bg-muted/90 sticky top-0 z-20 border-l text-center text-sm font-semibold"
                  >
                    SEM {indiceOriginal + 1}
                  </TableHead>
                ))}
              </TableRow>
              <TableRow className="hover:bg-transparent">
                <TableHead className="bg-background sticky top-10 left-0 z-30" />
                {indicesVisibles.map((indiceOriginal) =>
                  indiceOriginal === 0 ? (
                    <SubHeaderSemana1 key={indiceOriginal} />
                  ) : (
                    <SubHeaderSemanaN key={indiceOriginal} />
                  ),
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientesFiltrados.map((cliente) => {
                const semanas = datosPorCliente.get(cliente.id)?.semanas ?? [];
                return (
                  <TableRow key={cliente.id}>
                    <TableCell className="bg-background sticky left-0 z-10 text-sm font-medium whitespace-nowrap">
                      {nombreCliente(cliente)}
                    </TableCell>
                    {indicesVisibles.map((indiceOriginal) => {
                      const s = semanas[indiceOriginal];
                      if (!s) return null;
                      return indiceOriginal === 0 ? (
                        <FilaCeldasSemana1 key={s.semana} semana={s} />
                      ) : (
                        <FilaCeldasSemanaN
                          key={s.semana}
                          semana={s}
                          remanentePrevio={semanas[indiceOriginal - 1]?.remanente ?? 0}
                        />
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </table>
        </div>
      )}
    </div>
  );
}

function SubHeaderSemana1() {
  return (
    <>
      <TableHead className="bg-background sticky top-10 z-20 border-l text-right whitespace-nowrap">
        Vendido
      </TableHead>
      <TableHead className="bg-background sticky top-10 z-20 text-right whitespace-nowrap">Saldo inicial</TableHead>
      <TableHead className="bg-background sticky top-10 z-20 text-right whitespace-nowrap">Cobrado</TableHead>
      <TableHead className="bg-background sticky top-10 z-20 text-center whitespace-nowrap">% Cobr.</TableHead>
    </>
  );
}

function SubHeaderSemanaN() {
  return (
    <>
      <TableHead className="bg-background sticky top-10 z-20 border-l text-right whitespace-nowrap">
        Saldo inicio
      </TableHead>
      <TableHead className="bg-background sticky top-10 z-20 text-right whitespace-nowrap">Remanente</TableHead>
      <TableHead className="bg-background sticky top-10 z-20 text-right whitespace-nowrap">Vendido</TableHead>
      <TableHead className="bg-background sticky top-10 z-20 text-right whitespace-nowrap">Cobrado</TableHead>
      <TableHead className="bg-background sticky top-10 z-20 text-center whitespace-nowrap">% Cobr.</TableHead>
    </>
  );
}

function CeldaPorcentaje({ semana: s }: { semana: SemanaCobranza }) {
  return (
    <TableCell
      title={`Semana ${s.semana} (${fecha(s.fechaDesde)} al ${fecha(s.fechaHasta)})`}
      className={cn(
        "cursor-default text-center font-medium whitespace-nowrap",
        s.banda ? BANDA_COBRANZA_CLASSNAME[s.banda] : SIN_BANDA_CLASSNAME,
      )}
    >
      {formatoPorcentaje(s.porcentaje)}
    </TableCell>
  );
}

/** Semana 1: Vendido, Saldo inicial, Cobrado, % Cobr. — sin remanente previo (no hay semana 0). */
function FilaCeldasSemana1({ semana: s }: { semana: SemanaCobranza }) {
  return (
    <>
      <TableCell className="border-l text-right whitespace-nowrap">{formatoMoneda.format(s.vendido)}</TableCell>
      <TableCell className="text-right whitespace-nowrap">{formatoMoneda.format(s.saldoInicio)}</TableCell>
      <TableCell className="text-right whitespace-nowrap">{formatoMoneda.format(s.cobrado)}</TableCell>
      <CeldaPorcentaje semana={s} />
    </>
  );
}

/**
 * Semana N (N≥2): Saldo con el que inicia SEM (de N), Remanente (de N-1,
 * pasado por el caller), Vendido, Cobrado, % Cobr. — mismo desfasaje que el Excel.
 */
function FilaCeldasSemanaN({ semana: s, remanentePrevio }: { semana: SemanaCobranza; remanentePrevio: number }) {
  return (
    <>
      <TableCell className="border-l text-right whitespace-nowrap">{formatoMoneda.format(s.saldoInicio)}</TableCell>
      <TableCell className="text-right whitespace-nowrap">{formatoMoneda.format(remanentePrevio)}</TableCell>
      <TableCell className="text-right whitespace-nowrap">{formatoMoneda.format(s.vendido)}</TableCell>
      <TableCell className="text-right whitespace-nowrap">{formatoMoneda.format(s.cobrado)}</TableCell>
      <CeldaPorcentaje semana={s} />
    </>
  );
}
