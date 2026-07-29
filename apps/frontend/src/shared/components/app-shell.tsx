import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { Building2, LogOut, Users } from "lucide-react";

import { useAuth } from "@/modules/auth/context/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [{ to: "/app/clientes" as const, label: "Clientes", icon: Users }];

/**
 * Shell de la app autenticada: topbar (empresa activa + usuario + logout) +
 * sidebar de navegación + <Outlet/> para la página de cada módulo.
 */
export function AppShell() {
  const auth = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    auth.logout();
    await navigate({ to: "/login" });
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2 font-semibold">
          <Building2 className="size-5" />
          {auth.empresaActiva?.razonSocial ?? "Bioestancia"}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-sm">
            {auth.user?.firstName} {auth.user?.lastName} ·{" "}
            <span className="capitalize">{auth.empresaActiva?.rol}</span>
          </span>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Cerrar sesión">
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="w-56 shrink-0 border-r p-3">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    "[&.active]:bg-accent [&.active]:text-accent-foreground",
                  )}
                  activeProps={{ className: "active" }}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
