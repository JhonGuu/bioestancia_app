import { Link } from "@tanstack/react-router";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { compraNumeroYLetra, etiquetasStockTropa, type StockTropa } from "@/modules/compras/domain/compra.types";
import { nombreProveedor, type Proveedor } from "@/modules/proveedores/domain/proveedor.types";

interface StockTropasTableProps {
  tropas: StockTropa[];
  proveedores: Proveedor[];
}

/**
 * Stock TEÓRICO (compradas − vendidas) de cada tropa abierta — para chequear
 * lo entregado contra lo que queda por repartir. No hay conteo real del
 * operario todavía (ver decisión de negocio), así que si el número no
 * cuadra con lo que hay físicamente en la cámara, es una señal de que algo
 * se cargó mal (garrón repetido/faltante) más que un dato definitivo.
 */
export function StockTropasTable({ tropas, proveedores }: StockTropasTableProps) {
  if (tropas.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No hay tropas abiertas — todo lo comprado ya se cerró o no hay compras cargadas.
      </p>
    );
  }

  const nombrePorProveedorId = new Map(proveedores.map((p) => [p.id, nombreProveedor(p)]));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tropa</TableHead>
          <TableHead>Proveedor</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead className="text-right">Compradas</TableHead>
          <TableHead className="text-right">Vendidas</TableHead>
          <TableHead className="text-right">Restante</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tropas.map((tropa) => (
          <TableRow key={tropa.id}>
            <TableCell className="font-medium">
              <Link to="/app/compras/$compraId" params={{ compraId: tropa.id }} className="hover:underline">
                {compraNumeroYLetra(tropa)}
              </Link>
            </TableCell>
            <TableCell>{nombrePorProveedorId.get(tropa.proveedorId) ?? "—"}</TableCell>
            <TableCell>
              <div className="flex gap-1">
                {etiquetasStockTropa(tropa.categorias).map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell className="text-right">{tropa.cabezasCompradas}</TableCell>
            <TableCell className="text-right">{tropa.cabezasVendidas}</TableCell>
            <TableCell className="text-right">
              <Badge variant={tropa.stockRestante === 0 ? "secondary" : "default"}>
                {tropa.stockRestante}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
