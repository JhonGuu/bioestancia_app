/** Dispara la descarga de un `Blob` en el browser vía un `<a download>` invisible. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Saca el `filename="..."` del header `Content-Disposition` que manda
 * `FileResponse` en el backend (ver `ExpressAdapter.register`). Si por algún
 * motivo no viene, usa `fallback` para no dejar la descarga sin nombre.
 */
export function filenameFromContentDisposition(
  headers: Record<string, unknown>,
  fallback: string,
): string {
  const raw = headers["content-disposition"];
  if (typeof raw !== "string") return fallback;
  const match = /filename="?([^"]+)"?/.exec(raw);
  return match?.[1] ?? fallback;
}
