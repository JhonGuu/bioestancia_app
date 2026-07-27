/**
 * Condición fiscal del cliente ante AFIP. Enum en vez de string libre para no
 * terminar con valores inconsistentes ("RI", "Responsable Inscripto", etc.)
 * — mismo patrón que `Roles` (modules/users) o `Rubro` (modules/empresas).
 */
export enum CondicionFiscal {
  RESPONSABLE_INSCRIPTO = "responsable_inscripto",
  MONOTRIBUTO = "monotributo",
  CONSUMIDOR_FINAL = "consumidor_final",
  EXENTO = "exento",
}
