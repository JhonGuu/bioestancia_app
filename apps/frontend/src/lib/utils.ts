import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combina clases de Tailwind sin conflictos (shadcn/ui estándar). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
