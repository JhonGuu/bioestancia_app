import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import {
  choferesApi,
  transporteClienteApi,
  transportistasApi,
  vehiculosApi,
  type CrudApi,
} from "@/modules/transportes/api/transporte.api";
import type { EstadoTransporteFiltro } from "@/modules/transportes/domain/transporte.types";
import type {
  ChoferFormValues,
  TransportistaFormValues,
  VehiculoFormValues,
} from "@/modules/transportes/domain/transporte.schemas";

/**
 * Los tres catálogos comparten hooks: listado por estado, guardar (alta o
 * edición según venga `id`), dar de baja y reactivar. Cada mutación
 * invalida el catálogo (y las listas de autorizados de los clientes, que
 * dependen de ellos).
 */
function crearHooks<T, V extends object>(clave: string, api: CrudApi<T, V>) {
  function useLista(estado: EstadoTransporteFiltro = "activos") {
    const { empresaActiva } = useAuth();
    return useQuery({
      queryKey: [clave, empresaActiva?.empresaId, estado],
      queryFn: () => api.list(estado),
      enabled: !!empresaActiva,
    });
  }

  function useInvalidar() {
    const queryClient = useQueryClient();
    const { empresaActiva } = useAuth();
    return () => {
      void queryClient.invalidateQueries({ queryKey: [clave, empresaActiva?.empresaId] });
      void queryClient.invalidateQueries({ queryKey: ["transporte-cliente", empresaActiva?.empresaId] });
    };
  }

  function useGuardar() {
    const invalidar = useInvalidar();
    return useMutation({
      mutationFn: ({ id, values }: { id?: string; values: V }) =>
        id ? api.update(id, values) : api.create(values),
      onSuccess: invalidar,
    });
  }

  function useBaja() {
    const invalidar = useInvalidar();
    return useMutation({ mutationFn: (id: string) => api.baja(id), onSuccess: invalidar });
  }

  function useReactivar() {
    const invalidar = useInvalidar();
    return useMutation({ mutationFn: (id: string) => api.reactivar(id), onSuccess: invalidar });
  }

  return { useLista, useGuardar, useBaja, useReactivar };
}

const transportistas = crearHooks<
  Awaited<ReturnType<typeof transportistasApi.create>>,
  TransportistaFormValues
>("transportistas", transportistasApi);
export const useTransportistas = transportistas.useLista;
export const useGuardarTransportista = transportistas.useGuardar;
export const useBajaTransportista = transportistas.useBaja;
export const useReactivarTransportista = transportistas.useReactivar;

const choferes = crearHooks<Awaited<ReturnType<typeof choferesApi.create>>, ChoferFormValues>(
  "choferes",
  choferesApi,
);
export const useChoferes = choferes.useLista;
export const useGuardarChofer = choferes.useGuardar;
export const useBajaChofer = choferes.useBaja;
export const useReactivarChofer = choferes.useReactivar;

const vehiculos = crearHooks<Awaited<ReturnType<typeof vehiculosApi.create>>, VehiculoFormValues>(
  "vehiculos",
  vehiculosApi,
);
export const useVehiculos = vehiculos.useLista;
export const useGuardarVehiculo = vehiculos.useGuardar;
export const useBajaVehiculo = vehiculos.useBaja;
export const useReactivarVehiculo = vehiculos.useReactivar;

/** Choferes y vehículos autorizados del cliente. */
export function useTransporteCliente(clienteId: string) {
  const { empresaActiva } = useAuth();
  return useQuery({
    queryKey: ["transporte-cliente", empresaActiva?.empresaId, clienteId],
    queryFn: () => transporteClienteApi.get(clienteId),
    enabled: !!empresaActiva && !!clienteId,
  });
}

export function useGuardarTransporteCliente(clienteId: string) {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();
  return useMutation({
    mutationFn: (input: { choferIds: string[]; vehiculoIds: string[] }) =>
      transporteClienteApi.set(clienteId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["transporte-cliente", empresaActiva?.empresaId, clienteId],
      });
    },
  });
}
