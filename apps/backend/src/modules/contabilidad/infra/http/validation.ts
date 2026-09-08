import { injectable } from "inversify";
import { z } from "zod";

import { EstadoAsiento, RespaldoAsiento, TipoAsiento } from "@/modules/contabilidad/domain/asiento";
import { EstadoEjercicio, EstadoPeriodo } from "@/modules/contabilidad/domain/ejercicio";
import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import { EventoAsiento } from "@/modules/contabilidad/domain/regla-asiento";
import { TipoCuenta } from "@/modules/contabilidad/domain/tipo-cuenta";

const idParams = z.object({ id: z.string().uuid() });

const tipoPlantillaParams = z.object({
  tipo: z.enum(["plan-cuentas", "asientos", "saldos-iniciales"]),
});

const lineaAsiento = z.object({
  cuentaId: z.string().uuid("cuentaId inválido"),
  debe: z.coerce.number().min(0, "El importe no puede ser negativo").default(0),
  haber: z.coerce.number().min(0, "El importe no puede ser negativo").default(0),
  detalle: z.string().max(255).nullish(),
  auxiliarTipo: z.nativeEnum(TipoAuxiliar).nullish(),
  auxiliarId: z.string().uuid().nullish(),
  /** Anticuación de la partida — si no viene, se usa la fecha del asiento. */
  fechaOrigen: z.coerce.date().nullish(),
  centroCostoId: z.string().uuid().nullish(),
});

@injectable()
export class ContabilidadValidation {
  idParams = { params: idParams };

  // ── Plan de cuentas ──────────────────────────────
  crearCuenta = {
    body: z.object({
      codigo: z.string().min(1, "El código es obligatorio").max(20),
      nombre: z.string().min(1, "El nombre es obligatorio").max(150),
      tipo: z.nativeEnum(TipoCuenta),
      parentId: z.string().uuid().nullish(),
      imputable: z.boolean().default(true),
      monetaria: z.boolean().default(false),
      requiereAuxiliar: z.nativeEnum(TipoAuxiliar).optional(),
    }),
  };

  actualizarCuenta = {
    params: idParams,
    body: z.object({
      codigo: z.string().min(1).max(20).optional(),
      nombre: z.string().min(1).max(150).optional(),
      tipo: z.nativeEnum(TipoCuenta).optional(),
      parentId: z.string().uuid().nullish(),
      imputable: z.boolean().optional(),
      monetaria: z.boolean().optional(),
      requiereAuxiliar: z.nativeEnum(TipoAuxiliar).optional(),
      activa: z.boolean().optional(),
    }),
  };

  sembrarPlanCuentas = {
    body: z.object({ forzar: z.boolean().default(false) }),
  };

  // ── Centros de costo ─────────────────────────────
  crearCentroCosto = {
    body: z.object({
      codigo: z.string().min(1, "El código es obligatorio").max(20),
      nombre: z.string().min(1, "El nombre es obligatorio").max(150),
    }),
  };

  actualizarCentroCosto = {
    params: idParams,
    body: z.object({
      codigo: z.string().min(1).max(20).optional(),
      nombre: z.string().min(1).max(150).optional(),
      activo: z.boolean().optional(),
    }),
  };

  // ── Ejercicios y períodos ────────────────────────
  crearEjercicio = {
    body: z.object({
      nombre: z.string().max(100).optional(),
      fechaInicio: z.coerce.date(),
      fechaFin: z.coerce.date(),
    }),
  };

  cambiarEstadoEjercicio = {
    params: idParams,
    body: z.object({ estado: z.nativeEnum(EstadoEjercicio) }),
  };

  cambiarEstadoPeriodo = {
    params: idParams,
    body: z.object({ estado: z.nativeEnum(EstadoPeriodo) }),
  };

  // ── Asientos ─────────────────────────────────────
  listarAsientos = {
    query: z.object({
      ejercicioId: z.string().uuid().optional(),
      periodoId: z.string().uuid().optional(),
      desde: z.coerce.date().optional(),
      hasta: z.coerce.date().optional(),
      tipo: z.nativeEnum(TipoAsiento).optional(),
      estado: z.nativeEnum(EstadoAsiento).optional(),
      respaldo: z.nativeEnum(RespaldoAsiento).optional(),
      cuentaId: z.string().uuid().optional(),
    }),
  };

  crearAsiento = {
    body: z.object({
      fecha: z.coerce.date(),
      descripcion: z.string().min(1, "Poné una descripción").max(255),
      tipo: z.nativeEnum(TipoAsiento).optional(),
      respaldo: z.nativeEnum(RespaldoAsiento).optional(),
      confirmar: z.boolean().default(false),
      lineas: z.array(lineaAsiento).min(2, "El asiento tiene que tener al menos dos líneas"),
    }),
  };

