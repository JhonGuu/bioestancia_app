import * as XLSX from "xlsx";

import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { CeldaCruda, normalizarEncabezado } from "@/modules/contabilidad/infra/import/excel-reader.util";

/**
 * Fila cruda de la planilla histórica de compras/tropas ("ABASTO CERDO" en
 * `COMPRAS PARA JUAN.xlsx`). Un archivo real de este tipo trae una sola hoja,
 * una fila por tropa comprada+faenada, con el encabezado en la fila 2 (la
 * fila 1 tiene celdas sueltas de referencia/`#REF!`, no encabezados) — por
 * eso este parser busca la fila de encabezado por contenido en vez de asumir
 * una posición fija, mismo criterio que `PlanillaHistorica` (boletas).
 *
 * Los nombres de campo acá son deliberadamente descriptivos del texto
 * original de la columna (no ya del dominio de la app) — el mapeo a
 * `Compra`/`CompraCategoria`/`ResultadoFaena`/`LiquidacionCompra`/
 * `LiquidacionFaena` vive en el use-case de previsualización, no acá.
 */
export interface FilaPlanillaCompra {
  /** Número de fila tal cual se ve en la planilla (1-based). */
  numero: number;
  fechaCarga: CeldaCruda;
  fechaFaena: CeldaCruda;
  /** Criadero/proveedor que vendió la tropa — se resuelve por nombre contra `Proveedor`. */
  lugarCarga: CeldaCruda;
  remitoCriadero: CeldaCruda;
  numeroTropa: CeldaCruda;
  /** Casi siempre vacío en los datos reales (solo ~20 de 484 filas lo traen) — con placeholder cuando falta. */
  liqDeCompra: CeldaCruda;
  /** Establecimiento faenador — se resuelve por nombre contra `Frigorifico`. Nullable: no toda fila lo trae. */
  lugarFaena: CeldaCruda;
  dte: CeldaCruda;
  /** Composición de categorías en texto libre, ej. "150 CAPON" o "80 CAP + 80 MEI" — ver `parsearComposicionAnimal`. */
  animal: CeldaCruda;
  precioKgSinIva: CeldaCruda;
  precioKgConIva: CeldaCruda;
  cantCargados: CeldaCruda;
  kgBrutoJaula: CeldaCruda;
  kgNetoJaula: CeldaCruda;
  kgRendidos: CeldaCruda;
  /** Columna "Faena" — lo que cobra el frigorífico por faenar, base de `LiquidacionFaena`. */
  gastoFaena: CeldaCruda;
  /** Columna "GANANCIA" del Excel — dato de REFERENCIA (no se recalcula), ver decisión en el plan de carga inicial. */
  gananciaReferencia: CeldaCruda;
  /** Columna "RENTABILIDAD BRUTA FACTURADA" del Excel — dato de REFERENCIA, mismo criterio. */
  rentabilidadReferencia: CeldaCruda;
}

type CampoPlanillaCompra = Exclude<keyof FilaPlanillaCompra, "numero">;

/** Candidatos normalizados (ver `normalizarEncabezado`) por campo, tolerantes a mayúsculas/tildes/espacios. */
const CANDIDATOS_POR_CAMPO: Record<CampoPlanillaCompra, string> = {
  fechaCarga: "fechadecarga",
  fechaFaena: "fechafaena",
  lugarCarga: "lugardecarga",
  remitoCriadero: "nremitocriadero",
  numeroTropa: "ntropa",
  liqDeCompra: "liqdecompra",
  lugarFaena: "lugardefaena",
  dte: "dte",
  animal: "animal",
  precioKgSinIva: "kgdeanimalenpiesiniva",
  precioKgConIva: "kgdeanimalenpieconiva",
  cantCargados: "cantdeanimcargados",
  kgBrutoJaula: "kgbrutojaula",
  kgNetoJaula: "kgnetojaula",
  kgRendidos: "kgrendidos",
  gastoFaena: "faena",
  gananciaReferencia: "ganancia",
  rentabilidadReferencia: "rentabilidadbrutafacturada",
};

/** Filas a partir de la que se busca el encabezado (0-based) — cubre casos con alguna fila suelta extra antes. */
const MAX_FILAS_A_BUSCAR_ENCABEZADO = 5;

/**
 * Parser de la planilla histórica de compras/tropas. A diferencia de
 * `PlanillaHistorica` (boletas, una hoja por cliente) esta planilla trae UNA
 * sola hoja con todas las tropas — no hace falta parsear el libro una sola
 * vez y reusarlo, `desdeBuffer` ya deja todo listo.
 */
export class PlanillaCompras {
  private constructor(private readonly filas: FilaPlanillaCompra[]) {}

  static desdeBuffer(buffer: Buffer): PlanillaCompras {
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    } catch {
      throw new ApiError("No se pudo leer el archivo — ¿es un .xls/.xlsx válido?", Code.BAD_REQUEST);
    }

    const nombreHoja = workbook.SheetNames[0];
    const worksheet = nombreHoja ? workbook.Sheets[nombreHoja] : undefined;
    if (!worksheet) throw new ApiError("El archivo no tiene ninguna hoja", Code.BAD_REQUEST);

    const filasCrudas = XLSX.utils.sheet_to_json<CeldaCruda[]>(worksheet, {
      header: 1,
      raw: true,
      defval: null,
    });

    const indiceEncabezado = PlanillaCompras.buscarFilaEncabezado(filasCrudas);
    if (indiceEncabezado === null) {
      throw new ApiError(
        'No se encontró la fila de encabezado (se esperaba una fila con "Fecha de carga" y "Nº tropa")',
        Code.BAD_REQUEST,
      );
    }

