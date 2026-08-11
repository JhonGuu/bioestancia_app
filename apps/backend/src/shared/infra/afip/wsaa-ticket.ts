/**
 * Ticket de acceso (TA) que devuelve WSAA: `token` + `sign` autorizan a la
 * app a hablarle a un web service puntual (acá, WSLSP) durante `expiración`.
 * Se manda tal cual dentro del `<auth>` de cada request a WSLSP, junto al CUIT.
 */
export interface WsaaTicket {
  token: string;
  sign: string;
  /** Vencimiento del ticket (WSAA lo emite con 12hs de validez). */
  expiracion: Date;
}
