import * as XLSX from "xlsx";

import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { CategoriaVenta } from "@/modules/ventas/domain/categoria-venta";
import { CategoriaPorcino } from "@/modules/compras/domain/categoria-porcino";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";
import { CeldaCruda, celdaATexto, normalizarEncabezado } from "@/modules/contabilidad/infra/import/excel-reader.util";

/**
 * Hojas del libro `VENTAS 2026.xlsm` que NO son la cuenta corriente de un
 * cliente — verificado recorriendo el archivo real: hojas de resumen/apoyo
 * (`DEUDAS`, `PAGOS-ENTREGAS`, `CHEQUES`, etc.) y dos hojas marcadas para
 * excluir (`Echenique NO USAR`, y `Vargas Jooaquin` — duplicado con error de
 * tipeo de `Vargas Joaquin`, confirmado con Juan Jose).
 */
export const HOJAS_NO_CLIENTE = new Set([
  "Ventas",
  "CABEZAS",
  "Referencias",
  "Romi",
  "CHEQUES",
  "DEUDAS",
  "PRECIOS",
  "PAGOS-ENTREGAS",
  "control Ivan",
  "Gramos",
  "Porcentaje de cobranza",
  "PARA IMPRIMIR",
  "Para Facu",
  "Entregas",
  "ResumenCobranza",
  "Echenique NO USAR",
  "Vargas Jooaquin",
]);

export interface FilaPlanillaCliente {
  /** Número de fila tal cual se ve en la planilla. */
  numero: number;
  fecha: CeldaCruda;
  formaVenta: CeldaCruda;
  kg: CeldaCruda;
  concepto: CeldaCruda;
  importe: CeldaCruda;
  tipo: CeldaCruda;
  observaciones: CeldaCruda;
}

const CAMPO_A_ENCABEZADOS: Record<keyof Omit<FilaPlanillaCliente, "numero">, string[]> = {
  fecha: ["fecha"],
  formaVenta: ["formadeventa"],
  kg: ["kg"],
  concepto: ["concepto"],
  importe: ["importe"],
  tipo: ["tipo"],
  observaciones: ["observaciones"],
};

/**
 * Envoltorio sobre un `VENTAS 2026.xlsm` ya parseado — parsear un `.xlsm`
 * de este tamaño (~90 hojas, varios MB) con la librería `xlsx` tarda
 * segundos, así que se hace UNA sola vez acá (`abrirPlanillaHistorica`) y se
 * reusa para las ~80 hojas de cliente. Llamar a `XLSX.read` una vez por hoja
 * (como hacía una versión anterior de este archivo) multiplicaba ese costo
 * por la cantidad de hojas y hacía que la previsualización tardara minutos
 * — verificado con el archivo real de Juan Jose.
 */
export class PlanillaHistorica {
  private constructor(private readonly workbook: XLSX.WorkBook) {}

