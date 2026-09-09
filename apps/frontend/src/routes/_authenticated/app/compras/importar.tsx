import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown, ChevronRight, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";

import { usePrevisualizarImportacionCompras } from "@/modules/compras/hooks/use-previsualizar-importacion-compras";
import { useConfirmarImportacionCompras } from "@/modules/compras/hooks/use-confirmar-importacion-compras";
import type {
  CompraAImportar,
  PreviewImportacionCompras,
  ResultadoImportacionCompras,
} from "@/modules/compras/domain/importacion-compras.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApiError } from "@/shared/api/api-response";

export const Route = createFileRoute("/_authenticated/app/compras/importar")({
  component: ImportarComprasPage,
});

/**
 * Importación de tropas históricas desde la planilla `ABASTO CERDO`. A
 * diferencia de boletas/cobros, cada fila arma una cadena de 5 documentos
 * (compra + categorías + resultado de faena + liquidación de compra +
 * liquidación de faena) — mismo patrón previsualizar → confirmar, ver
 * `plan-carga-inicial-datos.md` (Etapa 3).
 */
function ImportarComprasPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewImportacionCompras | null>(null);
  const [resultado, setResultado] = useState<ResultadoImportacionCompras | null>(null);
  const [expandidos, setExpandidos] = useState<Set<number>>(new Set());

  const previsualizar = usePrevisualizarImportacionCompras();
  const confirmar = useConfirmarImportacionCompras();

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
    if (!preview || preview.comprasACrear.length === 0) return;
    confirmar.mutate(preview.comprasACrear, {
      onSuccess: (data) => {
        setResultado(data);
        if (data.fallidas === 0) toast.success("Importación completada");
        else toast.warning(`Se importaron ${data.creadas} de ${preview.comprasACrear.length} tropas`);
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
        <Link to="/app/compras/tropas">
          <ArrowLeft />
          Tropas
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Importar compras/tropas históricas</h1>
        <p className="text-muted-foreground text-sm">
          Subí la planilla de compras (hoja "ABASTO CERDO"). Cada fila arma una tropa con su compra,
          categorías de animales, resultado de faena y liquidaciones. Primero se arma una previsualización
          — no se guarda nada hasta confirmar.
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
              <Badge variant="secondary">{preview.filasProcesadas} filas procesadas</Badge>
              <Badge>{preview.comprasACrear.length} tropas listas para crear</Badge>
              {preview.proveedoresNuevos.length > 0 && (
                <Badge variant="outline">
                  {preview.proveedoresNuevos.length} proveedores nuevos (se crean automáticamente)
                </Badge>
              )}
              {preview.frigorificosNuevos.length > 0 && (
                <Badge variant="outline">
                  {preview.frigorificosNuevos.length} frigoríficos nuevos (se crean automáticamente)
                </Badge>
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
                      Fila {error.fila}
                      {error.numeroTropa ? ` (tropa ${error.numeroTropa})` : ""}:
                    </span>{" "}
                    <span className="text-muted-foreground">{error.errores.join(" · ")}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {preview.comprasACrear.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tropas a crear</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[32rem] space-y-2 overflow-y-auto">
                {preview.comprasACrear.map((compra, i) => (
                  <CompraAImportarRow
                    key={i}
                    compra={compra}
                    expandido={expandidos.has(i)}
                    onToggle={() => toggleExpandido(i)}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {preview.comprasACrear.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleConfirmar} disabled={confirmar.isPending} className="w-fit">
                {confirmar.isPending ? "Importando..." : `Confirmar importación (${preview.comprasACrear.length})`}
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
              <Badge>{resultado.creadas} tropas creadas</Badge>
              {resultado.fallidas > 0 && <Badge variant="destructive">{resultado.fallidas} con error</Badge>}
            </div>
            {resultado.detalle.some((d) => !d.ok) && (
              <div className="max-h-80 space-y-1 overflow-y-auto">
                {resultado.detalle
                  .filter((d) => !d.ok)
                  .map((d, i) => (
                    <p key={i} className="text-sm">
                      <span className="font-medium">Tropa {d.numero}:</span>{" "}
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

interface CompraAImportarRowProps {
  compra: CompraAImportar;
  expandido: boolean;
  onToggle: () => void;
}

function CompraAImportarRow({ compra, expandido, onToggle }: CompraAImportarRowProps) {
  const totalCabezas = compra.categorias.reduce((acc, c) => acc + c.cabezas, 0);

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={onToggle}
        className="hover:bg-accent flex w-full flex-wrap items-center justify-between gap-2 p-3 text-left text-sm"
      >
        <div className="flex items-center gap-2">
          {expandido ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          <span className="font-medium">{compra.numero}</span>
          {!compra.proveedorId && (
            <Badge variant="outline" className="text-xs">
              proveedor nuevo
            </Badge>
          )}
          {compra.frigorificoNombre && !compra.frigorificoId && (
            <Badge variant="outline" className="text-xs">
              frigorífico nuevo
            </Badge>
          )}
          <span className="text-muted-foreground">{compra.fecha}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">{totalCabezas} cabezas</span>
          <span className="font-mono text-xs">{compra.pesoNeto.toLocaleString("es-AR")} kg</span>
        </div>
      </button>
      {expandido && (
        <div className="space-y-2 border-t p-3 text-sm">
          <div className="text-muted-foreground grid grid-cols-2 gap-1 sm:grid-cols-3">
            <span>Proveedor: {compra.proveedorNombre}</span>
            <span>Frigorífico: {compra.frigorificoNombre ?? "sin asignar"}</span>
            <span>Fecha faena: {compra.fechaFaena}</span>
            <span>DTE: {compra.dte}</span>
            <span>Remito: {compra.remito}</span>
            <span>Desbaste: {compra.porcentajeDesbaste.toFixed(2)}%</span>
            <span>Precio compra: ${compra.precioCompraKg}/kg</span>
            <span>Kg bruto/neto: {compra.pesoBruto} / {compra.pesoNeto}</span>
            <span>Kg vivo/carne faena: {compra.kgVivoTotalFaena} / {compra.kgCarneTotalFaena}</span>
            <span>Comprobante liquidación: {compra.numeroComprobanteLiquidacion}</span>
            <span>% IVA liquidación: {compra.porcentajeIvaLiquidacion}%</span>
            <span>Canon faena total: ${compra.montoFaenaTotal.toLocaleString("es-AR")}</span>
          </div>
          <div className="space-y-1">
            {compra.categorias.map((cat, indice) => (
              <div key={indice} className="flex items-center justify-between">
                <span>{cat.categoria}</span>
                <span className="font-mono text-xs">{cat.cabezas} cabezas</span>
              </div>
            ))}
          </div>
          {compra.rentabilidadReferenciaExcel && (
            <p className="text-muted-foreground border-t pt-2 text-xs italic">
              {compra.rentabilidadReferenciaExcel}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
