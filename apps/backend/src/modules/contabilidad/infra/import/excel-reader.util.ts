import * as XLSX from "xlsx";

import { ApiError, Code } from "@/shared/infra/http/api.responses";

/** Una celda cruda tal cual la devuelve `xlsx` sin `cellDates` (ver criterio en `parsearFechaExcel`). */
export type CeldaCruda = string | number | boolean | Date | null | undefined;

/** Quita acentos, pasa a minúsculas y deja solo letras/números — para matchear encabezados y textos de forma tolerante a mayúsculas, tildes y espacios. */
export function normalizarEncabezado(valor: unknown): string {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function celdaATexto(valor: CeldaCruda): string {
  if (valor == null) return "";
  return String(valor).trim();
}

/** "Sí"/"1"/"x"/"true" (tolerante a mayúsculas/tildes) → true; cualquier otra cosa, incluido vacío → false. */
export function parsearBooleano(valor: CeldaCruda): boolean {
  const texto = normalizarEncabezado(valor);
  return texto === "si" || texto === "1" || texto === "x" || texto === "true" || texto === "verdadero";
}

/** Busca el texto normalizado de `valor` dentro de un mapa de candidatos ya normalizados (claves en minúscula sin acentos/espacios). */
export function mapearTexto<T extends string>(valor: CeldaCruda, candidatos: Record<string, T>): T | null {
  const normalizado = normalizarEncabezado(valor);
  return candidatos[normalizado] ?? null;
}

/**
 * Serial de Excel (días desde el 30/12/1899) a `Date` en UTC, o texto en
 * formato `D/M/AA[AA]` o `AAAA-MM-DD`. Mismo criterio "de pared, sin huso
 * horario" que `PrevisualizarImportacionFichajes` — evita que la fecha
 * cambie de día según la zona horaria del proceso que corre el import.
 */
export function parsearFechaExcel(valor: CeldaCruda): Date | null {
  const EPOCH_EXCEL_MS = Date.UTC(1899, 11, 30);
  if (typeof valor === "number" && isFinite(valor)) {
    const fecha = new Date(EPOCH_EXCEL_MS + valor * 86400000);
    return isNaN(fecha.getTime()) ? null : fecha;
  }
  if (valor instanceof Date && !isNaN(valor.getTime())) return valor;

  const texto = celdaATexto(valor);
  if (!texto) return null;

  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(texto);
  if (isoMatch) {
    const [, anioStr, mesStr, diaStr] = isoMatch;
    const fecha = new Date(Date.UTC(Number(anioStr), Number(mesStr) - 1, Number(diaStr)));
    return isNaN(fecha.getTime()) ? null : fecha;
  }

  const diaMesMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(texto);
  if (diaMesMatch) {
    const [, diaStr, mesStr, anioStr] = diaMesMatch;
    const anio = anioStr.length === 2 ? 2000 + Number(anioStr) : Number(anioStr);
    const fecha = new Date(Date.UTC(anio, Number(mesStr) - 1, Number(diaStr)));
    return isNaN(fecha.getTime()) ? null : fecha;
  }

  return null;
}

export interface ColumnaEsperada {
  /** Nombres de encabezado aceptados, ya normalizados (ver `normalizarEncabezado`). */
  candidatos: string[];
  requerida?: boolean;
}

export interface FilaExcel {
  /** Número de fila tal cual se ve en la planilla (la fila 1 es el encabezado). */
  numero: number;
  valores: Record<string, CeldaCruda>;
}

/**
 * Lee la primera hoja de un Excel y mapea sus columnas contra `columnas`
 * (por nombre de encabezado, tolerante a mayúsculas/tildes/espacios).
 * Devuelve una fila por cada fila no vacía del archivo, con sus valores ya
 * indexados por nombre de campo (no por posición de columna).
 *
 * Generaliza el parseo que ya usaba `PrevisualizarImportacionFichajes` para
 * el Excel del lector de huellas, así los tres importadores del módulo
 * contable (plan de cuentas, asientos, saldos iniciales) comparten una sola
 * implementación de "leer el archivo y encontrar las columnas".
 */
export function leerFilasExcel(buffer: Buffer, columnas: Record<string, ColumnaEsperada>): { filas: FilaExcel[] } {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer" });
  } catch {
    throw new ApiError("No se pudo leer el archivo — ¿es un .xls/.xlsx válido?", Code.BAD_REQUEST);
  }

  const nombreHoja = workbook.SheetNames[0];
  const worksheet = nombreHoja ? workbook.Sheets[nombreHoja] : undefined;
  if (!worksheet) throw new ApiError("El archivo no tiene ninguna hoja", Code.BAD_REQUEST);

  const filasCrudas = XLSX.utils.sheet_to_json<CeldaCruda[]>(worksheet, {
    header: 1,
    raw: true,
    defval: "",
  });

  const encabezados = filasCrudas[0] ?? [];
  const indicePorCampo: Partial<Record<string, number>> = {};
  encabezados.forEach((valor, indice) => {
    const normalizado = normalizarEncabezado(valor);
    for (const [campo, def] of Object.entries(columnas)) {
      if (def.candidatos.includes(normalizado) && indicePorCampo[campo] === undefined) {
        indicePorCampo[campo] = indice;
      }
    }
  });

  const faltantes = Object.entries(columnas)
    .filter(([campo, def]) => def.requerida && indicePorCampo[campo] === undefined)
    .map(([campo]) => campo);
  if (faltantes.length > 0) {
    throw new ApiError(
      `No se reconocieron todas las columnas obligatorias del archivo (faltan: ${faltantes.join(", ")}) — descargá la plantilla y respetá los encabezados`,
      Code.BAD_REQUEST,
    );
  }

  const filas: FilaExcel[] = [];
  for (let i = 1; i < filasCrudas.length; i++) {
    const filaCruda = filasCrudas[i];
    const valores: Record<string, CeldaCruda> = {};
    let vacia = true;
    for (const [campo, indice] of Object.entries(indicePorCampo)) {
      const valor = indice !== undefined ? filaCruda[indice] : undefined;
      valores[campo] = valor;
      if (celdaATexto(valor) !== "") vacia = false;
    }
    if (vacia) continue; // fila totalmente vacía — no cuenta como dato ni como error

    filas.push({ numero: i + 1, valores });
  }

  return { filas };
}
