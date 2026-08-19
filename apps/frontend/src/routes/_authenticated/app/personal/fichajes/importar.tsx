import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";

import { useEmpleados } from "@/modules/empleados/hooks/use-empleados";
import { usePrevisualizarImportacionFichajes } from "@/modules/fichajes/hooks/use-previsualizar-importacion-fichajes";
import { useConfirmarImportacionFichajes } from "@/modules/fichajes/hooks/use-confirmar-importacion-fichajes";
import type {
  AliasDispositivoConfirmar,
  FilaFichajeConfirmar,
  GrupoFichajeSinMatch,
  PreviewImportacionFichajes,
  ResultadoConfirmarImportacion,
} from "@/modules/fichajes/domain/fichaje-import.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/shared/api/api-response";

export const Route = createFileRoute("/_authenticated/app/personal/fichajes/importar")({
  component: ImportarFichajesPage,
});

const OMITIR = "omitir";

interface ResolucionSinMatch {
  /** "" = sin resolver, `OMITIR` = descartar estas marcaciones, o un empleadoId. */
  empleadoId: string;
  guardarAlias: boolean;
}

/**
 * Importación en dos pasos (ver `docs/plan-personal-asistencia.md`, punto 6
 * y `PrevisualizarImportacionFichajes`/`ConfirmarImportacionFichajes` en el
 * backend): primero se analiza el Excel sin escribir nada, después se
 * resuelven a mano los nombres que no matchearon ningún empleado y recién
 * ahí se confirma la inserción.
 */
function ImportarFichajesPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewImportacionFichajes | null>(null);
  const [resoluciones, setResoluciones] = useState<Record<string, ResolucionSinMatch>>({});
  const [resultado, setResultado] = useState<ResultadoConfirmarImportacion | null>(null);

  const empleadosQuery = useEmpleados();
  const previsualizar = usePrevisualizarImportacionFichajes();
  const confirmar = useConfirmarImportacionFichajes();

  function handleAnalizar() {
    if (!archivo) return;
    previsualizar.mutate(archivo, {
      onSuccess: (data) => {
        setPreview(data);
        setResultado(null);
        setResoluciones(
          Object.fromEntries(
            data.sinMatch.map((g) => [g.nombreDispositivo, { empleadoId: "", guardarAlias: true }]),
          ),
        );
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo procesar el archivo");
      },
    });
  }

  function actualizarResolucion(nombreDispositivo: string, cambios: Partial<ResolucionSinMatch>) {
    setResoluciones((prev) => ({
      ...prev,
      [nombreDispositivo]: { ...prev[nombreDispositivo], ...cambios },
    }));
  }

  const faltanResolver = (preview?.sinMatch ?? []).some(
    (g) => !resoluciones[g.nombreDispositivo]?.empleadoId,
  );

  function handleConfirmar() {
    if (!preview) return;

    const filasMatcheadas: FilaFichajeConfirmar[] = preview.matcheadas.map((m) => ({
      empleadoId: m.empleadoId,
      momento: m.momento,
      tipo: m.tipo,
    }));

    const filasResueltas: FilaFichajeConfirmar[] = [];
    const alias: AliasDispositivoConfirmar[] = [];

    for (const grupo of preview.sinMatch) {
      const resolucion = resoluciones[grupo.nombreDispositivo];
      if (!resolucion || !resolucion.empleadoId || resolucion.empleadoId === OMITIR) continue;
      for (const fila of grupo.filas) {
        filasResueltas.push({ empleadoId: resolucion.empleadoId, momento: fila.momento, tipo: fila.tipo });
      }
      if (resolucion.guardarAlias) {
        alias.push({ empleadoId: resolucion.empleadoId, nombreDispositivo: grupo.nombreDispositivo });
      }
    }

    const filas = [...filasMatcheadas, ...filasResueltas];
    if (filas.length === 0) {
      toast.error("No hay ninguna fila para importar");
      return;
    }

    confirmar.mutate(
      { filas, alias: alias.length > 0 ? alias : undefined },
      {
        onSuccess: (data) => {
          setResultado(data);
          toast.success("Importación completada");
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
    setResoluciones({});
    setResultado(null);
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/app/personal">
          <ArrowLeft />
          Personal
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Importar fichajes</h1>
        <p className="text-muted-foreground text-sm">
          Subí el Excel que exporta el lector de huellas. Primero se arma una previsualización — no se
          guarda nada hasta confirmar.
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

          <span className="text-muted-foreground w-full text-xs">
            Podés elegirlo desde este equipo o desde el celular que estés usando — el botón abre el
            explorador de archivos del dispositivo.
          </span>
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
              <Badge>{preview.matcheadas.length} matcheadas</Badge>
              {preview.duplicadosDescartados > 0 && (
                <Badge variant="secondary">{preview.duplicadosDescartados} duplicados descartados</Badge>
              )}
              {preview.filasConError > 0 && (
                <Badge variant="destructive">{preview.filasConError} filas con error</Badge>
              )}
              {preview.sinMatch.length > 0 && (
                <Badge variant="destructive">{preview.sinMatch.length} nombres sin asignar</Badge>
              )}
            </CardContent>
          </Card>

          {preview.sinMatch.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">3. Asignar nombres sin match</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {preview.sinMatch.map((grupo) => (
                  <GrupoSinMatchRow
                    key={grupo.nombreDispositivo}
                    grupo={grupo}
                    resolucion={resoluciones[grupo.nombreDispositivo]}
                    empleados={empleadosQuery.data ?? []}
                    onChange={(cambios) => actualizarResolucion(grupo.nombreDispositivo, cambios)}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          <Button onClick={handleConfirmar} disabled={confirmar.isPending || faltanResolver} className="w-fit">
            {confirmar.isPending ? "Importando..." : "Confirmar importación"}
          </Button>
          {faltanResolver && (
            <p className="text-muted-foreground text-xs">
              Asigná (o marcá "Omitir") todos los nombres sin match antes de confirmar.
            </p>
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
              <Badge>{resultado.importados} fichajes importados</Badge>
              {resultado.omitidosPorDuplicado > 0 && (
                <Badge variant="secondary">{resultado.omitidosPorDuplicado} omitidos por duplicado</Badge>
              )}
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

interface GrupoSinMatchRowProps {
  grupo: GrupoFichajeSinMatch;
  resolucion: ResolucionSinMatch | undefined;
  empleados: { id: string; nombre: string; apellido: string }[];
  onChange: (cambios: Partial<ResolucionSinMatch>) => void;
}

function GrupoSinMatchRow({ grupo, resolucion, empleados, onChange }: GrupoSinMatchRowProps) {
  const valor = resolucion?.empleadoId || "";

  return (
    <div className="grid gap-2 border-b pb-4 last:border-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <p className="text-sm font-medium">"{grupo.nombreDispositivo}"</p>
        <p className="text-muted-foreground text-xs">
          {grupo.cantidad} marcacion{grupo.cantidad === 1 ? "" : "es"} — primera:{" "}
          {new Date(grupo.primerMomento).toLocaleString("es-AR")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={valor} onValueChange={(v) => onChange({ empleadoId: v })}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Elegí un empleado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={OMITIR}>Omitir estas marcaciones</SelectItem>
            {empleados.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.apellido}, {e.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {valor && valor !== OMITIR && (
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={resolucion?.guardarAlias ?? true}
              onChange={(e) => onChange({ guardarAlias: e.target.checked })}
              className="accent-primary size-4"
            />
            Guardar alias
          </label>
        )}
      </div>
    </div>
  );
}
