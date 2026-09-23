import { useState } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BajaButton, ReactivarButton } from "@/modules/transportes/components/acciones-baja";
import { ChoferDialog } from "@/modules/transportes/components/chofer-dialog";
import { EstadoSelect } from "@/modules/transportes/components/estado-select";
import { VencimientoBadge } from "@/modules/transportes/components/vencimiento-badge";
import { formatearCuit } from "@/modules/transportes/domain/documento-transporte";
import {
  nombreChofer,
  type Chofer,
  type EstadoTransporteFiltro,
} from "@/modules/transportes/domain/transporte.types";
import {
  useBajaChofer,
  useChoferes,
  useReactivarChofer,
  useTransportistas,
} from "@/modules/transportes/hooks/use-transporte";

interface ChoferesTabProps {
  puedeEditar: boolean;
  /** Ver DNI y vencimiento de licencia (permiso `ver_datos_choferes`). */
  puedeVerDatosPersonales: boolean;
}

export function ChoferesTab({ puedeEditar, puedeVerDatosPersonales }: ChoferesTabProps) {
  const [estado, setEstado] = useState<EstadoTransporteFiltro>("activos");
  const [dialog, setDialog] = useState<{ open: boolean; chofer?: Chofer }>({ open: false });
  const query = useChoferes(estado);
  // Para mostrar el nombre del transportista de cada chofer (incluye inactivos: un chofer puede seguir apuntando a uno dado de baja).
  const transportistasQuery = useTransportistas("todos");
  const baja = useBajaChofer();
  const reactivar = useReactivarChofer();

  const nombreTransportista = (id: string | null) =>
    id ? (transportistasQuery.data?.find((t) => t.id === id)?.nombre ?? "—") : "—";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <EstadoSelect value={estado} onChange={setEstado} />
        {puedeEditar && (
          <Button onClick={() => setDialog({ open: true })}>
            <Plus />
            Nuevo chofer
          </Button>
        )}
      </div>

      <Card>
        <CardContent>
          {query.isPending ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando choferes...
            </div>
          ) : query.isError ? (
            <p className="text-destructive py-8 text-center text-sm">{query.error.message}</p>
          ) : query.data.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">Todavía no hay choferes cargados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chofer</TableHead>
                  <TableHead>CUIT / CUIL</TableHead>
                  {puedeVerDatosPersonales && <TableHead>DNI</TableHead>}
                  {puedeVerDatosPersonales && <TableHead>Licencia vence</TableHead>}
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Transportista</TableHead>
                  <TableHead>Estado</TableHead>
                  {puedeEditar && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.map((chofer) => (
                  <TableRow key={chofer.id}>
                    <TableCell className="font-medium">{nombreChofer(chofer)}</TableCell>
                    <TableCell>{formatearCuit(chofer.cuit)}</TableCell>
                    {puedeVerDatosPersonales && <TableCell>{chofer.dni ?? "—"}</TableCell>}
                    {puedeVerDatosPersonales && (
                      <TableCell>
                        <VencimientoBadge fecha={chofer.licenciaVencimiento} />
                      </TableCell>
                    )}
                    <TableCell>{chofer.telefono ?? "—"}</TableCell>
                    <TableCell>{nombreTransportista(chofer.transportistaId)}</TableCell>
                    <TableCell>
                      <Badge variant={chofer.activo ? "default" : "secondary"}>
                        {chofer.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    {puedeEditar && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar chofer"
                            onClick={() => setDialog({ open: true, chofer })}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          {chofer.activo ? (
                            <BajaButton
                              entidad="al chofer"
                              nombre={nombreChofer(chofer)}
                              isPending={baja.isPending}
                              onConfirm={() => baja.mutateAsync(chofer.id)}
                            />
                          ) : (
                            <ReactivarButton
                              entidad="el chofer"
                              isPending={reactivar.isPending}
                              onConfirm={() => reactivar.mutateAsync(chofer.id)}
                            />
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ChoferDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((actual) => ({ ...actual, open }))}
        chofer={dialog.chofer}
        puedeVerDatosPersonales={puedeVerDatosPersonales}
      />
    </div>
  );
}
