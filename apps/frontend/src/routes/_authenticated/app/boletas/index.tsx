import { createFileRoute, Link } from "@tanstack/react-router";
import { FileSpreadsheet, FileText, Loader2, Plus, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useBoletas } from "@/modules/boletas/hooks/use-boletas";
import {
  useDescargarReporteDiarioExcel,
  useDescargarReporteDiarioPdf,
} from "@/modules/boletas/hooks/use-descargar-reporte-diario";
import { useClientes } from "@/modules/clientes/hooks/use-clientes";
import { BoletasList } from "@/modules/boletas/components/boletas-list";
import { BoletasFiltro } from "@/modules/boletas/components/boletas-filtro";
import {
  PeriodoFiltro,
  filtrarBoletasPorPeriodo,
  hoyISO,
} from "@/modules/boletas/domain/filtro-periodo";
import { ApiError } from "@/shared/api/api-response";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/boletas/")({
  component: BoletasPage,
});

function BoletasPage() {
  const boletasQuery = useBoletas();
  const clientesQuery = useClientes();
  const descargarReportePdf = useDescargarReporteDiarioPdf();
  const descargarReporteExcel = useDescargarReporteDiarioExcel();

  // Por defecto arranca en "Día" con la fecha de hoy — es el caso de uso más
  // pedido ("las boletas del día"), así la página ya muestra algo útil sin
  // que el usuario tenga que tocar nada.
  const [periodo, setPeriodo] = useState<PeriodoFiltro>(PeriodoFiltro.DIA);
  const [fechaReferencia, setFechaReferencia] = useState(hoyISO());

  // El reporte diario es siempre de UN día — usa `fechaReferencia` sin
  // importar qué "periodo" (día/semana/mes/año) esté eligiendo el filtro.
  const handleExportar = (tipo: "pdf" | "excel") => {
    const mutation = tipo === "pdf" ? descargarReportePdf : descargarReporteExcel;
    mutation.mutate(fechaReferencia, {
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo generar el reporte");
      },
    });
  };

  const cargando = boletasQuery.isPending || clientesQuery.isPending;
  const error = boletasQuery.error ?? clientesQuery.error;

  const boletasFiltradas = filtrarBoletasPorPeriodo(
    boletasQuery.data ?? [],
    periodo,
    fechaReferencia,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Boletas</h1>
          <p className="text-muted-foreground text-sm">
            Comprobantes cargados por cliente/día, con sus ítems entregados.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/app/boletas/importar">
              <Upload />
              <span className="hidden sm:inline">Importar Excel</span>
            </Link>
          </Button>
          <Button asChild size="lg" className="sm:size-default">
            <Link to="/app/boletas/nueva">
              <Plus />
              <span className="hidden sm:inline">Nueva boleta</span>
            </Link>
          </Button>
        </div>
      </div>

      {!cargando && !error && (
        <>
          <BoletasFiltro
            periodo={periodo}
            fechaReferencia={fechaReferencia}
            onChangePeriodo={setPeriodo}
            onChangeFecha={setFechaReferencia}
            cantidadResultados={boletasFiltradas.length}
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-sm">
              Reporte diario del {new Date(fechaReferencia).toLocaleDateString("es-AR", { timeZone: "UTC" })}:
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportar("pdf")}
              disabled={descargarReportePdf.isPending}
            >
              {descargarReportePdf.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <FileText />
              )}
              Exportar PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportar("excel")}
              disabled={descargarReporteExcel.isPending}
            >
              {descargarReporteExcel.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <FileSpreadsheet />
              )}
              Exportar Excel
            </Button>
          </div>
        </>
      )}

      <Card>
        <CardContent>
          {cargando ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando boletas...
            </div>
          ) : error ? (
            <p className="text-destructive py-8 text-center text-sm">{error.message}</p>
          ) : (
            <BoletasList
              boletas={boletasFiltradas}
              clientes={clientesQuery.data ?? []}
              mensajeVacio="No hay boletas para el período elegido."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
