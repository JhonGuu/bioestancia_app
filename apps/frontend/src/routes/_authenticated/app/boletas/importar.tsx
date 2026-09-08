import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown, ChevronRight, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";

import { usePrevisualizarImportacionBoletas } from "@/modules/boletas/hooks/use-previsualizar-importacion-boletas";
import { useConfirmarImportacionBoletas } from "@/modules/boletas/hooks/use-confirmar-importacion-boletas";
import type {
  BoletaAImportar,
  PreviewImportacionBoletas,
  ResultadoImportacionBoletas,
} from "@/modules/boletas/domain/importacion-boletas.types";
import { FORMA_VENTA_LABELS } from "@/modules/ventas/domain/venta.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApiError } from "@/shared/api/api-response";

export const Route = createFileRoute("/_authenticated/app/boletas/importar")({
  component: ImportarBoletasPage,
});

/**
 * Importación de boletas+ventas históricas desde la planilla de cuenta
 * corriente de cada cliente (una hoja por cliente, "Tipo: Venta" agrupadas
 * por día). Mismo patrón previsualizar → confirmar que el resto de los
 * importadores (ver `contabilidad/asientos/importar.tsx`).
 */
function ImportarBoletasPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewImportacionBoletas | null>(null);
  const [resultado, setResultado] = useState<ResultadoImportacionBoletas | null>(null);
  const [expandidos, setExpandidos] = useState<Set<number>>(new Set());

  const previsualizar = usePrevisualizarImportacionBoletas();
  const confirmar = useConfirmarImportacionBoletas();

  function handleAnalizar() {
    if (!archivo) return;
    previsualizar.mutate(archivo, {
      onSuccess: (data) => {
        setPreview(data);
        setResultado(null);
        setExpandidos(new Set());
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo procesar el archivo");
      },
    });
  }

  function handleConfirmar() {
    if (!preview || preview.aCrear.length === 0) return;
    confirmar.mutate(preview.aCrear, {
      onSuccess: (data) => {
        setResultado(data);
        if (data.fallidas === 0) toast.success("Importación completada");
        else toast.warning(`Se importaron ${data.creadas} de ${preview.aCrear.length} boletas`);
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo confirmar la importación");
      },
    });
  }

  function handleReiniciar() {
    setArchivo(null);
    setPreview(null);
    setResultado(null);
  }

  function toggleExpandido(indice: number) {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(indice)) next.delete(indice);
      else next.add(indice);
      return next;
    });
  }

  return (
    <div className="max-w-4xl space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/app/boletas">
          <ArrowLeft />
          Boletas
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Importar boletas históricas</h1>
        <p className="text-muted-foreground text-sm">
          Subí la planilla de cuenta corriente (una hoja por cliente). Las filas "Venta" de cada hoja se
          agrupan por cliente y día en una boleta. Primero se arma una previsualización — no se guarda
          nada hasta confirmar.
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
              <Badge variant="secondary">{preview.totalFilasVenta} filas de venta leídas</Badge>
              <Badge>{preview.aCrear.length} boletas listas para crear</Badge>
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

          {preview.aCrear.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Boletas a crear</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[32rem] space-y-2 overflow-y-auto">
                {preview.aCrear.map((boleta, i) => (
                  <BoletaAImportarRow
                    key={i}
                    boleta={boleta}
                    expandido={expandidos.has(i)}
                    onToggle={() => toggleExpandido(i)}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {preview.aCrear.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleConfirmar} disabled={confirmar.isPending} className="w-fit">
                {confirmar.isPending ? "Importando..." : `Confirmar importación (${preview.aCrear.length})`}
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
              <Badge>{resultado.creadas} boletas creadas</Badge>
              {resultado.fallidas > 0 && <Badge variant="destructive">{resultado.fallidas} con error</Badge>}
            </div>
            {resultado.detalle.some((d) => !d.ok) && (
              <div className="max-h-80 space-y-1 overflow-y-auto">
                {resultado.detalle
                  .filter((d) => !d.ok)
                  .map((d, i) => (
                    <p key={i} className="text-sm">
                      <span className="font-medium">
                        {d.hoja} ({d.fecha}):
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

interface BoletaAImportarRowProps {
  boleta: BoletaAImportar;
  expandido: boolean;
  onToggle: () => void;
}

function BoletaAImportarRow({ boleta, expandido, onToggle }: BoletaAImportarRowProps) {
  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={onToggle}
        className="hover:bg-accent flex w-full flex-wrap items-center justify-between gap-2 p-3 text-left text-sm"
      >
        <div className="flex items-center gap-2">
          {expandido ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          <span className="font-medium">{boleta.hoja}</span>
          {boleta.clienteEsNuevo && (
            <Badge variant="outline" className="text-xs">
              cliente nuevo
            </Badge>
          )}
          <span className="text-muted-foreground">{boleta.fecha}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">{boleta.ventas.length} línea(s)</span>
          <span className="font-mono text-xs">{boleta.totalImporte.toFixed(2)}</span>
        </div>
      </button>
      {expandido && (
        <div className="space-y-1 border-t p-3">
          {boleta.ventas.map((venta, indice) => (
            <div key={indice} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                {FORMA_VENTA_LABELS[venta.formaVenta]}
                {venta.categoria ? ` — ${venta.categoria}` : ""} · {venta.kg} kg
                {venta.observaciones ? ` — ${venta.observaciones}` : ""}
              </span>
              <span className="font-mono text-xs">{venta.precioKg != null ? `$${venta.precioKg}/kg` : "sin precio"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