  static desdeBuffer(buffer: Buffer): PlanillaHistorica {
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, { type: "buffer" });
    } catch {
      throw new ApiError("No se pudo leer el archivo — ¿es un .xlsm/.xlsx válido?", Code.BAD_REQUEST);
    }
    return new PlanillaHistorica(workbook);
  }

  /** Nombres de hoja del libro que se van a tratar como cuenta corriente de un cliente (todas menos `HOJAS_NO_CLIENTE`). */
  listarHojasClientes(): string[] {
    return this.workbook.SheetNames.filter((nombre) => !HOJAS_NO_CLIENTE.has(nombre));
  }

  /**
   * Lee UNA hoja de cliente del formato histórico real de Juan Jose: a
   * diferencia del resto de los importadores de la app, el encabezado NO
   * está en la fila 1 — la hoja arranca con datos de cabecera (nombre del
   * cliente, saldo actual/vencido, contacto) y recién más abajo aparece la
   * tabla `SEM | Fecha | Forma de venta | Cantidad | Kg | Concepto |
   * Importe | Tipo | Observaciones | Saldo | ...` (fila 12 en los archivos
   * reales vistos, pero se busca por contenido en vez de asumir la posición
   * exacta, por si varía de hoja a hoja).
   *
   * Devuelve una fila por cada fila no vacía debajo del encabezado — incluye
   * tanto `Tipo: Venta` como `Tipo: Pago` (el caller filtra según lo que
   * necesite; este importador de boletas usa solo las de `Venta`, el futuro
   * importador de cobros va a usar las de `Pago`).
   */
  leerFilasCliente(nombreHoja: string): FilaPlanillaCliente[] {
    const worksheet = this.workbook.Sheets[nombreHoja];
    if (!worksheet) throw new ApiError(`No existe la hoja "${nombreHoja}" en el archivo`, Code.BAD_REQUEST);

    const filasCrudas = XLSX.utils.sheet_to_json<CeldaCruda[]>(worksheet, { header: 1, raw: true, defval: "" });

    let indiceEncabezado = -1;
    let indicePorCampo: Partial<Record<string, number>> = {};
    for (let i = 0; i < filasCrudas.length; i++) {
      const mapa: Partial<Record<string, number>> = {};
      (filasCrudas[i] ?? []).forEach((valor, indice) => {
        const normalizado = normalizarEncabezado(valor);
        for (const [campo, candidatos] of Object.entries(CAMPO_A_ENCABEZADOS)) {
          if (candidatos.includes(normalizado) && mapa[campo] === undefined) mapa[campo] = indice;
        }
      });
      // El encabezado real de la tabla es la única fila que trae las tres columnas clave juntas.
      if (mapa.fecha !== undefined && mapa.concepto !== undefined && mapa.tipo !== undefined) {
        indiceEncabezado = i;
        indicePorCampo = mapa;
        break;
      }
    }
    if (indiceEncabezado === -1) {
      throw new ApiError(
        `La hoja "${nombreHoja}" no tiene el formato esperado (no se encontró la fila con las columnas Fecha/Concepto/Tipo)`,
        Code.BAD_REQUEST,
      );
    }

    const filas: FilaPlanillaCliente[] = [];
    for (let i = indiceEncabezado + 1; i < filasCrudas.length; i++) {
      const filaCruda = filasCrudas[i] ?? [];
      const get = (campo: keyof typeof indicePorCampo): CeldaCruda => {
        const indice = indicePorCampo[campo];
        return indice !== undefined ? filaCruda[indice] : undefined;
      };
      const fecha = get("fecha");
      const concepto = get("concepto");
      const tipo = get("tipo");
      if (celdaATexto(fecha) === "" && celdaATexto(concepto) === "" && celdaATexto(tipo) === "") continue; // fila vacía

      filas.push({
        numero: i + 1,
        fecha,
        formaVenta: get("formaVenta"),
        kg: get("kg"),
        concepto,
        importe: get("importe"),
        tipo,
        observaciones: get("observaciones"),
      });
    }
    return filas;
  }
}

/** Resultado de mapear el texto de "Forma de venta" al dominio de `ventas`. */
export interface FormaVentaMapeada {
  formaVenta: FormaVenta;
  categoria: CategoriaVenta | null;
}

/**
 * Catálogo verificado corriendo el importador real contra las 80 hojas de
 * cliente de `VENTAS 2026.xlsm` (no una muestra ni una lectura posicional
 * de columnas — el archivo real reveló una variante de texto que un primer
 * relevamiento por columna fija no había detectado). Un valor fuera de esta
 * lista es un dato inesperado que tiene que frenar la importación de esa
 * fila, no adivinarse.
 */
const FORMA_VENTA_MAP: Record<string, FormaVentaMapeada> = {
  cabezacapon: { formaVenta: FormaVenta.CABEZA, categoria: CategoriaPorcino.CAPON },
  cabezachancha: { formaVenta: FormaVenta.CABEZA, categoria: CategoriaPorcino.CERDA_CHANCHA },
  "12rescapon": { formaVenta: FormaVenta.MEDIA_RES, categoria: CategoriaPorcino.CAPON },
  pulpa: { formaVenta: FormaVenta.PULPA, categoria: null },
  compensacionkg: { formaVenta: FormaVenta.COMPENSACION_KG, categoria: null },
  // Variante real encontrada en varias hojas ("compensación de kgs", en
  // minúscula) — mismo signo negativo de kg/importe que "Compensación kg",
  // es el mismo concepto con otra redacción.
  compensaciondekgs: { formaVenta: FormaVenta.COMPENSACION_KG, categoria: null },
};

export function mapearFormaVenta(texto: CeldaCruda): FormaVentaMapeada | null {
  return FORMA_VENTA_MAP[normalizarEncabezado(texto)] ?? null;
}
