import { describe, expect, it, vi } from "vitest";

import { GenerarAsientosAutomaticos } from "@/modules/contabilidad/use-cases/generar-asientos-automaticos.use-case";
import { ReglaAsientoRepository } from "@/modules/contabilidad/domain/regla-asiento.repository";
import { AsientoRepository } from "@/modules/contabilidad/domain/asiento.repository";
import { CuentaRepository } from "@/modules/contabilidad/domain/cuenta.repository";
import { ResolverContextoAsiento } from "@/modules/contabilidad/use-cases/resolver-contexto-asiento.use-case";
import { Asiento, EstadoAsiento, RespaldoAsiento, TipoAsiento } from "@/modules/contabilidad/domain/asiento";
import { Cuenta } from "@/modules/contabilidad/domain/cuenta";
import { TipoCuenta } from "@/modules/contabilidad/domain/tipo-cuenta";
import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import { EventoAsiento, ReglaAsiento } from "@/modules/contabilidad/domain/regla-asiento";
import { Ejercicio, EstadoEjercicio, EstadoPeriodo, Periodo } from "@/modules/contabilidad/domain/ejercicio";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { GenerarAsientosAutomaticosInput } from "@/modules/contabilidad/domain/eventos-contables";

const EMPRESA_ID = "empresa-1";

