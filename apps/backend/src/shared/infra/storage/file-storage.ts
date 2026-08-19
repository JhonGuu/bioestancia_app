/** Interface del almacenamiento de archivos subidos por el usuario (ej. copia de DNI). Forma parte del DOMINIO compartido. */
export interface FileStorage {
  /**
   * Guarda un archivo bajo una subcarpeta lógica (ej. `dni/<empresaId>`) con
   * el nombre indicado. Devuelve la ruta relativa (no absoluta, no una URL) —
   * es lo que se persiste en la base y se le vuelve a pasar a `read()`/`delete()`.
   */
  save(buffer: Buffer, subdir: string, filename: string): Promise<string>;

  /** Lee un archivo por su ruta relativa (la que devolvió `save()`). Null si no existe. */
  read(relativePath: string): Promise<Buffer | null>;

  /** Borra un archivo por su ruta relativa. No falla si no existe. */
  delete(relativePath: string): Promise<void>;
}
