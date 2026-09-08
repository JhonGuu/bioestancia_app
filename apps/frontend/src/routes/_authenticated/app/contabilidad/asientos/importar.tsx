import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown, ChevronRight, Download, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";

import { usePrevisualizarImportacionAsientos } from "@/modules/contabilidad/hooks/use-previsualizar-importacion-asientos";
import { useConfirmarImportacionAsientos } from "@/modules/contabilidad/hooks/use-confirmar-importacion-asientos";
import { useDescargarPlantillaImportacion } from "@/modules/contabilidad/hooks/use-descargar-plantilla-importacion";
import { usePlanCuentas } from "@/modules/contabilidad/hooks/use-plan-cuentas";
import { aplanarArbol } from "@/modules/contabilidad/domain/cuenta.types";
import type {
  AsientoAImportar,
  PreviewImportacionAsientos,
  ResultadoImportacionAsientos,
} from "@/modules/contabilidad/domain/importacion.types";
import { TIPO_ASIENTO_LABELS, RESPALDO_LABELS } from "@/modules/contabilidad/domain/asiento.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApiError } from "@/shared/api/api-response";

export const Route = createFileRoute("/_authenticated/app/contabilidad/asientos/importar")({
  component: ImportarAsientosPage,
});

/**
 * Importación en dos pasos: el Excel se agrupa por la columna "Asiento" en
 * el backend (`PrevisualizarImportacionAsientos`) y cada grupo llega acá ya
 * armado y validado con las MISMAS reglas que la carga manual
 * (`validarLineasAsiento`) — si pasó la previsualización, `CrearAsiento` lo
 * va a aceptar sin sorpresas al confirmar.
 */
function ImportarAsientosPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewImportacionAsientos | null>(null);
  const [resultado, setResultado] = useState<ResultadoImportacionAsientos | null>(null);
  const [confirmarFirme, setConfirmarFirme] = useState(false);
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  const planCuentasQuery = usePlanCuentas();
  const cuentasPorId = new Map((planCuentasQuery.data ? aplanarArbol(planCuentasQuery.data.arbol) : []).map((c) => [c.id, c]));

  const previsualizar = usePrevisualizarImportacionAsientos();
  const confirmar = useConfirmarImportacionAsientos();
  const descargarPlantilla = useDescargarPlantillaImportacion();

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
    confirmar.mutate(
      { asientos: preview.aCrear, confirmar: confirmarFirme },
      {
        onSuccess: (data) => {
          setResultado(data);
          if (data.fallidos === 0) toast.success("Importación completada");
          else toast.warning(`Se importaron ${data.creados} de ${preview.aCrear.length} asientos`);
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

  function toggleExpandido(clave: string) {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(clave)) next.delete(clave);
      else next.add(clave);
      return next;
    });
  }

  return (
    <div className="max-w-4xl space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/app/contabilidad/asientos">
          <ArrowLeft />
          Asientos
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Importar asientos</h1>
        <p className="text-muted-foreground text-sm">
          Subí un Excel con las líneas de los asientos, agrupadas por la columna "Asiento". Primero se
          arma una previsualización — no se guarda nada hasta confirmar.
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
            accept=".xls,.xlsx"
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

          <Button
            type="button"
            variant="ghost"
            onClick={() => descargarPlantilla.mutate("asientos")}
            disabled={descargarPlantilla.isPending}
          >
            <Download className="size-4" />
            Descargar plantilla
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
              <Badge variant="secondary">{preview.totalFilas} filas leídas</Badge>
              <Badge variant="secondary">{preview.totalAsientos} asientos detectados</Badge>
              <Badge>{preview.aCrear.length} listos para crear</Badge>
              {preview.conError.length > 0 && <Badge variant="destructive">{preview.conError.length} con error</Badge>}
            </CardContent>
          </Card>

          {preview.aCrear.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Asientos a crear</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {preview.aCrear.map((asiento) => (
                  <AsientoAImportarRow
                    key={asiento.claveOriginal}
                    asiento={asiento}
                    expandido={expandidos.has(asiento.claveOriginal)}
                    onToggle={() => toggleExpandido(asiento.claveOriginal)}
                    cuentasPorId={cuentasPorId}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {preview.conError.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive text-base">Asientos con error</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {preview.conError.map((asiento) => (
                  <div key={asiento.claveOriginal} className="border-b pb-2 text-sm last:border-0 last:pb-0">
                    <span className="font-medium">
                      Asiento "{asiento.claveOriginal}" (filas {asiento.filas.join(", ")}):
                    </span>{" "}
                    <span className="text-muted-foreground">{asiento.errores.join(" · ")}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {preview.aCrear.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={confirmarFirme}
                  onChange={(e) => setConfirmarFirme(e.target.checked)}
                  className="accent-primary size-4"
                />
                Confirmar como asientos firmes (numerados) en vez de borradores
              </label>
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
              <Badge>{resultado.creados} asientos creados</Badge>
              {resultado.fallidos > 0 && <Badge variant="destructive">{resultado.fallidos} con error</Badge>}
            </div>
            {resultado.detalle.some((d) => !d.ok) && (
              <div className="space-y-1">
                {resultado.detalle
                  .filter((d) => !d.ok)
                  .map((d) => (
                    <p key={d.claveOriginal} className="text-sm">
                      <span className="font-medium">Asiento "{d.claveOriginal}":</span>{" "}
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

interface AsientoAImportarRowProps {
  asiento: AsientoAImportar;
  expandido: boolean;
  onToggle: () => void;
  cuentasPorId: Map<string, { codigo: string; nombre: string }>;
}

function AsientoAImportarRow({ asiento, expandido, onToggle, cuentasPorId }: AsientoAImportarRowProps) {
  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={onToggle}
        className="hover:bg-accent flex w-full flex-wrap items-center justify-between gap-2 p-3 text-left text-sm"
      >
        <div className="flex items-center gap-2">
          {expandido ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          <span className="font-medium">{asiento.claveOriginal}</span>
          <span className="text-muted-foreground">{asiento.fecha}</span>
          <span>{asiento.descripcion}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{TIPO_ASIENTO_LABELS[asiento.tipo]}</Badge>
          <Badge variant="outline">{RESPALDO_LABELS[asiento.respaldo]}</Badge>
          <span className="text-muted-foreground font-mono text-xs">{asiento.totalDebe.toFixed(2)}</span>
        </div>
      </button>
      {expandido && (
        <div className="space-y-1 border-t p-3">
          {asiento.lineas.map((linea, indice) => {
            const cuenta = cuentasPorId.get(linea.cuentaId);
            return (
              <div key={indice} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  {cuenta ? `${cuenta.codigo} ${cuenta.nombre}` : linea.cuentaId}
                  {linea.detalle ? ` — ${linea.detalle}` : ""}
                </span>
                <span className="font-mono text-xs">
                  {linea.debe > 0 ? `Debe ${linea.debe.toFixed(2)}` : `Haber ${linea.haber.toFixed(2)}`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
