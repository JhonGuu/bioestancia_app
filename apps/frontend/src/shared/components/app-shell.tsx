import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  CalendarClock,
  Calculator,
  Contact,
  Receipt,
  Settings,
  ShoppingCart,
  Truck,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";

import { useAuth } from "@/modules/auth/context/auth-context";
import { Permisos, Roles } from "@/modules/auth/domain/auth.types";
import { BrandLogo, brandCompanyFromRazonSocial } from "@/components/brand-logo";
import { UserMenu } from "@/shared/components/user-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

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
    to: "/app/personal" as const,
    label: "Personal",
    icon: Contact,
    roles: [Roles.ADMIN, Roles.CONTABLE],
  },
  {
    to: "/app/contabilidad" as const,
    label: "Contabilidad",
    icon: Calculator,
    roles: [Roles.ADMIN, Roles.CONTABLE],
    // Módulo entero gateado por permiso granular (no solo por rol): a
    // diferencia de Ventas/Compras, acá NO hay contenido sin permiso, así
    // que directamente se oculta el ítem del menú en vez de mostrar la
    // pantalla de "sin acceso" al entrar.
    permiso: Permisos.VER_CONTABILIDAD,
  },
  {
    to: "/app/empresa" as const,
    label: "Datos de la empresa",
    icon: Settings,
    roles: [Roles.ADMIN],
  },
  {
    to: "/app/usuarios" as const,
    label: "Usuarios",
    icon: UserCog,
    roles: [Roles.ADMIN],
  },
];

/**
 * Shell de la app autenticada, armado con el `Sidebar` de shadcn/ui:
 *
 * - Escritorio (`md`+): sidebar fijo a la izquierda que se colapsa a una
 *   barra de íconos (con tooltip) desde el botón del header o con Ctrl/Cmd+B.
 *   shadcn recuerda el estado abierto/cerrado en una cookie.
 * - Celular: el mismo sidebar se abre como panel deslizable (lo resuelve
 *   `Sidebar` solo, no hace falta un `Sheet` aparte) desde el botón del header.
 * - Header: solo el botón para abrir/cerrar el sidebar (más el logo en
 *   celular, donde el sidebar está cerrado). Usuario, cuenta, tema y cerrar
 *   sesión viven en el menú del usuario, en el pie del sidebar (`UserMenu`).
 * - `<Outlet/>` dentro de `SidebarInset` renderiza la página de cada módulo.
 */
export function AppShell() {
  const auth = useAuth();
  const brandCompany = brandCompanyFromRazonSocial(auth.empresaActiva?.razonSocial);
  const nombreEmpresa = auth.empresaActiva?.razonSocial ?? "Bioestancia";

  return (
    <SidebarProvider>
      <AppSidebar />

      {/* `min-w-0`: sin esto, un ítem flex no se achica por debajo del ancho
          intrínseco de su contenido (default `min-width: auto`) — una tabla
          ancha adentro (ej. porcentaje-cobranza) empujaba TODO el layout
          (sidebar incluido) en vez de scrollear dentro de su propio
          contenedor `overflow-auto`. */}
      <SidebarInset className="min-w-0">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="data-[orientation=vertical]:h-5 md:hidden" />
          <div className="flex min-w-0 items-center gap-2 font-semibold md:hidden">
            {brandCompany ? (
              <BrandLogo company={brandCompany} className="shrink-0" />
            ) : (
              <>
                <Building2 className="size-5 shrink-0" />
                <span className="truncate">{nombreEmpresa}</span>
              </>
            )}
          </div>
        </header>

        <div className="min-w-0 flex-1 p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AppSidebar() {
  const auth = useAuth();

  const brandCompany = brandCompanyFromRazonSocial(auth.empresaActiva?.razonSocial);
  const nombreEmpresa = auth.empresaActiva?.razonSocial ?? "Bioestancia";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {/* Colapsado no entra el logo completo: se cambia por un ícono. */}
        <div className="flex h-12 items-center px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          {brandCompany ? (
            <BrandLogo company={brandCompany} className="h-10 group-data-[collapsible=icon]:hidden" />
          ) : (
            <span className="truncate font-semibold group-data-[collapsible=icon]:hidden">
              {nombreEmpresa}
            </span>
          )}
          <Building2 className="hidden size-5 group-data-[collapsible=icon]:block" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <NavMenu rol={auth.empresaActiva?.rol} permisos={auth.empresaActiva?.permisos} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

function NavMenu({ rol, permisos }: { rol?: Roles; permisos?: Permisos[] }) {
  const { isMobile, setOpenMobile } = useSidebar();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  // `item.roles` inferido por TS como distintas tuplas literales (cada
  // entrada de NAV_ITEMS puede tener una combinación de roles distinta) —
  // el cast a `Roles[]` evita que `.includes()` se tipe contra una sola de
  // esas tuplas en vez de contra `Roles` en general.
  const items = NAV_ITEMS.filter(
    (item) =>
      (!rol || (item.roles as Roles[]).includes(rol)) &&
      (!("permiso" in item) || !item.permiso || (permisos ?? []).includes(item.permiso)),
  );

  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.to}>
          <SidebarMenuButton
            asChild
            tooltip={item.label}
            isActive={pathname === item.to || pathname.startsWith(`${item.to}/`)}
          >
            <Link to={item.to} onClick={() => isMobile && setOpenMobile(false)}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
