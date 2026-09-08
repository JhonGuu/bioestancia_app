import type { SumaYSaldoNodo } from "@/modules/contabilidad/domain/reportes.types";

export function SumasYSaldosTree({ arbol }: { arbol: SumaYSaldoNodo[] }) {
  if (arbol.length === 0) {
    return <p className="text-muted-foreground py-8 text-center text-sm">No hay cuentas con movimientos en este rango.</p>;
  }

  return (
    <div className="divide-y">
      <div className="text-muted-foreground flex items-center justify-between gap-2 py-1 text-xs font-medium">
        <span>Cuenta</span>
        <div className="flex shrink-0 gap-6">
          <span className="w-24 text-right">Debe</span>
          <span className="w-24 text-right">Haber</span>
          <span className="w-24 text-right">Saldo</span>
        </div>
      </div>
      {arbol.map((nodo) => (
        <FilaSumaYSaldo key={nodo.id} nodo={nodo} nivel={0} />
      ))}
    </div>
  );
}

function FilaSumaYSaldo({ nodo, nivel }: { nodo: SumaYSaldoNodo; nivel: number }) {
  // Cuentas de agrupación sin movimiento propio ni de sus hijas no aportan nada al informe — se ocultan.
  if (nodo.sumaDebe === 0 && nodo.sumaHaber === 0) return null;

  return (
    <div>
      <div
        className="flex items-center justify-between gap-2 py-1.5 text-sm"
        style={{ paddingLeft: `${nivel * 1.25}rem` }}
      >
        <span className="min-w-0 truncate">
          <span className="text-muted-foreground mr-2 font-mono text-xs">{nodo.codigo}</span>
          <span className={nodo.imputable ? "" : "font-semibold"}>{nodo.nombre}</span>
        </span>
        <div className="flex shrink-0 gap-6 font-mono text-xs">
          <span className="w-24 text-right">{nodo.sumaDebe > 0 ? nodo.sumaDebe.toFixed(2) : ""}</span>
          <span className="w-24 text-right">{nodo.sumaHaber > 0 ? nodo.sumaHaber.toFixed(2) : ""}</span>
          <span className="w-24 text-right font-medium">{nodo.saldo.toFixed(2)}</span>
        </div>
      </div>
      {nodo.hijos.map((hijo) => (
        <FilaSumaYSaldo key={hijo.id} nodo={hijo} nivel={nivel + 1} />
      ))}
    </div>
  );
}