function cuenta(overrides: Partial<Cuenta> & Pick<Cuenta, "id">): Cuenta {
  return {
    empresaId: EMPRESA_ID,
    codigo: "1.1.01",
    nombre: "Cuenta de prueba",
    tipo: TipoCuenta.ACTIVO,
    parentId: null,
    imputable: true,
    monetaria: true,
    requiereAuxiliar: TipoAuxiliar.NINGUNO,
    activa: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

function reglaConDosLineas(overrides: Partial<ReglaAsiento> = {}): ReglaAsiento {
  return {
    id: "regla-1",
    empresaId: EMPRESA_ID,
    evento: EventoAsiento.COBRO_REGISTRADO,
    nombre: "Cobro en efectivo",
    activa: true,
    prioridad: 1,
    condicion: null,
    lineas: [
      { id: "l1", reglaId: "regla-1", orden: 1, lado: "debe", cuentaId: "caja", expresion: "monto", auxiliarResolver: null },
      {
        id: "l2",
        reglaId: "regla-1",
        orden: 2,
        lado: "haber",
        cuentaId: "deudores",
        expresion: "monto",
        auxiliarResolver: "cliente",
      },
    ],
    ...overrides,
  };
}

function asientoExistente(overrides: Partial<Asiento> = {}): Asiento {
  return {
    id: "asiento-1",
    empresaId: EMPRESA_ID,
    ejercicioId: "ejercicio-1",
    periodoId: "periodo-1",
    numero: null,
    fecha: new Date("2026-01-10"),
    tipo: TipoAsiento.AUTOMATICO,
    estado: EstadoAsiento.BORRADOR,
    respaldo: RespaldoAsiento.SIN_COMPROBANTE,
    descripcion: "Cobro de Juan Pérez",
    origenTipo: "cobro",
    origenId: "cobro-1",
    lineas: [],
    createdAt: new Date("2026-01-10"),
    updatedAt: new Date("2026-01-10"),
    ...overrides,
  };
}

const CONTEXTO_OK = {
  ejercicio: {
    id: "ejercicio-1",
    empresaId: EMPRESA_ID,
    numero: 1,
    nombre: "2026",
    fechaInicio: new Date("2026-01-01"),
    fechaFin: new Date("2026-12-31"),
    estado: EstadoEjercicio.ABIERTO,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  } satisfies Ejercicio,
  periodo: {
    id: "periodo-1",
    ejercicioId: "ejercicio-1",
    anio: 2026,
    mes: 1,
    estado: EstadoPeriodo.ABIERTO,
    cerradoAt: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  } satisfies Periodo,
};

interface ConstruirCasoOpciones {
  reglas?: ReglaAsiento[];
  existente?: Asiento | null;
  cuentas?: Cuenta[];
  contexto?: typeof CONTEXTO_OK | Error;
}

function construirCaso(opciones: ConstruirCasoOpciones = {}) {
  const {
    reglas = [reglaConDosLineas()],
    existente = null,
    cuentas = [cuenta({ id: "caja" }), cuenta({ id: "deudores", requiereAuxiliar: TipoAuxiliar.CLIENTE })],
    contexto = CONTEXTO_OK,
  } = opciones;

  const reglaAsientoRepository: Pick<ReglaAsientoRepository, "listByEvento"> = {
    listByEvento: vi.fn().mockResolvedValue(reglas),
  };
  const asientoRepository: Pick<AsientoRepository, "getByOrigen" | "create" | "update" | "delete"> = {
    getByOrigen: vi.fn().mockResolvedValue(existente),
    create: vi.fn().mockImplementation(async (input) => ({ ...asientoExistente(), ...input, id: "asiento-nuevo" })),
    update: vi.fn().mockImplementation(async (id, _empresaId, input) => ({ ...asientoExistente({ id }), ...input })),
    delete: vi.fn().mockResolvedValue(undefined),
  };
  const cuentaRepository: Pick<CuentaRepository, "list"> = {
    list: vi.fn().mockResolvedValue(cuentas),
  };
  const resolverContexto: Pick<ResolverContextoAsiento, "execute"> = {
    execute: contexto instanceof Error ? vi.fn().mockRejectedValue(contexto) : vi.fn().mockResolvedValue(contexto),
  };

  const useCase = new GenerarAsientosAutomaticos(
    reglaAsientoRepository as ReglaAsientoRepository,
    asientoRepository as AsientoRepository,
    cuentaRepository as CuentaRepository,
    resolverContexto as ResolverContextoAsiento,
  );

  return { useCase, reglaAsientoRepository, asientoRepository, cuentaRepository, resolverContexto };
}

function inputBase(overrides: Partial<GenerarAsientosAutomaticosInput> = {}): GenerarAsientosAutomaticosInput {
  return {
    empresaId: EMPRESA_ID,
    evento: EventoAsiento.COBRO_REGISTRADO,
    origenId: "cobro-1",
    fecha: new Date("2026-01-10"),
    descripcion: "Cobro de Juan Pérez",
    unidades: [{ monto: 1500, medioPago: "efectivo", clienteId: "cliente-1" }],
    ...overrides,
  };
}

describe("GenerarAsientosAutomaticos", () => {
  it("crea un asiento nuevo, balanceado, cuando una regla activa matchea y no había uno previo", async () => {
    const { useCase, asientoRepository } = construirCaso();

    const resultado = await useCase.execute(inputBase());

    expect(resultado).toEqual({ generado: true, advertencia: undefined });
    expect(asientoRepository.create).toHaveBeenCalledTimes(1);
    const lineasCreadas = (asientoRepository.create as ReturnType<typeof vi.fn>).mock.calls[0][0].lineas;
    expect(lineasCreadas).toEqual([
      { cuentaId: "caja", debe: 1500, haber: 0, auxiliarTipo: null, auxiliarId: null, detalle: null, fechaOrigen: inputBase().fecha },
      {
        cuentaId: "deudores",
        debe: 0,
        haber: 1500,
        auxiliarTipo: TipoAuxiliar.CLIENTE,
        auxiliarId: "cliente-1",
        detalle: null,
        fechaOrigen: inputBase().fecha,
      },
    ]);
  });

  it("actualiza (no duplica) el asiento existente en BORRADOR cuando el documento de origen cambia", async () => {
    const { useCase, asientoRepository } = construirCaso({ existente: asientoExistente() });

    const resultado = await useCase.execute(inputBase({ unidades: [{ monto: 2000, medioPago: "efectivo", clienteId: "cliente-1" }] }));

    expect(resultado.generado).toBe(true);
    expect(asientoRepository.create).not.toHaveBeenCalled();
    expect(asientoRepository.update).toHaveBeenCalledWith(
      "asiento-1",
      EMPRESA_ID,
      expect.objectContaining({ lineas: expect.arrayContaining([expect.objectContaining({ debe: 2000 })]) }),
    );
  });

  it("nunca toca un asiento existente que ya está CONFIRMADO — avisa en vez de modificarlo", async () => {
    const { useCase, asientoRepository } = construirCaso({
      existente: asientoExistente({ estado: EstadoAsiento.CONFIRMADO, numero: 5 }),
    });

    const resultado = await useCase.execute(inputBase());

    expect(resultado.generado).toBe(false);
    expect(resultado.advertencia).toMatch(/confirmado/i);
    expect(resultado.advertencia).toMatch(/número 5/);
    expect(asientoRepository.update).not.toHaveBeenCalled();
    expect(asientoRepository.create).not.toHaveBeenCalled();
  });

  it("si ninguna regla matchea una unidad con importe, no genera nada y avisa que falta configurar una regla", async () => {
    const { useCase, asientoRepository } = construirCaso({ reglas: [] });

    const resultado = await useCase.execute(inputBase());

    expect(resultado.generado).toBe(false);
    expect(resultado.advertencia).toMatch(/no tiene una regla de asiento activa/);
    expect(asientoRepository.create).not.toHaveBeenCalled();
  });

  it("una unidad sin ningún importe (todo en cero/undefined) no cuenta como \"sin regla\" — no genera advertencia", async () => {
    const { useCase } = construirCaso({ reglas: [] });

    const resultado = await useCase.execute(inputBase({ unidades: [{ monto: 0 }] }));

    expect(resultado).toEqual({ generado: false, advertencia: undefined });
  });

  it("borra el asiento BORRADOR existente si el documento deja de generar líneas (ej. bajó a $0)", async () => {
    const { useCase, asientoRepository } = construirCaso({ reglas: [], existente: asientoExistente() });

    const resultado = await useCase.execute(inputBase({ unidades: [{ monto: 0 }] }));

    expect(resultado.generado).toBe(true);
    expect(asientoRepository.delete).toHaveBeenCalledWith("asiento-1", EMPRESA_ID);
  });

  it("si el documento ya no debería tener asiento pero el existente no está en BORRADOR, no lo borra — avisa", async () => {
    const { useCase, asientoRepository } = construirCaso({
      reglas: [],
      existente: asientoExistente({ estado: EstadoAsiento.CONFIRMADO, numero: 9 }),
    });

    const resultado = await useCase.execute(inputBase({ unidades: [{ monto: 0 }] }));

    expect(resultado.generado).toBe(false);
    expect(resultado.advertencia).toMatch(/no se tocó/);
    expect(asientoRepository.delete).not.toHaveBeenCalled();
  });

  it("no crea el asiento si las líneas generadas no pasan validarLineasAsiento (ej. cuenta inexistente)", async () => {
    // Solo la cuenta "caja" existe en el plan — "deudores" (la del haber) no.
    const { useCase, asientoRepository } = construirCaso({ cuentas: [cuenta({ id: "caja" })] });

    const resultado = await useCase.execute(inputBase());

    expect(resultado.generado).toBe(false);
    expect(resultado.advertencia).toMatch(/no se pudo generar el asiento automático/i);
    expect(resultado.advertencia).toMatch(/no existe/);
    expect(asientoRepository.create).not.toHaveBeenCalled();
  });

  it("no relanza si resolverContexto tira (ej. ejercicio cerrado) — lo devuelve como advertencia no bloqueante", async () => {
    const { useCase } = construirCaso({
      contexto: new ApiError('El ejercicio "2026" está cerrado', Code.BAD_REQUEST),
    });

    const resultado = await useCase.execute(inputBase());

    expect(resultado.generado).toBe(false);
    expect(resultado.advertencia).toContain('El ejercicio "2026" está cerrado');
  });

  it("prioriza la primera regla activa que matchea, ignorando las de menor prioridad", async () => {
    const reglaGenerica = reglaConDosLineas({ id: "generica", prioridad: 2, condicion: null });
    const reglaEspecifica = reglaConDosLineas({
      id: "especifica",
      prioridad: 1,
      condicion: { medioPago: "efectivo" },
      lineas: [
        {
          id: "l1",
          reglaId: "especifica",
          orden: 1,
          lado: "debe",
          cuentaId: "caja_efectivo",
          expresion: "monto",
          auxiliarResolver: null,
        },
        {
          id: "l2",
          reglaId: "especifica",
          orden: 2,
          lado: "haber",
          cuentaId: "deudores",
          expresion: "monto",
          auxiliarResolver: "cliente",
        },
      ],
    });
    // El repo ya devuelve ordenado por prioridad (lo hace la query real) — acá
    // se simula pasando la más prioritaria primero.
    const { useCase, asientoRepository } = construirCaso({
      reglas: [reglaEspecifica, reglaGenerica],
      cuentas: [
        cuenta({ id: "caja" }),
        cuenta({ id: "caja_efectivo" }),
        cuenta({ id: "deudores", requiereAuxiliar: TipoAuxiliar.CLIENTE }),
      ],
    });

    await useCase.execute(inputBase());

    // Si se hubiera usado la genérica, la línea al debe habría ido a "caja",
    // no a "caja_efectivo" — confirma que ganó la regla de mayor prioridad.
    const lineasCreadas = (asientoRepository.create as ReturnType<typeof vi.fn>).mock.calls[0][0].lineas;
    expect(lineasCreadas[0]).toMatchObject({ cuentaId: "caja_efectivo" });
  });
});
