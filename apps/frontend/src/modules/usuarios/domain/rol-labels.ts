import { Roles } from "@/modules/auth/domain/auth.types";

export const ROL_LABELS: Record<Roles, string> = {
  [Roles.ADMIN]: "Administrador",
  [Roles.CONTABLE]: "Contable",
  [Roles.VETERINARIO]: "Veterinario",
  [Roles.OPERARIO]: "Operario",
};
