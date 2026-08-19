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
import type { LiquidacionFaenaConCategorias } from "@/modules/liquidacion-faena/domain/liquidacion-faena.types";
import { useFrigorificos } from "@/modules/frigorificos/hooks/use-frigorificos";

interface LiquidacionFaenaViewProps {
  liquidacion: LiquidacionFaenaConCategorias;
}

/**
 * Vista de solo lectura de una liquidación de faena ya cargada. No hay
 * edición todavía — el backend no tiene un use-case de update para este
 * módulo (ver `LiquidacionFaenaController`, solo POST/GET).
 */
export function LiquidacionFaenaView({ liquidacion }: LiquidacionFaenaViewProps) {
  const frigorificosQuery = useFrigorificos("todos");
  const frigorifico = (frigorificosQuery.data ?? []).find((f) => f.id === liquidacion.frigorificoId);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Liquidación de faena</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <Dato label="Frigorífico" valor={frigorifico?.nombre ?? "—"} />
          <Dato
            label="Fecha"
            valor={new Date(liquidacion.fecha).toLocaleDateString("es-AR", { timeZone: "UTC" })}
          />
          <Dato label="Total" valor={`$${liquidacion.total.toLocaleString("es-AR")}`} />
          {liquidacion.comentarios && (
            <div className="col-span-3">
              <Dato label="Comentarios" valor={liquidacion.comentarios} />
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
                  <TableHead className="text-right">Cabezas</TableHead>
                  <TableHead className="text-right">$/animal</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liquidacion.categorias.map((categoria) => (
                  <TableRow key={categoria.id}>
                    <TableCell className="min-w-40 font-medium whitespace-normal">
                      {categoria.categoria}
                      {categoria.raza ? ` (${categoria.raza})` : ""}
                    </TableCell>
                    <TableCell className="text-right">{categoria.cabezas}</TableCell>
                    <TableCell className="text-right">
                      {categoria.canonFaenaPorAnimal !== null
                        ? categoria.canonFaenaPorAnimal.toLocaleString("es-AR")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {categoria.canonFaenaSubtotal !== null
                        ? categoria.canonFaenaSubtotal.toLocaleString("es-AR")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3}>Total</TableCell>
                  <TableCell className="text-right font-medium">
                    ${liquidacion.total.toLocaleString("es-AR")}
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
                  <p className="text-muted-foreground shrink-0 text-xs">{categoria.cabezas} cabezas</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Dato
                    label="$/animal"
                    valor={
                      categoria.canonFaenaPorAnimal !== null
                        ? categoria.canonFaenaPorAnimal.toLocaleString("es-AR")
                        : "—"
                    }
                  />
                  <Dato
                    label="Subtotal"
                    valor={
                      categoria.canonFaenaSubtotal !== null
                        ? categoria.canonFaenaSubtotal.toLocaleString("es-AR")
                        : "—"
                    }
                  />
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg border p-3 text-sm font-medium">
              <span>Total</span>
              <span>${liquidacion.total.toLocaleString("es-AR")}</span>
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