    const indicePorCampo = PlanillaCompras.mapearColumnas(filasCrudas[indiceEncabezado] ?? []);
    const faltantes = (Object.keys(CANDIDATOS_POR_CAMPO) as CampoPlanillaCompra[]).filter(
      (campo) => indicePorCampo[campo] === undefined,
    );
    if (faltantes.length > 0) {
      throw new ApiError(
        `No se reconocieron todas las columnas esperadas (faltan: ${faltantes.join(", ")})`,
        Code.BAD_REQUEST,
      );
    }

    const filas: FilaPlanillaCompra[] = [];
    for (let i = indiceEncabezado + 1; i < filasCrudas.length; i++) {
      const filaCruda = filasCrudas[i] ?? [];
      const fila: Partial<FilaPlanillaCompra> = { numero: i + 1 };
      let vacia = true;
      for (const campo of Object.keys(CANDIDATOS_POR_CAMPO) as CampoPlanillaCompra[]) {
        const indice = indicePorCampo[campo]!;
        const valor = filaCruda[indice] ?? null;
        fila[campo] = valor;
        if (valor !== null && valor !== "") vacia = false;
      }
      if (vacia) continue; // fila totalmente vacía — no cuenta como dato
      filas.push(fila as FilaPlanillaCompra);
    }

    return new PlanillaCompras(filas);
  }

  /** Todas las filas de datos (post-encabezado), incluidas las vacías de campos puntuales — la validación fila por fila la hace el use-case. */
  listarFilas(): FilaPlanillaCompra[] {
    return this.filas;
  }

  private static buscarFilaEncabezado(filasCrudas: CeldaCruda[][]): number | null {
    for (let i = 0; i < Math.min(MAX_FILAS_A_BUSCAR_ENCABEZADO, filasCrudas.length); i++) {
      const normalizados = (filasCrudas[i] ?? []).map((c) => normalizarEncabezado(c));
      const tieneFecha = normalizados.includes(CANDIDATOS_POR_CAMPO.fechaCarga);
      const tieneNumeroTropa = normalizados.includes(CANDIDATOS_POR_CAMPO.numeroTropa);
      if (tieneFecha && tieneNumeroTropa) return i;
    }
    return null;
  }

  private static mapearColumnas(filaEncabezado: CeldaCruda[]): Partial<Record<CampoPlanillaCompra, number>> {
    const indicePorCampo: Partial<Record<CampoPlanillaCompra, number>> = {};
    filaEncabezado.forEach((valor, indice) => {
      const normalizado = normalizarEncabezado(valor);
      for (const [campo, candidato] of Object.entries(CANDIDATOS_POR_CAMPO) as [CampoPlanillaCompra, string][]) {
        if (candidato === normalizado && indicePorCampo[campo] === undefined) {
          indicePorCampo[campo] = indice;
        }
      }
    });
    return indicePorCampo;
  }
}

/** Categoría porcina simplificada que distingue esta planilla — se traduce a `CategoriaPorcino` en el use-case. */
export type CategoriaAnimalPlanilla = "CAPON" | "MEI" | "CHANCHA";

const CATALOGO_PALABRA_CATEGORIA: Record<string, CategoriaAnimalPlanilla> = {
  CAP: "CAPON",
  CAPON: "CAPON",
  CAPONES: "CAPON",
  CAPOM: "CAPON", // typo real de la planilla ("38 MEI + 92 CAPOM")
  MEI: "MEI",
  CHA: "CHANCHA",
  CERDA: "CHANCHA",
  CERDAS: "CHANCHA",
  CHANCHA: "CHANCHA",
};

export interface ComposicionAnimal {
  categoria: CategoriaAnimalPlanilla;
  /** `null` cuando la planilla no trae un número explícito para esta categoría puntual (fila de una sola categoría, ej. "CAPON" a secas) — el use-case completa con `Cant. de anim. Cargados`. */
  cabezas: number | null;
}

/**
 * Parsea la columna "Animal" — texto libre que mezcla cantidad y categoría,
 * ej. "150 CAPON", "80 CAP + 80 MEI", "99 CAP y 61 MEI", "MEI 176 + CAPON 51"
 * (número antes o después de la palabra, separadas por "+" o "y"/"Y").
 * Devuelve `null` si alguna porción no matchea el catálogo cerrado de
 * palabras conocidas — el use-case NO adivina, esa fila queda como error
 * (mismo criterio que `mapearFormaVenta`/`mapearConceptoPago`).
 */
export function parsearComposicionAnimal(texto: string): ComposicionAnimal[] | null {
  const normalizado = texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .trim()
    .replace(/\s+/g, " ");
  if (!normalizado) return null;

  const porciones = normalizado.split(/\+|\bY\b/);
  const resultado: ComposicionAnimal[] = [];
  for (const porcionCruda of porciones) {
    const porcion = porcionCruda.trim().replace(/\.$/, "");
    if (!porcion) continue;

    const match = /^(\d+)?\s*([A-Z]+)\s*(\d+)?$/.exec(porcion);
    if (!match) return null;
    const [, numeroAntes, palabra, numeroDespues] = match;
    const categoria = CATALOGO_PALABRA_CATEGORIA[palabra ?? ""];
    if (!categoria) return null;

    const numeroTexto = numeroAntes ?? numeroDespues;
    resultado.push({ categoria, cabezas: numeroTexto ? Number(numeroTexto) : null });
  }
  return resultado.length > 0 ? resultado : null;
}
