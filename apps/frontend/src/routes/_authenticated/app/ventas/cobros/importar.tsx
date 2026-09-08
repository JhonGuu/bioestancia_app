import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";

import { usePrevisualizarImportacionCobros } from "@/modules/cobros/hooks/use-previsualizar-importacion-cobros";
import { useConfirmarImportacionCobros } from "@/modules/cobros/hooks/use-confirmar-importacion-cobros";
import type { PreviewImportacionCobros, ResultadoImportacionCobros } from "@/modules/cobros/domain/importacion-cobros.types";
import { MEDIO_PAGO_LABELS } from "@/modules/cobros/domain/cobro.types";
import { TIPO_CARGO_LABELS } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApiError } from "@/shared/api/api-response";

export const Route = createFileRoute("/_authenticated/app/ventas/cobros/importar")({
  component: ImportarCobrosPage,
});

/**
 * Importación de cobros/cheques/cargos históricos desde la misma planilla de
 * cuenta corriente que boletas ("Tipo: Pago" de cada hoja de cliente). Corre
 * DESPUÉS de importar boletas (ver `boletas/importar.tsx`) — el FIFO
 * necesita las boletas ya cargadas para saber qué está pendiente.
 */
function ImportarCobrosPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewImportacionCobros | null>(null);
  const [resultado, setResultado] = useState<ResultadoImportacionCobros | null>(null);

  const previsualizar = usePrevisualizarImportacionCobros();
  const confirmar = useConfirmarImportacionCobros();

  function handleAnalizar() {
    if (!archivo) return;
    previsualizar.mutate(archivo, {
      onSuccess: (data) => {
        setPreview(data);
        setResultado(null);
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo procesar el archivo");
      },
    });
  }

  function handleConfirmar() {
    if (!preview) return;
    const total = preview.cobrosACrear.length + preview.cargosACrear.length;
    if (total === 0) return;
    confirmar.mutate(
      { cobros: preview.cobrosACrear, cargos: preview.cargosACrear },
      {
        onSuccess: (data) => {
          setResultado(data);
          if (data.fallidos === 0) toast.success("Importación completada");
          else toast.warning(`Se importaron ${data.creados} de ${total} movimientos`);
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : "No se pudo confirmar la importación");
        },
      },
    );
  }

  function handleReiniciar() {
    setArchivo(null);
    setPreview(null);
    setResultado(null);
  }

  const totalAConfirmar = preview ? preview.cobrosACrear.length + preview.cargosACrear.length : 0;

  return (
    <div className="max-w-4xl space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/app/ventas/cobros">
          <ArrowLeft />
          Cobros
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Importar cobros históricos</h1>
        <p className="text-muted-foreground text-sm">
          Subí la misma planilla de cuenta corriente usada para boletas. Las filas "Pago" de cada hoja se
          cargan como cobros o como cargos, según el concepto. Importá primero las boletas de este mismo
          archivo — el sistema necesita saber qué boletas están pendientes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Archivo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <FileSpreadsheet className="size-4" />
            {archivo ? archivo.name : "Ningún archivo elegido"}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".xls,.xlsx,.xlsm"
            className="hidden"
            onChange={(e) => {
              setArchivo(e.target.files?.[0] ?? null);
              setPreview(null);
              setResultado(null);
            }}
          />

          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
            Buscar archivo...
          </Button>

          <Button onClick={handleAnalizar} disabled={!archivo || previsualizar.isPending}>
            <Upload className="size-4" />
            {previsualizar.isPending ? "Analizando..." : "Analizar archivo"}
          </Button>
        </CardContent>
      </Card>

      {preview && !resultado && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">2. Resultado del análisis</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge variant="secondary">{preview.hojasProcesadas.length} hojas de cliente procesadas</Badge>
              <Badge variant="secondary">{preview.totalFilasPago} filas de pago leídas</Badge>
              <Badge>{preview.cobrosACrear.length} cobros listos</Badge>
              <Badge>{preview.cargosACrear.length} cargos listos</Badge>
              {preview.saldosInicialesOmitidos > 0 && (
                <Badge variant="outline">{preview.saldosInicialesOmitidos} "Saldo inicial" omitidos (fuera de alcance)</Badge>
              )}
              {preview.clientesNuevos.length > 0 && (
                <Badge variant="outline">{preview.clientesNuevos.length} clientes nuevos (se crean automáticamente)</Badge>
              )}
              {preview.conError.length > 0 && <Badge variant="destructive">{preview.conError.length} con error</Badge>}
            </CardContent>
          </Card>

          {preview.conError.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive text-base">Filas con error</CardTitle>
              </CardHeader>
              <CardContent className="max-h-80 space-y-2 overflow-y-auto">
                {preview.conError.map((error, i) => (
                  <div key={i} className="border-b pb-2 text-sm last:border-0 last:pb-0">
                    <span className="font-medium">
                      {error.hoja} (fila {error.fila || "—"}):
                    </span>{" "}
                    <span className="text-muted-foreground">{error.errores.join(" · ")}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {preview.cobrosACrear.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cobros a crear</CardTitle>
              </CardHeader>
              <CardContent className="max-h-96 space-y-1 overflow-y-auto">
                {preview.cobrosACrear.map((cobro, i) => (
                  <div key={i} className="flex flex-wrap items-center justify-between gap-2 border-b pb-1 text-sm last:border-0">
                    <span>
                      <span className="font-medium">{cobro.hoja}</span> · {cobro.fecha} ·{" "}
                      {MEDIO_PAGO_LABELS[cobro.medioPago]}
                      {cobro.numeroCheque ? ` (${cobro.numeroCheque})` : ""}
                      {cobro.clienteEsNuevo && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          cliente nuevo
                        </Badge>
                      )}
                    </span>
                    <span className="font-mono text-xs">{cobro.monto.toFixed(2)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {preview.cargosACrear.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cargos a crear</CardTitle>
              </CardHeader>
              <CardContent className="max-h-96 space-y-1 overflow-y-auto">
                {preview.cargosACrear.map((cargo, i) => (
                  <div key={i} className="flex flex-wrap items-center justify-between gap-2 border-b pb-1 text-sm last:border-0">
                    <span>
                      <span className="font-medium">{cargo.hoja}</span> · {cargo.fecha} · {TIPO_CARGO_LABELS[cargo.tipo]}
                      {cargo.motivo ? ` — ${cargo.motivo}` : ""}
                    </span>
                    <span className="font-mono text-xs">{cargo.monto.toFixed(2)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {totalAConfirmar > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleConfirmar} disabled={confirmar.isPending} className="w-fit">
                {confirmar.isPending ? "Importando..." : `Confirmar importación (${totalAConfirmar})`}
              </Button>
            </div>
          )}
        </>
      )}

      {resultado && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Importación completada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>{resultado.creados} movimientos creados</Badge>
              {resultado.fallidos > 0 && <Badge variant="destructive">{resultado.fallidos} con error</Badge>}
            </div>
            {resultado.detalle.some((d) => !d.ok) && (
              <div className="max-h-80 space-y-1 overflow-y-auto">
                {resultado.detalle
                  .filter((d) => !d.ok)
                  .map((d, i) => (
                    <p key={i} className="text-sm">
                      <span className="font-medium">
                        {d.hoja} ({d.fecha}, {d.tipo}):
                      </span>{" "}
                      <span className="text-muted-foreground">{d.error}</span>
                    </p>
                  ))}
              </div>
            )}
            <Button variant="outline" onClick={handleReiniciar}>
              Importar otro archivo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
