import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/modules/auth/context/auth-context";
import { Roles } from "@/modules/auth/domain/auth.types";
import { useClientes } from "@/modules/clientes/hooks/use-clientes";
import { nombreCliente } from "@/modules/clientes/domain/cliente.types";
import { resumirPeriodoAnterior } from "@/modules/planificacion-cabezas/domain/planificacion-cabezas.types";
import { usePlanificacionCabezas } from "@/modules/planificacion-cabezas/hooks/use-planificacion-cabezas";
import { useUpsertPlanificacionCabezas } from "@/modules/planificacion-cabezas/hooks/use-upsert-planificacion-cabezas";
import { PlanificacionCabezasTable } from "@/modules/planificacion-cabezas/components/planificacion-cabezas-table";
import { PlanificacionCabezasResumenMensual } from "@/modules/planificacion-cabezas/components/planificacion-cabezas-resumen-mensual";
import { useStockTropas } from "@/modules/compras/hooks/use-stock-tropas";
import { StockTropasResumenCard } from "@/modules/compras/components/stock-tropas-resumen-card";
import {
  etiquetaPeriodoActual,
  etiquetaRango,
  etiquetaRangoAnterior,
  formatoCorto,
  formatoISO,
  listaDias,
  navegar,
  rangoAnterior,
  rangoDe,
  type Granularidad,
} from "@/modules/planificacion-cabezas/lib/date-range";
import { ApiError } from "@/shared/api/api-response";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/app/planificacion-cabezas/")({
  component: PlanificacionCabezasPage,
});

type Orden = "alfabetico" | "entregas";

const SEMANAS_RANKING = 4;

