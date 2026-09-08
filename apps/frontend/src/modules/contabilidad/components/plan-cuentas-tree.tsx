import { Badge } from "@/components/ui/badge";
import { CuentaFormDialog } from "@/modules/contabilidad/components/cuenta-form-dialog";
import { EliminarCuentaDialog } from "@/modules/contabilidad/components/eliminar-cuenta-dialog";
import { aplanarArbol, type CuentaNodo } from "@/modules/contabilidad/domain/cuenta.types";
import { TIPO_AUXILIAR_LABELS, TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";

interface PlanCuentasTreeProps {
  arbol: CuentaNodo[];
  puedeEditar: boolean;
}

/** Árbol jerárquico del plan de cuentas, con ABM inline por fila. */
export function PlanCuentasTree({ arbol, puedeEditar }: PlanCuentasTreeProps) {
  const cuentasPlanas = aplanarArbol(arbol);

  if (arbol.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Todavía no hay cuentas cargadas — sembrá el catálogo base o creá la primera cuenta.
      </p>
    );
  }

  return (
    <div className="divide-y">
      {arbol.map((nodo) => (
        <FilaCuenta key={nodo.id} nodo={nodo} nivel={0} cuentasPlanas={cuentasPlanas} puedeEditar={puedeEditar} />
      ))}
    </div>
  );
}

function FilaCuenta({
  nodo,
  nivel,
  cuentasPlanas,
  puedeEditar,
}: {
  nodo: CuentaNodo;
  nivel: number;
  cuentasPlanas: CuentaNodo[];
  puedeEditar: boolean;
}) {
  return (
    <div>
      <div
        className="flex flex-wrap items-center justify-between gap-2 py-2"
        style={{ paddingLeft: `${nivel * 1.25}rem` }}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-muted-foreground shrink-0 font-mono text-xs">{nodo.codigo}</span>
          <span className={nodo.imputable ? "" : "font-semibold"}>{nodo.nombre}</span>
          {!nodo.activa && <Badge variant="secondary">Inactiva</Badge>}
          {!nodo.imputable && <Badge variant="outline">Agrupación</Badge>}
          {nodo.imputable && nodo.requiereAuxiliar !== TipoAuxiliar.NINGUNO && (
            <Badge variant="outline">Pide {TIPO_AUXILIAR_LABELS[nodo.requiereAuxiliar].toLowerCase()}</Badge>
          )}
          {nodo.monetaria && <Badge variant="outline">Monetaria</Badge>}
        </div>
        {puedeEditar && (
          <div className="flex shrink-0 items-center gap-1">
            {!nodo.imputable && <CuentaFormDialog cuentasPlanas={cuentasPlanas} parentIdSugerido={nodo.id} />}
            <CuentaFormDialog cuentasPlanas={cuentasPlanas} cuenta={nodo} />
            <EliminarCuentaDialog cuenta={nodo} />
          </div>
        )}
      </div>
      {nodo.hijos.map((hijo) => (
        <FilaCuenta key={hijo.id} nodo={hijo} nivel={nivel + 1} cuentasPlanas={cuentasPlanas} puedeEditar={puedeEditar} />
      ))}
    </div>
  );
}
