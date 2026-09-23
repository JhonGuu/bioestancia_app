import { useState } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BajaButton, ReactivarButton } from "@/modules/transportes/components/acciones-baja";
import { EstadoSelect } from "@/modules/transportes/components/estado-select";
import { TransportistaDialog } from "@/modules/transportes/components/transportista-dialog";
import { formatearCuit } from "@/modules/transportes/domain/documento-transporte";
import type { EstadoTransporteFiltro, Transportista } from "@/modules/transportes/domain/transporte.types";
import {
  useBajaTransportista,
  useReactivarTransportista,
  useTransportistas,
} from "@/modules/transportes/hooks/use-transporte";

export function TransportistasTab({ puedeEditar }: { puedeEditar: boolean }) {
  const [estado, setEstado] = useState<EstadoTransporteFiltro>("activos");
  const [dialog, setDialog] = useState<{ open: boolean; transportista?: Transportista }>({ open: false });
  const query = useTransportistas(estado);
  const baja = useBajaTransportista();
  const reactivar = useReactivarTransportista();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <EstadoSelect value={estado} onChange={setEstado} />
        {puedeEditar && (
          <Button onClick={() => setDialog({ open: true })}>
            <Plus />
            Nuevo transportista
          </Button>
        )}
      </div>

      <Card>
        <CardContent>
          {query.isPending ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando transportistas...
            </div>
          ) : query.isError ? (
            <p className="text-destructive py-8 text-center text-sm">{query.error.message}</p>
          ) : query.data.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Todavía no hay transportistas cargados.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre / Razón social</TableHead>
                  <TableHead>CUIT</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Estado</TableHead>
                  {puedeEditar && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">
                      <span className="inline-flex items-center gap-2">
                        {t.nombre}
                        {t.esPropio && <Badge variant="outline">Propio</Badge>}
                      </span>
                    </TableCell>
                    <TableCell>{formatearCuit(t.cuit)}</TableCell>
                    <TableCell>{t.telefono ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={t.activo ? "default" : "secondary"}>{t.activo ? "Activo" : "Inactivo"}</Badge>
                    </TableCell>
                    {puedeEditar && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar transportista"
                            onClick={() => setDialog({ open: true, transportista: t })}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          {t.activo ? (
                            <BajaButton
                              entidad="al transportista"
                              nombre={t.nombre}
                              isPending={baja.isPending}
                              onConfirm={() => baja.mutateAsync(t.id)}
                            />
                          ) : (
                            <ReactivarButton
                              entidad="el transportista"
                              isPending={reactivar.isPending}
                              onConfirm={() => reactivar.mutateAsync(t.id)}
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

      <TransportistaDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((actual) => ({ ...actual, open }))}
        transportista={dialog.transportista}
      />
    </div>
  );
}
