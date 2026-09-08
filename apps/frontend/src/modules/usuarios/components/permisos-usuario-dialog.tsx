import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Permisos } from "@/modules/auth/domain/auth.types";
import { usePermisosCatalogo } from "@/modules/usuarios/hooks/use-permisos-catalogo";
import { usePermisosUsuario } from "@/modules/usuarios/hooks/use-permisos-usuario";
import { useSetPermisosUsuario } from "@/modules/usuarios/hooks/use-set-permisos-usuario";
import type { PermisoCatalogoItem, UsuarioConAcceso } from "@/modules/usuarios/domain/usuario.types";
import { ApiError } from "@/shared/api/api-response";

interface PermisosUsuarioDialogProps {
  usuario: UsuarioConAcceso;
}

/**
 * Qué información sensible puede ver este usuario en la empresa activa —
 * capa ortogonal al rol (ver `Permisos` en `auth.types.ts`). Checkboxes
 * agrupados por categoría, con la metadata (etiqueta/descripción) que
 * devuelve el catálogo del backend. Mismo esqueleto que `EditarRolDialog`,
 * cambiando el `Select` de un solo valor por un grupo de checkboxes.
 *
 * Nada viene tildado por default — ni siquiera para admin: el permiso es
 * 100% explícito, lo decide quien administra la empresa.
 */
export function PermisosUsuarioDialog({ usuario }: PermisosUsuarioDialogProps) {
  const [open, setOpen] = useState(false);
  const [seleccionados, setSeleccionados] = useState<Set<Permisos>>(new Set());

  const catalogoQuery = usePermisosCatalogo();
  const permisosQuery = usePermisosUsuario(usuario.usuarioId, open);
  const setPermisosUsuario = useSetPermisosUsuario();

  // Prefillea la selección con los permisos vigentes cada vez que se abre
  // (y ya llegó la respuesta) — así reabrir sin guardar descarta cambios a
  // medio hacer, mismo criterio que `EditarRolDialog` reseteando el rol en
  // `onOpenChange`.
  useEffect(() => {
    if (open && permisosQuery.data) {
      setSeleccionados(new Set(permisosQuery.data));
    }
  }, [open, permisosQuery.data]);

  function toggle(codigo: Permisos, checked: boolean) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(codigo);
      } else {
        next.delete(codigo);
      }
      return next;
    });
  }

  function handleGuardar() {
    setPermisosUsuario.mutate(
      { email: usuario.email, permisos: Array.from(seleccionados) },
      {
        onSuccess: () => {
          toast.success("Permisos actualizados correctamente");
          setOpen(false);
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : "No se pudieron actualizar los permisos");
        },
      },
    );
  }

  const categorias = agruparPorCategoria(catalogoQuery.data ?? []);
  const cargando = catalogoQuery.isPending || permisosQuery.isPending;
  const error = catalogoQuery.error ?? permisosQuery.error;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Permisos">
          <ShieldCheck className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Permisos de {usuario.firstName} {usuario.lastName}
          </DialogTitle>
          <DialogDescription>
            Qué información sensible puede ver — independiente del rol. Aplica a partir de su próxima
            acción, no hace falta que vuelva a iniciar sesión.
          </DialogDescription>
        </DialogHeader>

        {cargando ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Cargando...
          </div>
        ) : error ? (
          <p className="text-destructive py-8 text-center text-sm">{error.message}</p>
        ) : (
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            {Object.entries(categorias).map(([categoria, items]) => (
              <div key={categoria} className="space-y-2">
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  {categoria}
                </p>
                <div className="space-y-2">
                  {items.map((item) => (
                    <label
                      key={item.codigo}
                      className="hover:bg-accent/50 flex items-start gap-2 rounded-md border p-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        className="accent-primary mt-0.5 size-4 shrink-0"
                        checked={seleccionados.has(item.codigo)}
                        onChange={(e) => toggle(item.codigo, e.target.checked)}
                      />
                      <span>
                        <span className="font-medium">{item.etiqueta}</span>
                        <span className="text-muted-foreground block text-xs">{item.descripcion}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleGuardar} disabled={setPermisosUsuario.isPending || cargando || !!error}>
            {setPermisosUsuario.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function agruparPorCategoria(items: PermisoCatalogoItem[]): Record<string, PermisoCatalogoItem[]> {
  const grupos: Record<string, PermisoCatalogoItem[]> = {};
  for (const item of items) {
    (grupos[item.categoria] ??= []).push(item);
  }
  return grupos;
}
