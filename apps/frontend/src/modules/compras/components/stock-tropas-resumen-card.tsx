import { Link } from "@tanstack/react-router";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { compraNumeroYLetra, etiquetasStockTropa, type StockTropa } from "@/modules/compras/domain/compra.types";

interface StockTropasResumenCardProps {
  tropas: StockTropa[];
}

/**
 * Resumen compacto del stock TEÓRICO de cada tropa abierta — pensado para
 * que quien arma la planificación de reparto (`planificacion-cabezas`) tenga
 * a mano, sin salir de la página, cuánto queda de cada tropa y de qué tipo
 * es (CHA = Cerda/Chancha, CAP = Capón o Machos Enteros Inmunocastrados —
 * ver `etiquetasStockTropa`). Ordenado de mayor a menor stock restante, para
 * que lo más disponible salte primero a la vista.
 */
export function StockTropasResumenCard({ tropas }: StockTropasResumenCardProps) {
  const ordenadas = [...tropas].sort((a, b) => b.stockRestante - a.stockRestante);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Stock disponible por tropa</CardTitle>
        <CardDescription>
          Cabezas que quedan por repartir de cada tropa abierta — stock teórico (compradas menos
          vendidas).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {ordenadas.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hay tropas abiertas.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {ordenadas.map((tropa) => (
              <Link
                key={tropa.id}
                to="/app/compras/$compraId"
                params={{ compraId: tropa.id }}
                className="hover:bg-accent flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors"
              >
                <span className="font-medium">{compraNumeroYLetra(tropa)}</span>
                {etiquetasStockTropa(tropa.categorias).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                <Badge variant={tropa.stockRestante === 0 ? "secondary" : "default"}>
                  {tropa.stockRestante}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
