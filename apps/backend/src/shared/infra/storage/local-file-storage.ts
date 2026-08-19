import { promises as fs } from "fs";
import path from "path";

import { injectable } from "inversify";

import { FileStorage } from "@/shared/infra/storage/file-storage";

/**
 * Implementación en disco local del `FileStorage`. Es el criterio de menor
 * infraestructura consistente con el resto del proyecto (sin depender de un
 * bucket externo) — ver `docs/plan-personal-asistencia.md`, punto 2 ("Documentos").
 *
 * Todo queda bajo `UPLOADS_DIR` (default `<cwd>/storage/uploads`), fuera del
 * árbol que se sirve como asset estático — los archivos SOLO se leen a través
 * de un endpoint autenticado (ver `EmpleadoController` / descarga de DNI),
 * nunca de una ruta pública directa.
 */
@injectable()
export class LocalFileStorage implements FileStorage {
  private readonly baseDir: string;

  constructor() {
    this.baseDir = process.env.UPLOADS_DIR
      ? path.resolve(process.env.UPLOADS_DIR)
      : path.join(process.cwd(), "storage", "uploads");
  }

  async save(buffer: Buffer, subdir: string, filename: string): Promise<string> {
    const dir = path.join(this.baseDir, subdir);
    await fs.mkdir(dir, { recursive: true });
    const relativePath = path.join(subdir, filename);
    await fs.writeFile(path.join(this.baseDir, relativePath), buffer);
    return relativePath;
  }

  async read(relativePath: string): Promise<Buffer | null> {
    try {
      return await fs.readFile(path.join(this.baseDir, relativePath));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  async delete(relativePath: string): Promise<void> {
    try {
      await fs.unlink(path.join(this.baseDir, relativePath));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
}
