import { randomBytes } from "node:crypto";

/**
 * Genera una contraseña temporal legible para mostrarle una sola vez al admin
 * al crear un usuario nuevo (ver `POST /account/users`). El usuario queda
 * marcado con `mustChangePassword: true` y tiene que cambiarla en su primer
 * login — ver `ChangePassword`.
 *
 * Alfabeto sin caracteres ambiguos (sin 0/O, 1/l/I) para que sea fácil de
 * transcribir a mano si hace falta pasarla por teléfono.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

export function generateTempPassword(length = 12): string {
  const bytes = randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return password;
}
