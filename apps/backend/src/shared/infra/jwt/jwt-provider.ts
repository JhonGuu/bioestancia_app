import jwt, { SignOptions } from "jsonwebtoken";
import { injectable } from "inversify";

import { Env } from "@/shared/infra/env/env";

/**
 * Lo que va dentro del token (payload).
 * Mantenelo CHICO: el token viaja en cada request.
 * Solo metemos el `id` del usuario; cualquier otra info se lee de la DB cuando hace falta.
 */
export interface JwtPayload {
  id: string;
}

/**
 * Interface del provider. Otros lugares de la app dependen de esto, no de jsonwebtoken.
 */
export interface JWTProvider {
  /** Firma un payload y devuelve el token como string. */
  encrypt(payload: JwtPayload): string;
  /** Verifica un token y devuelve su payload. Lanza si es inválido o está vencido. */
  decrypt(token: string): JwtPayload;
}

/**
 * Implementación con la librería `jsonwebtoken`.
 * Los tokens vencen a los 7 días.
 */
@injectable()
export class JsonWebTokenProvider implements JWTProvider {
  private readonly secret: string;
  private readonly expiresIn: SignOptions["expiresIn"] = "7d";

  constructor() {
    this.secret = Env.jwtSecret;
  }

  encrypt(payload: JwtPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  decrypt(token: string): JwtPayload {
    const decoded = jwt.verify(token, this.secret);
    if (typeof decoded === "string" || !("id" in decoded)) {
      throw new Error("Invalid JWT payload");
    }
    return { id: decoded.id as string };
  }
}
