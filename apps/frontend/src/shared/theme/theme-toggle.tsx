import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/shared/theme/theme-provider";
import { Button } from "@/components/ui/button";

/** Botón que alterna entre modo claro y oscuro. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={className}
      title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      <span className="sr-only">Cambiar tema</span>
    </Button>
  );
}
