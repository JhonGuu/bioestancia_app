/**
 * Mensaje de corte para una pantalla que requiere un permiso granular que
 * el usuario no tiene — mismo criterio visual que el chequeo de rol en
 * `empresa/index.tsx` / `usuarios/index.tsx` (texto centrado, sin más).
 */
export function SinPermiso() {
  return (
    <p className="text-muted-foreground py-8 text-center text-sm">
      No tenés acceso a esta sección. Pedile a un administrador que te otorgue el permiso correspondiente
      desde "Usuarios".
    </p>
  );
}
