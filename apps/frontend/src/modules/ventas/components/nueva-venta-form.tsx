import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useClientes } from "@/modules/clientes/hooks/use-clientes";
import { nombreCliente } from "@/modules/clientes/domain/cliente.types";
import { useCompras } from "@/modules/compras/hooks/use-compras";
import { CategoriaPorcino, compraNumeroYLetra } from "@/modules/compras/domain/compra.types";
import {
  CategoriaReventa,
  categoriaCorta,
  esReventa,
  type CategoriaVenta,
} from "@/modules/ventas/domain/categoria-venta";
import { FormaVenta, FORMA_VENTA_LABELS } from "@/modules/ventas/domain/venta.types";
import type { CreateVentaInput } from "@/modules/ventas/api/ventas.api";
import { hoyISO } from "@/shared/lib/date";

/** Todas las categorías elegibles: el catálogo porcino + "Novillo" (reventa, sin tropa propia). */
const CATEGORIAS: CategoriaVenta[] = [...Object.values(CategoriaPorcino), CategoriaReventa.NOVILLO];

const NECESITA_GARRON: FormaVenta[] = [FormaVenta.CABEZA, FormaVenta.MEDIA_RES];

interface NuevaVentaFormProps {
  onSubmit: (input: CreateVentaInput) => Promise<void>;
  isSubmitting?: boolean;
  /** Precarga cliente/tropa (ej. si se abre esta pantalla desde el detalle de una tropa puntual). */
  compraIdInicial?: string;
}

/**
 * Carga manual de UNA venta, sin pasar por el importador de Excel ni el
 * flujo de boletas (ver `plan-unificacion-tropas-despacho.md`, sección de
 * verificación) — pensada para probar rápido un caso puntual (ej. confirmar
 * que el rinde de un grupo de tropas da lo mismo que en el Excel) y, a
 * futuro, como base de una pantalla de reparto diario.
 *
 * A propósito NO usa react-hook-form/zod como `BoletaForm` — es una carga de
 * UNA línea por vez, no un lote de items por tropa, así que el estado simple
 * alcanza. Tras cada carga exitosa, el caller (`nuevo.tsx`) resetea solo
 * garrón/kg/precio y deja cliente/tropa/fecha como están, para poder cargar
 * varias ventas seguidas de la misma tropa sin repetir todo el formulario.
 */
export function NuevaVentaForm({ onSubmit, isSubmitting, compraIdInicial }: NuevaVentaFormProps) {
  const clientesQuery = useClientes();
  const comprasQuery = useCompras();

  const [clienteId, setClienteId] = useState("");
  const [compraId, setCompraId] = useState(compraIdInicial ?? "");
  const [garron, setGarron] = useState("");
  const [formaVenta, setFormaVenta] = useState<FormaVenta>(FormaVenta.CABEZA);
  const [categoria, setCategoria] = useState<CategoriaVenta | "">(CategoriaPorcino.CAPON);
  const [kg, setKg] = useState("");
  const [precioKg, setPrecioKg] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [comentarios, setComentarios] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Solo tropas abiertas: una cerrada ya no debería recibir ventas nuevas
  // (mismo criterio que `BoletaForm`) — igual aparece aunque esté agrupada
  // (`grupoTropasId`), que es justamente el caso de uso a probar.
  const tropasAbiertas = (comprasQuery.data ?? []).filter((c) => !c.cerrada);

  const esCompensacion = formaVenta === FormaVenta.COMPENSACION_KG;
  const esReventaSeleccionada = esReventa(categoria || undefined);
  const necesitaCompra = !esCompensacion && !esReventaSeleccionada;
  const necesitaGarron = !esCompensacion && !esReventaSeleccionada && NECESITA_GARRON.includes(formaVenta);
  const necesitaCategoria = !esCompensacion;

  function reset(mantenerClienteYTropa: boolean) {
    setGarron("");
    setKg("");
    setPrecioKg("");
    setComentarios("");
    if (!mantenerClienteYTropa) {
      setClienteId("");
      setCompraId("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!clienteId) return setError("Elegí un cliente");
    if (necesitaCompra && !compraId) return setError("Elegí la tropa de la que sale este animal");
    if (necesitaCategoria && !categoria) return setError("Elegí la categoría");
    if (necesitaGarron && !garron) return setError("Cargá el garrón");

    const kgNumero = Number(kg);
    if (!kgNumero || kgNumero <= 0) {
      return setError(
        esCompensacion ? "Cargá el kg a descontar (en positivo)" : "Cargá el peso en kg",
      );
    }

    const input: CreateVentaInput = {
      clienteId,
      formaVenta,
      // La compensación siempre resta: se tipea la magnitud en positivo y se
      // manda ya en negativo (mismo criterio que `boletas.api.ts`).
      kg: esCompensacion ? -kgNumero : kgNumero,
      fecha,
      ...(necesitaCompra && compraId ? { compraId } : {}),
      ...(necesitaGarron && garron ? { garron: Number(garron) } : {}),
      ...(necesitaCategoria && categoria ? { categoria } : {}),
      ...(precioKg ? { precioKg: Number(precioKg) } : {}),
      ...(comentarios ? { comentarios } : {}),
    };

    await onSubmit(input);
    reset(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Cliente</Label>
          <Select value={clienteId} onValueChange={setClienteId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Elegí un cliente" />
            </SelectTrigger>
            <SelectContent>
              {(clientesQuery.data ?? []).map((cliente) => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {nombreCliente(cliente)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Fecha</Label>
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Presentación</Label>
          <Select value={formaVenta} onValueChange={(v) => setFormaVenta(v as FormaVenta)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(FormaVenta).map((v) => (
                <SelectItem key={v} value={v}>
                  {FORMA_VENTA_LABELS[v]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {necesitaCategoria && (
          <div className="space-y-1">
            <Label>Categoría</Label>
            <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaVenta)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Elegí una categoría" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map((v) => (
                  <SelectItem key={v} value={v}>
                    {categoriaCorta(v)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {necesitaCompra && (
        <div className="space-y-1">
          <Label>Tropa</Label>
          <Select value={compraId} onValueChange={setCompraId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Elegí la tropa" />
            </SelectTrigger>
            <SelectContent>
              {tropasAbiertas.map((compra) => (
                <SelectItem key={compra.id} value={compra.id}>
                  Tropa {compraNumeroYLetra(compra)} ·{" "}
                  {new Date(compra.fecha).toLocaleDateString("es-AR", { timeZone: "UTC" })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {necesitaGarron && (
          <div className="space-y-1">
            <Label>Garrón</Label>
            <Input
              inputMode="numeric"
              value={garron}
              onChange={(e) => setGarron(e.target.value)}
              placeholder="Ej. 42"
            />
          </div>
        )}
        <div className="space-y-1">
          <Label>{esCompensacion ? "Kg a descontar" : "Kg"}</Label>
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={kg}
            onChange={(e) => setKg(e.target.value)}
            placeholder="Ej. 95.5"
          />
        </div>
        {!esCompensacion && (
          <div className="space-y-1">
            <Label>Precio/kg (opcional)</Label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={precioKg}
              onChange={(e) => setPrecioKg(e.target.value)}
              placeholder="Si no lo sabés, dejalo vacío"
            />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <Label>Comentarios (opcional)</Label>
        <Textarea value={comentarios} onChange={(e) => setComentarios(e.target.value)} rows={2} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Cargar venta"}
        </Button>
        <Button type="button" variant="outline" onClick={() => reset(false)} disabled={isSubmitting}>
          Limpiar todo
        </Button>
      </div>
    </form>
  );
}
