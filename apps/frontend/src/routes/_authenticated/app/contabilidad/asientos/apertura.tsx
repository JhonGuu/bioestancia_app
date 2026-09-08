import { useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Permisos } from "@/modules/auth/domain/auth.types";
import { useTienePermiso } from "@/modules/auth/hooks/use-tiene-permiso";
import { SinPermiso } from "@/shared/components/sin-permiso";
import { useEjercicios } from "@/modules/contabilidad/hooks/use-ejercicios";
import { useGenerarApertura } from "@/modules/contabilidad/hooks/use-generar-apertura";
import { usePrevisualizarImportacionSaldos } from "@/modules/contabilidad/hooks/use-previsualizar-importacion-saldos";
import { useDescargarPlantillaImportacion } from "@/modules/contabilidad/hooks/use-descargar-plantilla-importacion";
import { AperturaForm, type SaldoImportadoFormValues } from "@/modules/contabilidad/components/apertura-form";
import { EstadoEjercicio } from "@/modules/contabilidad/domain/ejercicio.types";
import type { AperturaFormValues } from "@/modules/contabilidad/domain/apertura.schemas";
import type { FilaSaldoConError } from "@/modules/contabilidad/domain/importacion.types";
import { ApiError } from "@/shared/api/api-response";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/contabilidad/asientos/apertura")({
  component: AperturaPage,
});

function AperturaPage() {
  const tieneAcceso = useTienePermiso(Permisos.VER_CONTABILIDAD);
  const ejerciciosQuery = useEjercicios();
  const generarApertura = useGenerarApertura();
  const navigate = useNavigate();

  const inputRef = useRef<HTMLInputElement>(null);
  const [importados, setImportados] = useState<{ saldos: SaldoImportadoFormValues[]; nonce: number } | null>(null);
  const [erroresImportacion, setErroresImportacion] = useState<FilaSaldoConError[]>([]);
  const previsualizarSaldos = usePrevisualizarImportacionSaldos();
  const descargarPlantilla = useDescargarPlantillaImportacion();

  if (!tieneAcceso) return <SinPermiso />;

  const ejerciciosAbiertos = (ejerciciosQuery.data ?? []).filter((e) => e.estado === EstadoEjercicio.ABIERTO);

  function handleImportar(archivo: File | undefined) {
    if (!archivo) return;
    previsualizarSaldos.mutate(archivo, {
      onSuccess: (data) => {
        setErroresImportacion(data.conError);
        setImportados({
          nonce: Date.now(),
          saldos: data.aCargar.map((s) => ({
            cuentaId: s.cuentaId,
            importe: String(s.importe),
            auxiliarId: s.auxiliarId ?? "",
            detalle: s.detalle ?? "",
          })),
        });
        if (data.aCargar.length === 0) {
          toast.error("No se pudo resolver ningún saldo del archivo — revisá los errores");
        } else {
          toast.success(`Se cargaron ${data.aCargar.length} saldos en el formulario — revisalos antes de generar`);
        }
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo procesar el archivo");
      },
    });
  }

  async function handleSubmit(values: AperturaFormValues, confirmar: boolean) {
    try {
      const asiento = await generarApertura.mutateAsync({
        ejercicioId: values.ejercicioId,
        fecha: values.fecha || undefined,
        descripcion: values.descripcion || undefined,
        cuentaAjusteId: values.cuentaAjusteId || undefined,
        confirmar,
        saldos: values.saldos.map((s) => ({
          cuentaId: s.cuentaId,
          importe: s.importe,
          auxiliarId: s.auxiliarId || undefined,
          detalle: s.detalle || undefined,
        })),
      });
      toast.success(confirmar ? `Asiento de apertura confirmado con el N° ${asiento.numero}` : "Borrador de apertura generado — revisalo antes de confirmarlo");
      await navigate({ to: "/app/contabilidad/asientos/$asientoId", params: { asientoId: asiento.id } });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudo generar el asiento de apertura");
    }
  }

  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link to="/app/contabilidad/asientos">
            <ArrowLeft className="size-4" />
            Asientos
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Generador de asiento de apertura</h1>
        <p className="text-muted-foreground text-sm">
          Cargá cuánto tiene cada cuenta (con signo) — el sistema decide de qué lado va según su naturaleza.
          El otro camino sigue estando: cargar el asiento de apertura a mano desde "Nuevo asiento".
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Importar saldos desde Excel (opcional)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept=".xls,.xlsx"
            className="hidden"
            onChange={(e) => {
              handleImportar(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={previsualizarSaldos.isPending}>
            <Upload className="size-4" />
            {previsualizarSaldos.isPending ? "Analizando..." : "Elegir archivo e importar"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => descargarPlantilla.mutate("saldos-iniciales")}
            disabled={descargarPlantilla.isPending}
          >
            <Download className="size-4" />
            Descargar plantilla
          </Button>
          {importados && (
            <span className="text-muted-foreground flex items-center gap-2 text-xs">
              <FileSpreadsheet className="size-4" />
              {importados.saldos.length} saldos cargados en el formulario de abajo
            </span>
          )}
        </CardContent>
        {erroresImportacion.length > 0 && (
          <CardContent className="border-t pt-3">
            <p className="text-destructive mb-2 text-sm font-medium">
              <Badge variant="destructive" className="mr-2">
                {erroresImportacion.length}
              </Badge>
              filas del Excel no se pudieron cargar
            </p>
            <div className="space-y-1">
              {erroresImportacion.map((fila) => (
                <p key={`${fila.fila}-${fila.codigoCuenta}`} className="text-muted-foreground text-xs">
                  Fila {fila.fila} ({fila.codigoCuenta}): {fila.errores.join(" · ")}
                </p>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saldos</CardTitle>
        </CardHeader>
        <CardContent>
          {ejerciciosQuery.isPending ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando ejercicios...
            </div>
          ) : ejerciciosAbiertos.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No hay ningún ejercicio abierto — creá uno primero en "Ejercicios y períodos".
            </p>
          ) : (
            <AperturaForm
              ejerciciosAbiertos={ejerciciosAbiertos}
              onSubmit={handleSubmit}
              isSubmitting={generarApertura.isPending}
              saldosImportados={importados}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
