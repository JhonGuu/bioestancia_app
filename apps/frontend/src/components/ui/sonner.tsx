import type * as React from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Wrapper de shadcn/ui sobre `sonner`. Sin next-themes (no aplica en Vite):
 * sigue el color-scheme del sistema vía CSS.
 */
function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
