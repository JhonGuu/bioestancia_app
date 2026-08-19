import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { BloqueCabezasCategoria, GrupoCabezas } from "@/modules/cabezas/domain/cabezas.types";

interface BloqueCabezasTableProps {
  bloque: BloqueCabezasCategoria;
}

/** CAPON acá es "todo lo que no sea Chancha" (Capón, MEI, Cachorra, ...) — ver comentario en el dominio. */
const ETIQUETA_GRUPO: Record<GrupoCabezas, string> = {
  CAPON: "Capón",
  CHANCHA: "Chancha",
};

const formatoMoneda = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const formatoKg = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });
const formatoCabezas = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });

function precio(valor: number | null): string {
  return valor === null ? "—" : formatoMoneda.format(valor);
}

/**
 * Grilla semanal de UNA categoría (Capón o Chancha): un cliente por fila, con
 * lo planificado (`cantEstimada`, viene de Planificación de cabezas — NO
 * distingue categoría, ver comentario del dominio) contra lo efectivamente
 * vendido (`cantReal`/kg/$) de ESA categoría puntual, más precio promedio y
 * mínimo de la semana arriba de la tabla — mismo dato que la hoja "CABEZAS"
 * de la planilla Excel histórica del negocio.
 */
export function BloqueCabezasTable({ bloque }: BloqueCabezasTableProps) {
  const etiqueta = ETIQUETA_GRUPO[bloque.grupo] ?? bloque.grupo;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{etiqueta}</CardTitle>
        <CardDescription>
          {formatoCabezas.format(bloque.totalCabezas)} cabezas · {formatoKg.format(bloque.totalKg)} kg · $ prom{" "}
          {precio(bloque.precioPromedio)} · $ mín {precio(bloque.precioMinimo)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {bloque.lineas.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            Sin planificación ni ventas de {etiqueta.toLowerCase()} en esta semana.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Cant. estimada</TableHead>
                  <TableHead className="text-right">Cant. real</TableHead>
                  <TableHead className="text-right">$ vendido</TableHead>
                  <TableHead className="text-right">Kg</TableHead>
                  <TableHead className="text-right">$ Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bloque.lineas.map((linea) => (
                  <TableRow key={linea.clienteId}>
                    <TableCell className="font-medium">{linea.clienteNombre}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {formatoCabezas.format(linea.cantEstimada)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {formatoCabezas.format(linea.cantReal)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">{precio(linea.precioPromedio)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{formatoKg.format(linea.kg)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {formatoMoneda.format(linea.montoTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell className="text-right font-semibold whitespace-nowrap">
                    {formatoCabezas.format(bloque.lineas.reduce((acc, l) => acc + l.cantEstimada, 0))}
                  </TableCell>
                  <TableCell className="text-right font-semibold whitespace-nowrap">
                    {formatoCabezas.format(bloque.totalCabezas)}
                  </TableCell>
                  <TableCell className="text-right font-semibold whitespace-nowrap">
                    {precio(bloque.precioPromedio)}
                  </TableCell>
                  <TableCell className="text-right font-semibold whitespace-nowrap">
                    {formatoKg.format(bloque.totalKg)}
                  </TableCell>
                  <TableCell className="text-right font-semibold whitespace-nowrap">
                    {formatoMoneda.format(bloque.totalMonto)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
