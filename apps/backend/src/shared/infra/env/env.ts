import dotenv from "dotenv";
import path from "path";

// Carga las variables del archivo .env a process.env
// Sólo se ejecuta una vez al importar este archivo
dotenv.config({ path: path.join(process.cwd(), ".env") });

export class Env {
  /**
   * Lee una variable de entorno. Lanza si no existe.
   * Si se pasan possibleValues, valida que el valor esté entre ellos.
   */
  private static get(key: string, possibleValues?: readonly string[]): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing environment variable: ${key}`);
    }
    if (possibleValues?.length && !possibleValues.includes(value)) {
      throw new Error(
        `Invalid value for ${key}. Expected one of: ${possibleValues.join(", ")}`,
      );
    }
    return value;
  }

  static get environment(): "local" | "test" | "development" | "production" {
    return this.get("NODE_ENV", [
      "local",
      "test",
      "development",
      "production",
    ]) as "local" | "test" | "development" | "production";
  }

  static get port(): number {
    return Number(this.get("PORT"));
  }

  static get jwtSecret(): string {
    return this.get("JWT_SECRET");
  }

  static get dbUrl(): string {
    return this.get("DB_URL");
  }

  static get bcryptSalt(): number {
    return Number(this.get("BCRYPT_SALT"));
  }

  static get logLevel(): string {
    return process.env.LOG_LEVEL ?? "info";
  }
}
