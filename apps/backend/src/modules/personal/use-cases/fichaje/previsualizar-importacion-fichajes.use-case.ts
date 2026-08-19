import * as XLSX from "xlsx";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { EmpleadoRepository } from "@/modules/personal/domain/empleado.repository";
import { TipoFichaje } from "@/modules/personal/domain/fichaje";
import { filtrarDuplicados, MarcacionParaDedupe } from "@/modules/personal/domain/fichaje-dedupe";
import {
  FilaFichajeMatcheada,
  GrupoFichajeSinMatch,
  PreviewImportacionFichajes,
} from "@/modules/personal/domain/fichaje-import";

export interface PrevisualizarImportacionFichajesInput {
  empresaId: string;
  buffer: Buffer;
}

interface FilaCruda {
  nombre: string;
  momento: Date;
  tipo: TipoFichaje;
}

type CeldaCruda = string | number | boolean | Date | null | undefined;

const EPOCH_EXCEL_MS = Date.UTC(1899, 11, 30);

function normalizarEncabezado(valor: unknown): string {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function celdaATexto(valor: CeldaCruda): string {
  if (valor == null) return "";
  return String(valor).trim();
}

/**
 * Acepta: un serial de Excel (número de días desde el 30/12/1899 — lo que
 * devuelve `xlsx` para celdas de fecha cuando se lee sin `cellDates`, que es
 * a propósito: convertir a `Date` ahí mismo dependería de la zona horaria
 * del proceso que corre el import, mientras que el serial es un número
 * "de pared" sin huso horario — igual criterio que `hoyISO()`/
 * `calcular-jornada.ts`, todo en UTC), o texto en formato `M/D/AA[AA]
 * HH:mm[:ss]` (el que realmente exportan los lectores de huella que
 * probamos — mes primero, NO día primero: "6/25/26" es 25 de junio, no
 * puede ser 6 de "mes 25"). Devuelve `null` si no se pudo interpretar.
 */
function parsearFechaHora(valor: CeldaCruda): Date | null {
  if (typeof valor === "number" && isFinite(valor)) {
    const fecha = new Date(EPOCH_EXCEL_MS + valor * 86400000);
    return isNaN(fecha.getTime()) ? null : fecha;
  }

  if (valor instanceof Date && !isNaN(valor.getTime())) return valor;

  const texto = celdaATexto(valor);
  if (!texto) return null;

  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(texto);
  if (match) {
    const [, mesStr, diaStr, anioStr, horaStr, minStr, segStr] = match;
    const anio = anioStr.length === 2 ? 2000 + Number(anioStr) : Number(anioStr);
    const fecha = new Date(
      Date.UTC(
        anio,
        Number(mesStr) - 1,
        Number(diaStr),
        Number(horaStr),
        Number(minStr),
        segStr ? Number(segStr) : 0,
      ),
    );
    return isNaN(fecha.getTime()) ? null : fecha;
  }

  const fallback = new Date(texto);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/** Columna "Tipo de registro" en texto: "In"/"Entrada" o "Out"/"Salida". */
function parsearTipoTexto(valor: CeldaCruda): TipoFichaje | null {
  const texto = celdaATexto(valor).toLowerCase();
  if (texto === "in" || texto === "entrada") return TipoFichaje.ENTRADA;
  if (texto === "out" || texto === "salida") return TipoFichaje.SALIDA;
  return null;
}

/**
 * Algunos exports del lector no traen la columna "Tipo de registro" — solo
 * "Registro", un código 0/1 que en los archivos reales que probamos siempre
 * correlaciona con entrada/salida (0 = entrada, 1 = salida). Se usa como
 * fallback cuando no hay columna de tipo en texto.
 */
function parsearTipoDesdeCodigoRegistro(valor: CeldaCruda): TipoFichaje | null {
  const texto = celdaATexto(valor);
  if (texto === "0") return TipoFichaje.ENTRADA;
  if (texto === "1") return TipoFichaje.SALIDA;
  return null;
}

const CANDIDATOS_COLUMNA = {
  nombre: ["nombre"],
  momento: ["fechahora", "fecha", "fechayhora"],
  tipoTexto: ["tipoderegistro", "tiporegistro", "tipo"],
  registroNumerico: ["registro"],
};

type CampoColumna = keyof typeof CANDIDATOS_COLUMNA;

/**
 * Primer paso de la importación (ver `docs/plan-personal-asistencia.md`,
 * punto 6): parsea el Excel del lector de huellas, matchea cada nombre
 * contra `Empleado.nombreDispositivo` y descarta duplicados intra-lote (ej.
 * el mismo empleado marcando "In" dos veces a segundos de diferencia). No
 * escribe nada en la base — eso lo hace `ConfirmarImportacionFichajes` una
 * vez que el usuario resuelve a mano los nombres sin match.
 */
@injectable()
export class PrevisualizarImportacionFichajes {
  constructor(
    @inject(DI_TYPES.EmpleadoRepository) private readonly empleadoRepository: EmpleadoRepository,
  ) {}

  async execute(input: PrevisualizarImportacionFichajesInput): Promise<PreviewImportacionFichajes> {
    const { filas, filasConError } = this.parsearArchivo(input.buffer);

    const empleados = await this.empleadoRepository.listConNombreDispositivo(input.empresaId);
    const empleadoPorAlias = new Map(
      empleados.map((e) => [e.nombreDispositivo!.trim().toLowerCase(), e]),
    );

    const marcaciones: (MarcacionParaDedupe & FilaCruda & { empleadoId: string | null; empleadoNombre: string | null })[] =
      filas.map((fila) => {
        const empleado = empleadoPorAlias.get(fila.nombre.trim().toLowerCase()) ?? null;
        return {
          ...fila,
          empleadoId: empleado?.id ?? null,
          empleadoNombre: empleado ? `${empleado.nombre} ${empleado.apellido}` : null,
          grupo: `${empleado?.id ?? fila.nombre.trim().toLowerCase()}:${fila.tipo}`,
          esExistente: false,
        };
      });

    const { conservadas, descartadas } = filtrarDuplicados(marcaciones);

    const matcheadas: FilaFichajeMatcheada[] = conservadas
      .filter((m) => m.empleadoId)
      .map((m) => ({
        empleadoId: m.empleadoId as string,
        empleadoNombre: m.empleadoNombre as string,
        momento: m.momento,
        tipo: m.tipo,
      }));

    const sinMatchPorNombre = new Map<string, GrupoFichajeSinMatch>();
    for (const m of conservadas.filter((m) => !m.empleadoId)) {
      const clave = m.nombre.trim();
      const grupo = sinMatchPorNombre.get(clave) ?? {
        nombreDispositivo: clave,
        cantidad: 0,
        primerMomento: m.momento,
        filas: [],
      };
      grupo.cantidad += 1;
      grupo.primerMomento = grupo.primerMomento < m.momento ? grupo.primerMomento : m.momento;
      grupo.filas.push({ momento: m.momento, tipo: m.tipo });
      sinMatchPorNombre.set(clave, grupo);
    }

    return {
      totalFilas: filas.length + filasConError,
      filasConError,
      duplicadosDescartados: descartadas.length,
      matcheadas: matcheadas.sort((a, b) => a.momento.getTime() - b.momento.getTime()),
      sinMatch: [...sinMatchPorNombre.values()].sort((a, b) => b.cantidad - a.cantidad),
    };
  }

  private parsearArchivo(buffer: Buffer): { filas: FilaCruda[]; filasConError: number } {
    // `xlsx` (SheetJS), NO `exceljs`: exceljs solo lee el formato .xlsx
    // (zip/OOXML) — los exports reales de estos lectores de huella son
    // .xls "viejo" (CFB/BIFF8), un formato binario totalmente distinto que
    // exceljs no puede abrir (tira "Can't find end of central directory").
    // Sin `cellDates`, a propósito: ver comentario de `parsearFechaHora`.
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
    const columnas: Partial<Record<CampoColumna, number>> = {};
    encabezados.forEach((valor, indice) => {
      const normalizado = normalizarEncabezado(valor);
      for (const [campo, candidatos] of Object.entries(CANDIDATOS_COLUMNA) as [CampoColumna, string[]][]) {
        if (candidatos.includes(normalizado) && columnas[campo] === undefined) {
          columnas[campo] = indice;
        }
      }
    });

    if (columnas.nombre === undefined || columnas.momento === undefined) {
      throw new ApiError(
        "No se reconocieron las columnas del archivo (se esperan al menos Nombre y Fecha/Hora)",
        Code.BAD_REQUEST,
      );
    }
    if (columnas.tipoTexto === undefined && columnas.registroNumerico === undefined) {
      throw new ApiError(
        "No se reconoció ninguna columna de tipo de marcación (se espera 'Tipo de registro' o 'Registro')",
        Code.BAD_REQUEST,
      );
    }

    const filas: FilaCruda[] = [];
    let filasConError = 0;

    for (let i = 1; i < filasCrudas.length; i++) {
      const fila = filasCrudas[i];
      const nombre = celdaATexto(fila[columnas.nombre]);
      const momento = parsearFechaHora(fila[columnas.momento]);

      let tipo: TipoFichaje | null = null;
      if (columnas.tipoTexto !== undefined) tipo = parsearTipoTexto(fila[columnas.tipoTexto]);
      if (tipo === null && columnas.registroNumerico !== undefined) {
        tipo = parsearTipoDesdeCodigoRegistro(fila[columnas.registroNumerico]);
      }

      if (!nombre && !momento) continue; // fila vacía, no cuenta como error
      if (!nombre || !momento || !tipo) {
        filasConError++;
        continue;
      }

      filas.push({ nombre, momento, tipo });
    }

    return { filas, filasConError };
  }
}
