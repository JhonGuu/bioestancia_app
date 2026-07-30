import { useTheme } from "@/shared/theme/theme-provider";
import { cn } from "@/lib/utils";

import bioestanciaLight from "@/assets/brand/bioestancia-light.png";
import bioestanciaDark from "@/assets/brand/bioestancia-dark-transparent.png";
import elMeridianoLight from "@/assets/brand/el-meridiano-light.png";
import elMeridianoDark from "@/assets/brand/el-meridiano-dark.png";

const LOGOS = {
  bioestancia: { light: bioestanciaLight, dark: bioestanciaDark },
  "el-meridiano": { light: elMeridianoLight, dark: elMeridianoDark },
} as const;

export type BrandCompany = keyof typeof LOGOS;

/**
 * Isotipo de Bioestancia o El Meridiano. Elige automáticamente la variante
 * clara u oscura según el tema activo (ver `shared/theme/theme-provider.tsx`):
 * las versiones "dark" están pensadas para fondo oscuro, las "light" para
 * fondo claro.
 */
export function BrandLogo({
  company,
  className,
}: {
  company: BrandCompany;
  className?: string;
}) {
  const { theme } = useTheme();
  const src = theme === "dark" ? LOGOS[company].dark : LOGOS[company].light;
  const alt = company === "bioestancia" ? "Bioestancia" : "El Meridiano";

  return <img src={src} alt={alt} className={cn("h-10 w-auto object-contain", className)} />;
}

/** Devuelve la compañía de marca a partir de la razón social de la empresa activa. */
export function brandCompanyFromRazonSocial(razonSocial: string | undefined): BrandCompany | null {
  if (!razonSocial) return null;
  const normalizado = razonSocial.toLowerCase();
  if (normalizado.includes("meridiano")) return "el-meridiano";
  if (normalizado.includes("bioestancia")) return "bioestancia";
  return null;
}
