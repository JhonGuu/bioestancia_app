import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, FileDown, FileSpreadsheet, Loader2 } from "lucide-react";

import { Permisos } from "@/modules/auth/domain/auth.types";
import { useTienePermiso } from "@/modules/auth/hooks/use-tiene-permiso";
import { SinPermiso } from "@/shared/components/sin-permiso";
import { useInformeCobranzas } from "@/modules/informe-cobranzas/hooks/use-informe-cobranzas";
import {
  useDescargarInformeCobranzasExcel,
  useDescargarInformeCobranzasPdf,
} from "@/modules/informe-cobranzas/hooks/use-descargar-informe-cobranzas";
import { InformeCobranzasFiltro } from "@/modules/informe-cobranzas/components/informe-cobranzas-filtro";
import { TotalesPorMedioPagoCards } from "@/modules/informe-cobranzas/components/totales-por-medio-pago-cards";
import { LineasInformeCobranzasTable } from "@/modules/informe-cobranzas/components/lineas-informe-cobranzas-table";
import type { MedioPago } from "@/modules/cobros/domain/cobro.types";
import type { RangoFechas } from "@/shared/lib/rango-fechas";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app/ventas/cobros/informe")({
  component: InformeCobranzasPage,
});

/**
 * Informe de cobranzas: todas las líneas de cobro (efectivo, transferencias,
 * cheques) de TODOS los clientes de la empresa, filtrable por rango de
 * fecha y medio de pago — pensado para controlar que todo lo cobrado esté
 * bien registrado (cruzarlo contra extractos bancarios, arqueo de caja,
 * etc.), a diferencia del resumen de cuenta que es por cliente.
 */
function InformeCobranzasPage() {
  const [rango, setRango] = useState<RangoFechas | null>(null);
  const [medioPago, setMedioPago] = useState<MedioPago | null>(null);

  const filtros = { desde: rango?.desde, hasta: rango?.hasta, medioPago: medioPago ?? undefined };
  const informeQuery = useInformeCobranzas(filtros);
  const descargarPdf = useDescargarInformeCobranzasPdf();
  const descargarExcel = useDescargarInformeCobranzasExcel();
  const tieneAcceso = useTienePermiso(Permisos.VER_INFORME_COBRANZAS);

  if (!tieneAcceso) {
    return <SinPermiso />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Button variant="ghost" size="sm" className="-ml-2" asChild>
            <Link to="/app/ventas/cobros">
              <ArrowLeft className="size-4" />
              Cobros
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Informe de cobranzas</h1>
          <p className="text-muted-foreground text-sm">
            Todas las transferencias, entregas de efectivo y cheques de todos los clientes, para controlar que
            estén todos los movimientos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => descargarPdf.mutate(filtros)} disabled={descargarPdf.isPending}>
            {descargarPdf.isPending ? <Loader2 className="animate-spin" /> : <FileDown />}
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button variant="outline" onClick={() => descargarExcel.mutate(filtros)} disabled={descargarExcel.isPending}>
            {descargarExcel.isPending ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />}
            <span className="hidden sm:inline">Excel</span>
          </Button>
        </div>
      </div>

      {informeQuery.data && (
        <TotalesPorMedioPagoCards
          totales={informeQuery.data.totalesPorMedioPago}
          totalGeneral={informeQuery.data.totalGeneral}
          cantidadLineas={informeQuery.data.lineas.length}
        />
      )}

      <Card>
        <CardContent className="space-y-4">
          <InformeCobranzasFiltro
            rango={rango}
            onChangeRango={setRango}
            medioPago={medioPago}
            onChangeMedioPago={setMedioPago}
            cantidadResultados={informeQuery.data?.lineas.length ?? 0}
          />
          {informeQuery.isPending ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando informe...
            </div>
          ) : informeQuery.error ? (
            <p className="text-destructive py-8 text-center text-sm">{informeQuery.error.message}</p>
          ) : (
            <LineasInformeCobranzasTable lineas={informeQuery.data?.lineas ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
