import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";

import { usePrevisualizarImportacionPlanCuentas } from "@/modules/contabilidad/hooks/use-previsualizar-importacion-plan-cuentas";
import { useConfirmarImportacionPlanCuentas } from "@/modules/contabilidad/hooks/use-confirmar-importacion-plan-cuentas";
import { useDescargarPlantillaImportacion } from "@/modules/contabilidad/hooks/use-descargar-plantilla-importacion";
import type {
  PreviewImportacionPlanCuentas,
  ResultadoImportacionPlanCuentas,
} from "@/modules/contabilidad/domain/importacion.types";
import { TIPO_CUENTA_LABELS } from "@/modules/contabilidad/domain/tipo-cuenta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/shared/api/api-response";

export const Route = createFileRoute("/_authenticated/app/contabilidad/plan-cuentas/importar")({
  component: ImportarPlanCuentasPage,
});

/**
 * Importación en dos pasos, mismo criterio que `personal/fichajes/importar.tsx`:
 * primero se analiza el Excel sin escribir nada, después se confirma. Acá
 * no hace falta resolución manual — las filas con problema quedan afuera y
 * se resuelven editando el Excel y volviendo a subirlo.
 */
function ImportarPlanCuentasPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewImportacionPlanCuentas | null>(null);
  const [resultado, setResultado] = useState<ResultadoImportacionPlanCuentas | null>(null);

  const previsualizar = usePrevisualizarImportacionPlanCuentas();
  const confirmar = useConfirmarImportacionPlanCuentas();
  const descargarPlantilla = useDescargarPlantillaImportacion();

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
    if (!preview || preview.aCrear.length === 0) return;
    confirmar.mutate(preview.aCrear, {
      onSuccess: (data) => {
        setResultado(data);
        toast.success("Importación completada");
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

  return (
    <div className="max-w-4xl space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/app/contabilidad/plan-cuentas">
          <ArrowLeft />
          Plan de cuentas
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Importar plan de cuentas</h1>
        <p className="text-muted-foreground text-sm">
          Subí un Excel con las cuentas a crear. Primero se arma una previsualización — no se guarda nada
          hasta confirmar.
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
            onClick={() => descargarPlantilla.mutate("plan-cuentas")}
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
              <Badge>{preview.aCrear.length} cuentas para crear</Badge>
              {preview.yaExistentes.length > 0 && (
                <Badge variant="secondary">{preview.yaExistentes.length} ya existentes (se saltean)</Badge>
              )}
              {preview.conError.length > 0 && <Badge variant="destructive">{preview.conError.length} con error</Badge>}
            </CardContent>
          </Card>

          {preview.aCrear.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cuentas a crear</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fila</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Padre</TableHead>
                      <TableHead>Imputable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.aCrear.map((cuenta) => (
                      <TableRow key={cuenta.fila}>
                        <TableCell className="text-muted-foreground">{cuenta.fila}</TableCell>
                        <TableCell className="font-mono text-xs">{cuenta.codigo}</TableCell>
                        <TableCell>{cuenta.nombre}</TableCell>
                        <TableCell>{TIPO_CUENTA_LABELS[cuenta.tipo]}</TableCell>
                        <TableCell className="font-mono text-xs">{cuenta.codigoPadre ?? "—"}</TableCell>
                        <TableCell>{cuenta.imputable ? "Sí" : "No"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {preview.conError.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive text-base">Filas con error</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {preview.conError.map((fila) => (
                  <div key={`${fila.fila}-${fila.codigo}`} className="border-b pb-2 text-sm last:border-0 last:pb-0">
                    <span className="font-medium">
                      Fila {fila.fila} ({fila.codigo}):
                    </span>{" "}
                    <span className="text-muted-foreground">{fila.errores.join(" · ")}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Button onClick={handleConfirmar} disabled={confirmar.isPending || preview.aCrear.length === 0} className="w-fit">
            {confirmar.isPending ? "Importando..." : `Confirmar importación (${preview.aCrear.length})`}
          </Button>
        </>
      )}

      {resultado && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Importación completada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>{resultado.creadas} cuentas creadas</Badge>
              {resultado.omitidas > 0 && <Badge variant="secondary">{resultado.omitidas} omitidas</Badge>}
            </div>
            <Button variant="outline" onClick={handleReiniciar}>
              Importar otro archivo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
