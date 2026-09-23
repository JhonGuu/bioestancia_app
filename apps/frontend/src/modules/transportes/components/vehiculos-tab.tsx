import { useState } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BajaButton, ReactivarButton } from "@/modules/transportes/components/acciones-baja";
import { EstadoSelect } from "@/modules/transportes/components/estado-select";
import { VehiculoDialog } from "@/modules/transportes/components/vehiculo-dialog";
import { VencimientoBadge } from "@/modules/transportes/components/vencimiento-badge";
import {
  TIPO_VEHICULO_LABELS,
  type EstadoTransporteFiltro,
  type Vehiculo,
} from "@/modules/transportes/domain/transporte.types";
import {
  useBajaVehiculo,
  useReactivarVehiculo,
  useTransportistas,
  useVehiculos,
} from "@/modules/transportes/hooks/use-transporte";

export function VehiculosTab({ puedeEditar }: { puedeEditar: boolean }) {
  const [estado, setEstado] = useState<EstadoTransporteFiltro>("activos");
  const [dialog, setDialog] = useState<{ open: boolean; vehiculo?: Vehiculo }>({ open: false });
  const query = useVehiculos(estado);
  const transportistasQuery = useTransportistas("todos");
  const baja = useBajaVehiculo();
  const reactivar = useReactivarVehiculo();

  const nombreTransportista = (id: string | null) =>
    id ? (transportistasQuery.data?.find((t) => t.id === id)?.nombre ?? "—") : "—";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <EstadoSelect value={estado} onChange={setEstado} />
        {puedeEditar && (
          <Button onClick={() => setDialog({ open: true })}>
            <Plus />
            Nuevo vehículo
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="overflow-x-auto">
          {query.isPending ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando vehículos...
            </div>
          ) : query.isError ? (
            <p className="text-destructive py-8 text-center text-sm">{query.error.message}</p>
          ) : query.data.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">Todavía no hay vehículos cargados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Transportista</TableHead>
                  <TableHead>RTO</TableHead>
                  <TableHead>Seguro</TableHead>
                  <TableHead>Hab. animales</TableHead>
                  <TableHead>Estado</TableHead>
                  {puedeEditar && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.patente}</TableCell>
                    <TableCell>{TIPO_VEHICULO_LABELS[v.tipo]}</TableCell>
                    <TableCell>{v.descripcion ?? "—"}</TableCell>
                    <TableCell>{nombreTransportista(v.transportistaId)}</TableCell>
                    <TableCell>
                      <VencimientoBadge fecha={v.rtoVencimiento} />
                    </TableCell>
                    <TableCell>
                      <VencimientoBadge fecha={v.seguroVencimiento} />
                    </TableCell>
                    <TableCell>
                      <VencimientoBadge fecha={v.habilitacionAnimalesVencimiento} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={v.activo ? "default" : "secondary"}>{v.activo ? "Activo" : "Inactivo"}</Badge>
                    </TableCell>
                    {puedeEditar && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar vehículo"
                            onClick={() => setDialog({ open: true, vehiculo: v })}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          {v.activo ? (
                            <BajaButton
                              entidad="al vehículo"
                              nombre={v.patente}
                              isPending={baja.isPending}
                              onConfirm={() => baja.mutateAsync(v.id)}
                            />
                          ) : (
                            <ReactivarButton
                              entidad="el vehículo"
                              isPending={reactivar.isPending}
                              onConfirm={() => reactivar.mutateAsync(v.id)}
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

      <VehiculoDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((actual) => ({ ...actual, open }))}
        vehiculo={dialog.vehiculo}
      />
    </div>
  );
}
