import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronsUpDown, KeyRound, LogOut, Moon, Sun, UserRound } from "lucide-react";

import { useAuth } from "@/modules/auth/context/auth-context";
import { useTheme } from "@/shared/theme/theme-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

function iniciales(firstName?: string, lastName?: string): string {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";
}

/**
 * Menú del usuario para el pie del sidebar (patrón "nav-user" de shadcn):
 * avatar con iniciales + nombre + email, y al hacer click un menú con acceso
 * a "Mi cuenta" (datos personales), "Cambiar contraseña", el tema y cerrar
 * sesión. Colapsado a íconos queda solo el avatar.
 */
export function UserMenu() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { isMobile } = useSidebar();

  const { user, empresaActiva } = auth;
  const nombre = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "Usuario";
  const avatar = iniciales(user?.firstName, user?.lastName);

  async function handleLogout() {
    auth.logout();
    await navigate({ to: "/login" });
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground rounded-lg text-xs font-semibold">
                  {avatar}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{nombre}</span>
                <span className="text-muted-foreground truncate text-xs">{user?.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground rounded-lg text-xs font-semibold">
                    {avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 leading-tight">
                  <span className="truncate font-medium">{nombre}</span>
                  <span className="text-muted-foreground truncate text-xs">{user?.email}</span>
                  <span className="text-muted-foreground text-xs capitalize">
                    {empresaActiva?.rol}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to="/app/cuenta">
                  <UserRound />
                  Mi cuenta
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/app/cuenta" hash="contrasena">
                  <KeyRound />
                  Cambiar contraseña
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />

            <DropdownMenuItem onSelect={toggleTheme}>
              {theme === "dark" ? <Sun /> : <Moon />}
              {theme === "dark" ? "Modo claro" : "Modo oscuro"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            <DropdownMenuItem onSelect={() => void handleLogout()}>
              <LogOut />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
