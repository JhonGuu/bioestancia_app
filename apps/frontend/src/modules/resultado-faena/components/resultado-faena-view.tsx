import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ResultadoFaenaConCategorias } from "@/modules/resultado-faena/domain/resultado-faena.types";
import { useFrigorificos } from "@/modules/frigorificos/hooks/use-frigorificos";

interface ResultadoFaenaViewProps {
  resultado: ResultadoFaenaConCategorias;
}

/**
 * Vista de solo lectura de un resultado de faena ya cargado. No hay edición
 * todavía — el backend no tiene un use-case de update para este módulo (ver
 * `ResultadoFaenaController`, solo POST/GET).
 */
export function ResultadoFaenaView({ resultado }: ResultadoFaenaViewProps) {
  // "todos" para poder mostrar el nombre aunque el frigorífico haya sido
  // desactivado después de cargar este resultado.
  const frigorificosQuery = useFrigorificos("todos");
  const frigorifico = (frigorificosQuery.data ?? []).find((f) => f.id === resultado.frigorificoId);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resultado de faena</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <Dato label="Frigorífico" valor={frigorifico?.nombre ?? "—"} />
          <Dato
            label="Fecha de faena"
            valor={new Date(resultado.fechaFaena).toLocaleDateString("es-AR", { timeZone: "UTC" })}
          />
          <Dato label="Nº documento" valor={resultado.numero ?? "—"} />
          <Dato label="Nº autorización" valor={resultado.numeroAutorizacion ?? "—"} />
          <Dato label="Kg vivo total" valor={`${resultado.kgVivoTotal} kg`} />
          <Dato label="Kg carne total" valor={`${resultado.kgCarneTotal} kg`} />
          <Dato label="Rendimiento" valor={`${resultado.rendimiento}%`} />
          <Dato
            label="Comisos"
            valor={`${resultado.comisosKg} kg / ${resultado.comisosCabezas} cabezas`}
          />
          {resultado.comentarios && (
            <div className="col-span-3">
              <Dato label="Comentarios" valor={resultado.comentarios} />
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
                  <TableHead className="text-right">Kg vivo faena</TableHead>
                  <TableHead className="text-right">Kg carne</TableHead>
                  <TableHead className="text-right">% magro</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead className="text-right">Cuartos del.</TableHead>
                  <TableHead className="text-right">Cuartos tra.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultado.categorias.map((categoria) => (
                  <TableRow key={categoria.id}>
                    <TableCell className="min-w-40 font-medium whitespace-normal">
                      {categoria.categoria}
                      {categoria.raza ? ` (${categoria.raza})` : ""}
                    </TableCell>
                    <TableCell className="text-right">{categoria.cabezas}</TableCell>
                    <TableCell className="text-right">{categoria.kgVivoFaena ?? "—"}</TableCell>
                    <TableCell className="text-right">{categoria.kgCarne ?? "—"}</TableCell>
                    <TableCell className="text-right">{categoria.porcentajeMagro ?? "—"}</TableCell>
                    <TableCell>{categoria.destinoComercial ?? "—"}</TableCell>
                    <TableCell className="text-right">{categoria.cuartosDelantero ?? "—"}</TableCell>
                    <TableCell className="text-right">{categoria.cuartosTrasero ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Celular: una tarjeta por categoría. */}
          <div className="space-y-3 sm:hidden">
            {resultado.categorias.map((categoria) => (
              <div key={categoria.id} className="rounded-lg border p-3">
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <p className="font-medium">
                    {categoria.categoria}
                    {categoria.raza ? ` (${categoria.raza})` : ""}
                  </p>
                  <p className="text-muted-foreground shrink-0 text-xs">{categoria.cabezas} cabezas</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Dato label="Kg vivo faena" valor={categoria.kgVivoFaena !== null ? `${categoria.kgVivoFaena}` : "—"} />
                  <Dato label="Kg carne" valor={categoria.kgCarne !== null ? `${categoria.kgCarne}` : "—"} />
                  <Dato label="% magro" valor={categoria.porcentajeMagro !== null ? `${categoria.porcentajeMagro}` : "—"} />
                  <Dato label="Destino" valor={categoria.destinoComercial ?? "—"} />
                  <Dato label="Cuartos del." valor={categoria.cuartosDelantero !== null ? `${categoria.cuartosDelantero}` : "—"} />
                  <Dato label="Cuartos tra." valor={categoria.cuartosTrasero !== null ? `${categoria.cuartosTrasero}` : "—"} />
                </div>
              </div>
            ))}
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