function PlanificacionCabezasPage() {
  const { empresaActiva } = useAuth();
  const [granularidad, setGranularidad] = useState<Granularidad>("semana");
  const [cursor, setCursor] = useState(() => new Date());
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<Orden>("alfabetico");

  const puedeEditar =
    empresaActiva?.rol === Roles.ADMIN || empresaActiva?.rol === Roles.CONTABLE;

  const rango = useMemo(() => rangoDe(cursor, granularidad), [cursor, granularidad]);
  const rangoAnt = useMemo(
    () => rangoAnterior(cursor, granularidad),
    [cursor, granularidad],
  );
  const dias = useMemo(() => listaDias(rango), [rango]);

  const rangoRanking = useMemo(() => {
    const hasta = rango.hasta;
    const desde = new Date(hasta);
    desde.setDate(desde.getDate() - SEMANAS_RANKING * 7 + 1);
    return { desde, hasta };
  }, [rango]);

  const clientesQuery = useClientes();
  const stockTropasQuery = useStockTropas();
  const filasQuery = usePlanificacionCabezas(formatoISO(rango.desde), formatoISO(rango.hasta));
  const filasAnteriorQuery = usePlanificacionCabezas(
    formatoISO(rangoAnt.desde),
    formatoISO(rangoAnt.hasta),
  );
  const rankingQuery = usePlanificacionCabezas(
    formatoISO(rangoRanking.desde),
    formatoISO(rangoRanking.hasta),
    { enabled: orden === "entregas" },
  );
  const upsertMutation = useUpsertPlanificacionCabezas();

  const periodoAnterior = useMemo(
    () =>
      resumirPeriodoAnterior(filasAnteriorQuery.data ?? [], etiquetaRangoAnterior(granularidad)),
    [filasAnteriorQuery.data, granularidad],
  );

  const entregasRanking = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const fila of rankingQuery.data ?? []) {
      mapa.set(fila.clienteId, (mapa.get(fila.clienteId) ?? 0) + fila.cabezasVendidas);
    }
    return mapa;
  }, [rankingQuery.data]);

  const clientesOrdenados = useMemo(() => {
    const clientes = clientesQuery.data ?? [];
    const filtrados = busqueda.trim()
      ? clientes.filter((cliente) =>
          nombreCliente(cliente).toLowerCase().includes(busqueda.trim().toLowerCase()),
        )
      : clientes;

    return [...filtrados].sort((a, b) => {
      if (orden === "entregas") {
        const diferencia = (entregasRanking.get(b.id) ?? 0) - (entregasRanking.get(a.id) ?? 0);
        if (diferencia !== 0) return diferencia;
      }
      return nombreCliente(a).localeCompare(nombreCliente(b), "es");
    });
  }, [clientesQuery.data, busqueda, orden, entregasRanking]);

  /**
   * Salta del período visible al período de referencia (el que muestra la
   * columna "Semana/Mes pasado") para poder editarlo directamente. En "mes"
   * la vista es de solo lectura, así que además cambia a "semana" — sin eso
   * el botón "Editar" te dejaría en un resumen sin inputs.
   */
  function handleEditarAnterior() {
    if (granularidad === "mes") {
      setGranularidad("semana");
      setCursor((c) => {
        const mesAnterior = new Date(c);
        mesAnterior.setMonth(mesAnterior.getMonth() - 1);
        return mesAnterior;
      });
    } else {
      setCursor((c) => navegar(c, granularidad, -1));
    }
  }

  function handleCommitDia(clienteId: string, fecha: string, cabezasPlanificadas: number) {
    const cliente = clientesQuery.data?.find((c) => c.id === clienteId);
    const nombre = cliente ? nombreCliente(cliente) : "cliente";
    const fechaCorta = formatoCorto(new Date(`${fecha}T00:00:00`));

    upsertMutation.mutate(
      { clienteId, dias: [{ fecha, cabezasPlanificadas }] },
      {
        onSuccess: () => {
          toast.success(`Guardado: ${nombre} · ${fechaCorta} · ${cabezasPlanificadas} cabezas`);
        },
        onError: (error) => {
          const message =
            error instanceof ApiError ? error.message : "No se pudo guardar la planificación";
          toast.error(message);
        },
      },
    );
  }

  const cargando =
    clientesQuery.isPending ||
    filasQuery.isPending ||
    filasAnteriorQuery.isPending ||
    (orden === "entregas" && rankingQuery.isPending);

  const error = clientesQuery.error ?? filasQuery.error ?? filasAnteriorQuery.error;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Planificación de cabezas</h1>
        <p className="text-muted-foreground text-sm">
          Cabezas a entregar por cliente, cruzadas con lo realmente vendido — la base para
          saber cuánto pedirle a los proveedores.
        </p>
      </div>

      {!stockTropasQuery.isPending && !stockTropasQuery.error && (
        <StockTropasResumenCard tropas={stockTropasQuery.data ?? []} />
      )}

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={granularidad}
              onValueChange={(value) => setGranularidad(value as Granularidad)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dia">Día</SelectItem>
                <SelectItem value="semana">Semana</SelectItem>
                <SelectItem value="mes">Mes</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCursor((c) => navegar(c, granularidad, -1))}
                title="Período anterior"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="min-w-48 text-center text-sm font-medium capitalize">
                {etiquetaRango(rango, granularidad)}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCursor((c) => navegar(c, granularidad, 1))}
                title="Período siguiente"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>

            <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>
              Hoy
            </Button>

            <div className="ml-auto flex flex-wrap items-center gap-3">
              <Input
                placeholder="Buscar cliente..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-48"
              />
              <Select value={orden} onValueChange={(value) => setOrden(value as Orden)}>
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alfabetico">Ordenar: alfabético</SelectItem>
                  <SelectItem value="entregas">
                    Ordenar: más cabezas entregadas ({SEMANAS_RANKING} sem.)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!puedeEditar && (
            <p className="text-muted-foreground text-xs">
              Tu rol en esta empresa solo permite ver la planificación, no editarla.
            </p>
          )}

          {granularidad !== "mes" && (
            <p className="text-muted-foreground text-xs">
              La columna resaltada <strong>"Total planificado"</strong> suma en vivo los días de{" "}
              <strong>{etiquetaPeriodoActual(granularidad).toLowerCase()}</strong> (lo que vas
              cargando). La columna <strong>"{etiquetaRangoAnterior(granularidad)}"</strong> es un
              dato histórico ya guardado, de otro período — no se mueve con lo que edités ahora.
            </p>
          )}

          {cargando ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando planificación...
            </div>
          ) : error ? (
            <p className="text-destructive py-8 text-center text-sm">{error.message}</p>
          ) : granularidad === "mes" ? (
            <PlanificacionCabezasResumenMensual
              clientes={clientesOrdenados}
              filas={filasQuery.data ?? []}
              periodoAnterior={periodoAnterior}
              puedeEditar={puedeEditar}
              onEditarAnterior={handleEditarAnterior}
            />
          ) : (
            <PlanificacionCabezasTable
              clientes={clientesOrdenados}
              dias={dias}
              filas={filasQuery.data ?? []}
              periodoAnterior={periodoAnterior}
              etiquetaActual={etiquetaPeriodoActual(granularidad)}
              puedeEditar={puedeEditar}
              onCommitDia={handleCommitDia}
              onEditarAnterior={handleEditarAnterior}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
