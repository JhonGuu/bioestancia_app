import { useState } from "react";
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import {
  Building2,
  CalendarClock,
  LogOut,
  Menu,
  Receipt,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

import { useAuth } from "@/modules/auth/context/auth-context";
import { Roles } from "@/modules/auth/domain/auth.types";
import { BrandLogo, brandCompanyFromRazonSocial } from "@/components/brand-logo";
import { ThemeToggle } from "@/shared/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * `roles` opcional: si no se especifica, el item es visible para cualquier
 * rol. El operario carga boletas desde el celular y nada más — no necesita
 * (ni debería ver) clientes/proveedores/compras/planificación, así que esos
 * items sí llevan `roles` explícito.
 */
const NAV_ITEMS = [
  {
    to: "/app/boletas" as const,
    label: "Boletas",
    icon: Receipt,
    roles: [Roles.ADMIN, Roles.CONTABLE, Roles.OPERARIO],
  },
  {
    to: "/app/ventas" as const,
    label: "Ventas",
    icon: Wallet,
    roles: [Roles.ADMIN, Roles.CONTABLE],
  },
  { to: "/app/clientes" as const, label: "Clientes", icon: Users, roles: [Roles.ADMIN, Roles.CONTABLE] },
  {
    to: "/app/proveedores" as const,
    label: "Proveedores",
    icon: Truck,
    roles: [Roles.ADMIN, Roles.CONTABLE],
  },
  {
    to: "/app/compras" as const,
    label: "Compras",
    icon: ShoppingCart,
    roles: [Roles.ADMIN, Roles.CONTABLE],
  },
  {
    to: "/app/planificacion-cabezas" as const,
    label: "Planificación de cabezas",
    icon: CalendarClock,
    roles: [Roles.ADMIN, Roles.CONTABLE],
  },
  {
    to: "/app/empresa" as const,
    label: "Datos de la empresa",
    icon: Settings,
    roles: [Roles.ADMIN],
  },
];

/**
 * Shell de la app autenticada: topbar (empresa activa + usuario + logout) +
 * navegación + <Outlet/> para la página de cada módulo.
 *
 * La navegación es un sidebar fijo desde `md` en adelante; por debajo de eso
 * queda oculta (no entra cómoda ni deja lugar al contenido) y se accede vía
 * un botón de menú en el header que abre un `Sheet` deslizable — mismo set
 * de links, sin duplicar el layout completo para mobile.
 */
export function AppShell() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  async function handleLogout() {
    auth.logout();
    await navigate({ to: "/login" });
  }

  const brandCompany = brandCompanyFromRazonSocial(auth.empresaActiva?.razonSocial);

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 items-center justify-between gap-2 border-b px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-1">
          <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader>
                <SheetTitle className="sr-only">Navegación</SheetTitle>
                {brandCompany ? (
                  <BrandLogo company={brandCompany} className="h-10" />
                ) : (
                  <div className="flex items-center gap-2 font-semibold">
                    <Building2 className="size-5" />
                    {auth.empresaActiva?.razonSocial ?? "Bioestancia"}
                  </div>
                )}
              </SheetHeader>
              <nav className="p-3">
                <NavLinks rol={auth.empresaActiva?.rol} onNavigate={() => setMenuAbierto(false)} />
              </nav>
            </SheetContent>
          </Sheet>

          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 md:hidden"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
          >
            <Menu className="size-5" />
          </Button>

          <div className="flex min-w-0 items-center gap-2 font-semibold">
            {brandCompany ? (
              <BrandLogo company={brandCompany} className="h-60 w-60 shrink-0" />
            ) : (
              <>
                <Building2 className="size-5 shrink-0" />
                <span className="truncate">{auth.empresaActiva?.razonSocial ?? "Bioestancia"}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <span className="text-muted-foreground hidden text-sm sm:inline">
            {auth.user?.firstName} {auth.user?.lastName} ·{" "}
            <span className="capitalize">{auth.empresaActiva?.rol}</span>
          </span>
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Cerrar sesión">
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="hidden w-56 shrink-0 border-r p-3 md:block">
          <NavLinks rol={auth.empresaActiva?.rol} />
        </nav>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavLinks({ rol, onNavigate }: { rol?: Roles; onNavigate?: () => void }) {
  // `item.roles` inferido por TS como distintas tuplas literales (cada
  // entrada de NAV_ITEMS puede tener una combinación de roles distinta) —
  // el cast a `Roles[]` evita que `.includes()` se tipe contra una sola de
  // esas tuplas en vez de contra `Roles` en general.
  const items = NAV_ITEMS.filter((item) => !rol || (item.roles as Roles[]).includes(rol));

  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.to}>
          <Link
            to={item.to}
            onClick={onNavigate}
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
  );
}
