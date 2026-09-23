import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/shared/api/api-response";
import { formatearCuit } from "@/modules/transportes/domain/documento-transporte";
import {
  nombreChofer,
  TIPO_VEHICULO_LABELS,
  type Chofer,
  type Vehiculo,
} from "@/modules/transportes/domain/transporte.types";
import {
  useChoferes,
  useGuardarTransporteCliente,
  useTransporteCliente,
  useVehiculos,
} from "@/modules/transportes/hooks/use-transporte";

interface TransporteClienteCardProps {
  clienteId: string;
  /** Admin o contable pueden cambiar la lista; el resto solo la ve. */
  puedeEditar: boolean;
}

/**
 * Choferes y vehículos autorizados a retirar mercadería de este cliente. Sirve
 * para controlar que a quien se despacha es quien corresponde: más adelante el
 * remito avisa si eligen a alguien que no está en esta lista.
 */
export function TransporteClienteCard({ clienteId, puedeEditar }: TransporteClienteCardProps) {
  const autorizadosQuery = useTransporteCliente(clienteId);
  const choferesQuery = useChoferes("activos");
  const vehiculosQuery = useVehiculos("activos");

  const cargando = autorizadosQuery.isPending || choferesQuery.isPending || vehiculosQuery.isPending;
  const error = autorizadosQuery.error ?? choferesQuery.error ?? vehiculosQuery.error;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Transporte autorizado</CardTitle>
        <CardDescription>
          Choferes y vehículos que pueden retirar mercadería de este cliente. Se cargan en{" "}
          <Link to="/app/transporte" className="underline">
            Transporte
          </Link>
          .
        </CardDescription>
      </CardHeader>
      <CardContent>
        {cargando ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-4 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Cargando...
          </div>
        ) : error ? (
          <p className="text-destructive py-4 text-center text-sm">{error.message}</p>
        ) : (
          <TransporteClienteForm
            clienteId={clienteId}
            choferes={choferesQuery.data ?? []}
            vehiculos={vehiculosQuery.data ?? []}
            choferIdsIniciales={autorizadosQuery.data?.choferes.map((c) => c.id) ?? []}
            vehiculoIdsIniciales={autorizadosQuery.data?.vehiculos.map((v) => v.id) ?? []}
            puedeEditar={puedeEditar}
          />
        )}
      </CardContent>
    </Card>
  );
}

interface FormProps {
  clienteId: string;
  choferes: Chofer[];
  vehiculos: Vehiculo[];
  choferIdsIniciales: string[];
  vehiculoIdsIniciales: string[];
  puedeEditar: boolean;
}

function TransporteClienteForm({
  clienteId,
  choferes,
  vehiculos,
  choferIdsIniciales,
  vehiculoIdsIniciales,
  puedeEditar,
}: FormProps) {
  const [choferIds, setChoferIds] = useState<Set<string>>(new Set(choferIdsIniciales));
  const [vehiculoIds, setVehiculoIds] = useState<Set<string>>(new Set(vehiculoIdsIniciales));
  const guardar = useGuardarTransporteCliente(clienteId);

  function alternar(set: Set<string>, id: string): Set<string> {
    const nuevo = new Set(set);
    if (nuevo.has(id)) nuevo.delete(id);
    else nuevo.add(id);
    return nuevo;
  }

  async function handleGuardar() {
    try {
      await guardar.mutateAsync({ choferIds: [...choferIds], vehiculoIds: [...vehiculoIds] });
      toast.success("Transporte autorizado actualizado");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudo guardar el transporte autorizado");
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-6 md:grid-cols-2">
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium">Choferes</legend>
          {choferes.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay choferes cargados todavía.</p>
          ) : (
            choferes.map((chofer) => (
              <label key={chofer.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={choferIds.has(chofer.id)}
                  disabled={!puedeEditar}
                  onChange={() => setChoferIds((actual) => alternar(actual, chofer.id))}
                />
                <span>
                  {nombreChofer(chofer)}{" "}
                  <span className="text-muted-foreground">({formatearCuit(chofer.cuit)})</span>
                </span>
              </label>
            ))
          )}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium">Vehículos</legend>
          {vehiculos.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay vehículos cargados todavía.</p>
          ) : (
            vehiculos.map((vehiculo) => (
              <label key={vehiculo.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={vehiculoIds.has(vehiculo.id)}
                  disabled={!puedeEditar}
                  onChange={() => setVehiculoIds((actual) => alternar(actual, vehiculo.id))}
                />
                <span>
                  {vehiculo.patente}{" "}
                  <span className="text-muted-foreground">({TIPO_VEHICULO_LABELS[vehiculo.tipo]})</span>
                </span>
              </label>
            ))
          )}
        </fieldset>
      </div>

      {puedeEditar && (
        <div className="flex justify-end">
          <Button onClick={handleGuardar} disabled={guardar.isPending}>
            {guardar.isPending ? "Guardando..." : "Guardar autorizados"}
          </Button>
        </div>
      )}
    </div>
  );
}
