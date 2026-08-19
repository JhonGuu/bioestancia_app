import { useState } from "react";
import { FileCheck2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { LiquidacionCompraConCategorias } from "@/modules/liquidacion-compra/domain/liquidacion-compra.types";
import { useEmitirCaeLiquidacionCompra } from "@/modules/liquidacion-compra/hooks/use-emitir-cae-liquidacion-compra";
import { ApiError } from "@/shared/api/api-response";

interface LiquidacionCompraViewProps {
  liquidacion: LiquidacionCompraConCategorias;
  compraId: string;
  puedeEditar: boolean;
}

/**
 * Vista de solo lectura de una liquidación de compra ya cargada, con botón
 * "Emitir CAE" si todavía no tiene uno asignado. Ese botón puede fallar con
 * un error claro (501) si el ambiente todavía no tiene el certificado AFIP
 * configurado — se muestra tal cual viene del backend, sin reinterpretarlo
 * (ver `apps/backend/src/shared/infra/afip/README.md`).
 */
export function LiquidacionCompraView({ liquidacion, compraId, puedeEditar }: LiquidacionCompraViewProps) {
  const [error, setError] = useState<string | null>(null);
  const emitirCae = useEmitirCaeLiquidacionCompra(compraId);

  function handleEmitirCae() {
    setError(null);
    emitirCae.mutate(undefined, {
      onSuccess: () => toast.success("CAE emitido correctamente"),
      onError: (err) => {
        setError(err instanceof ApiError ? err.message : "No se pudo emitir el CAE");
      },
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Liquidación de compra</CardTitle>
            <Badge variant={liquidacion.cae ? "default" : "secondary"}>
              {liquidacion.cae ? "Con CAE" : "Sin CAE"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <Dato label="Nº de comprobante" valor={liquidacion.numeroComprobante} />
          <Dato
            label="Fecha"
            valor={new Date(liquidacion.fecha).toLocaleDateString("es-AR", { timeZone: "UTC" })}
          />
          <Dato label="CAE" valor={liquidacion.cae ?? "—"} />
          <Dato
            label="Vencimiento CAE"
            valor={
              liquidacion.fechaVencimientoCae
                ? new Date(liquidacion.fechaVencimientoCae).toLocaleDateString("es-AR", { timeZone: "UTC" })
                : "—"
            }
          />
          <Dato label="Importe bruto" valor={`$${liquidacion.importeBruto.toLocaleString("es-AR")}`} />
          <Dato label="IVA sobre bruto" valor={`$${liquidacion.ivaSobreBruto.toLocaleString("es-AR")}`} />
          <Dato label="Importe neto" valor={`$${liquidacion.importeNeto.toLocaleString("es-AR")}`} />
          {liquidacion.comentarios && (
            <div className="col-span-3">
              <Dato label="Comentarios" valor={liquidacion.comentarios} />
            </div>
          )}

          {!liquidacion.cae && puedeEditar && (
            <div className="col-span-3 flex flex-col items-start gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEmitirCae}
                disabled={emitirCae.isPending}
              >
                <FileCheck2 />
                {emitirCae.isPending ? "Emitiendo..." : "Emitir CAE (AFIP)"}
              </Button>
              {error && <p className="text-destructive text-xs">{error}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalle por categoría</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop/tablet: tabla. */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-40">Categoría</TableHead>
                  <TableHead className="text-right">Kg vivo faena</TableHead>
                  <TableHead className="text-right">$/kg</TableHead>
                  <TableHead className="text-right">% IVA</TableHead>
                  <TableHead className="text-right">Importe bruto</TableHead>
                  <TableHead className="text-right">IVA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liquidacion.categorias.map((categoria) => (
                  <TableRow key={categoria.id}>
                    <TableCell className="min-w-40 font-medium whitespace-normal">
                      {categoria.categoria}
                      {categoria.raza ? ` (${categoria.raza})` : ""}
                    </TableCell>
                    <TableCell className="text-right">{categoria.kgVivoFaena ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {categoria.precioKg !== null ? categoria.precioKg.toLocaleString("es-AR") : "—"}
                    </TableCell>
                    <TableCell className="text-right">{categoria.porcentajeIva ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {categoria.importeBruto !== null ? categoria.importeBruto.toLocaleString("es-AR") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {categoria.importeIva !== null ? categoria.importeIva.toLocaleString("es-AR") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={5}>Importe neto</TableCell>
                  <TableCell className="text-right font-medium">
                    ${liquidacion.importeNeto.toLocaleString("es-AR")}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          {/* Celular: una tarjeta por categoría. */}
          <div className="space-y-3 sm:hidden">
            {liquidacion.categorias.map((categoria) => (
              <div key={categoria.id} className="rounded-lg border p-3">
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <p className="font-medium">
                    {categoria.categoria}
                    {categoria.raza ? ` (${categoria.raza})` : ""}
                  </p>
                  <p className="text-muted-foreground shrink-0 text-xs">
                    {categoria.kgVivoFaena ?? "—"} kg vivo
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Dato
                    label="$/kg"
                    valor={categoria.precioKg !== null ? categoria.precioKg.toLocaleString("es-AR") : "—"}
                  />
                  <Dato label="% IVA" valor={categoria.porcentajeIva !== null ? `${categoria.porcentajeIva}` : "—"} />
                  <Dato
                    label="Importe bruto"
                    valor={categoria.importeBruto !== null ? categoria.importeBruto.toLocaleString("es-AR") : "—"}
                  />
                  <Dato
                    label="IVA"
                    valor={categoria.importeIva !== null ? categoria.importeIva.toLocaleString("es-AR") : "—"}
                  />
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg border p-3 text-sm font-medium">
              <span>Importe neto</span>
              <span>${liquidacion.importeNeto.toLocaleString("es-AR")}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-medium">{valor}</p>
    </div>
  );
}