  actualizarAsiento = {
    params: idParams,
    body: z.object({
      fecha: z.coerce.date().optional(),
      descripcion: z.string().min(1).max(255).optional(),
      respaldo: z.nativeEnum(RespaldoAsiento).optional(),
      lineas: z.array(lineaAsiento).min(2).optional(),
    }),
  };

  generarApertura = {
    body: z.object({
      ejercicioId: z.string().uuid(),
      fecha: z.coerce.date().optional(),
      descripcion: z.string().max(255).optional(),
      cuentaAjusteId: z.string().uuid().nullish(),
      confirmar: z.boolean().default(false),
      saldos: z
        .array(
          z.object({
            cuentaId: z.string().uuid(),
            importe: z.coerce.number(),
            auxiliarTipo: z.nativeEnum(TipoAuxiliar).nullish(),
            auxiliarId: z.string().uuid().nullish(),
            detalle: z.string().max(255).nullish(),
          }),
        )
        .min(1, "Cargá al menos un saldo inicial"),
    }),
  };

  // ── Reportes ─────────────────────────────────────
  libroDiario = {
    query: z.object({
      ejercicioId: z.string().uuid().optional(),
      periodoId: z.string().uuid().optional(),
      desde: z.coerce.date().optional(),
      hasta: z.coerce.date().optional(),
      tipo: z.nativeEnum(TipoAsiento).optional(),
      estado: z.nativeEnum(EstadoAsiento).optional(),
      respaldo: z.nativeEnum(RespaldoAsiento).optional(),
      cuentaId: z.string().uuid().optional(),
      incluirBorradores: z.coerce.boolean().optional(),
    }),
  };

  mayorCuenta = {
    query: z.object({
      cuentaId: z.string().uuid(),
      desde: z.coerce.date().optional(),
      hasta: z.coerce.date().optional(),
      auxiliarId: z.string().uuid().optional(),
    }),
  };

  sumasYSaldos = {
    query: z.object({
      ejercicioId: z.string().uuid().optional(),
      desde: z.coerce.date().optional(),
      hasta: z.coerce.date().optional(),
    }),
  };

  // ── Importación por Excel ────────────────────────
  // Los endpoints de "preview" no tienen body JSON — reciben el archivo por
  // multipart (ver `upload.single("archivo")` en el controller, mismo
  // criterio que `FichajeValidation.previsualizar`).
  previsualizarImportacion = {};
  plantillaImportacion = { params: tipoPlantillaParams };

  confirmarImportacionPlanCuentas = {
    body: z.object({
      filas: z
        .array(
          z.object({
            fila: z.number(),
            codigo: z.string().min(1).max(20),
            nombre: z.string().min(1).max(150),
            tipo: z.nativeEnum(TipoCuenta),
            codigoPadre: z.string().nullable(),
            imputable: z.boolean(),
            monetaria: z.boolean(),
            requiereAuxiliar: z.nativeEnum(TipoAuxiliar),
          }),
        )
        .min(1, "No hay cuentas para importar"),
    }),
  };

  confirmarImportacionAsientos = {
    body: z.object({
      asientos: z
        .array(
          z.object({
            claveOriginal: z.string(),
            filas: z.array(z.number()),
            fecha: z.string(),
            descripcion: z.string().min(1).max(255),
            tipo: z.nativeEnum(TipoAsiento),
            respaldo: z.nativeEnum(RespaldoAsiento),
            lineas: z.array(lineaAsiento).min(2, "El asiento tiene que tener al menos dos líneas"),
            totalDebe: z.number(),
            totalHaber: z.number(),
          }),
        )
        .min(1, "No hay asientos para importar"),
      confirmar: z.boolean().default(false),
    }),
  };

  // ── Reglas de asiento (fase 2) ────────────────────
  private lineaReglaAsiento = z.object({
    lado: z.enum(["debe", "haber"]),
    cuentaId: z.string().uuid("cuentaId inválido"),
    expresion: z.string().min(1, "Elegí qué importe usa esta línea"),
    auxiliarResolver: z.enum(["cliente", "proveedor", "frigorifico", "cheque"]).nullish(),
  });

  crearReglaAsiento = {
    body: z.object({
      evento: z.nativeEnum(EventoAsiento),
      nombre: z.string().min(1, "El nombre es obligatorio").max(150),
      activa: z.boolean().default(true),
      prioridad: z.coerce.number().int().default(0),
      condicion: z.record(z.string()).nullish(),
      lineas: z.array(this.lineaReglaAsiento).min(1, "La regla necesita al menos una línea"),
    }),
  };

  actualizarReglaAsiento = {
    params: idParams,
    body: z.object({
      nombre: z.string().min(1).max(150).optional(),
      activa: z.boolean().optional(),
      prioridad: z.coerce.number().int().optional(),
      condicion: z.record(z.string()).nullish(),
      lineas: z.array(this.lineaReglaAsiento).min(1).optional(),
    }),
  };
}
