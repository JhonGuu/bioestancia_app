import { Fichaje, OrigenFichaje, TipoFichaje } from "@/modules/personal/domain/fichaje";
import { HorarioEmpleado } from "@/modules/personal/domain/horario-empleado";
import { EstadoJornada, Jornada, ParFichaje } from "@/modules/personal/domain/jornada";

export interface CalcularJornadasEmpleadoParams {
  empleadoId: string;
  /** Inclusive, medianoche UTC. */
  desde: Date;
  /** Inclusive, medianoche UTC. */
  hasta: Date;
  /** Puede traer fichajes fuera del rango sin problema — se filtran acá por día. */
  fichajes: Fichaje[];
  /** Horario pactado del empleado, uno por día de semana (0=domingo..6=sábado). Días sin fila = sin horario configurado. */
  horarios: HorarioEmpleado[];
  /** Resultado ya resuelto de la cascada empleado→cargo→empresa. */
  toleranciaMinutos: number;
}

function fechaISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function horasEntre(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60);
}

function horasEntreHorarios(horaEntrada: string, horaSalida: string): number {
  const [he, me] = horaEntrada.split(":").map(Number);
  const [hs, ms] = horaSalida.split(":").map(Number);
  return (hs * 60 + ms - (he * 60 + me)) / 60;
}

function minutosDeDiferencia(momento: Date, fecha: string, horaPactada: string): number {
  const [hp, mp] = horaPactada.split(":").map(Number);
  const pactado = new Date(`${fecha}T00:00:00.000Z`);
  pactado.setUTCHours(hp, mp, 0, 0);
  return (momento.getTime() - pactado.getTime()) / (1000 * 60);
}

/**
 * Empareja los fichajes de UN día, ya ordenados cronológicamente, en pares
 * entrada/salida (ver `docs/plan-personal-asistencia.md`, punto 7). Recorre
 * en orden manteniendo si hay una entrada "abierta": una entrada nueva
 * mientras ya había una abierta cierra la anterior como incompleta (dos
 * entradas seguidas = se perdió la salida de la primera); una salida sin
 * entrada abierta queda como un par incompleto huérfano.
 */
function emparejarFichajesDelDia(fichajesDelDia: Fichaje[]): ParFichaje[] {
  const ordenados = [...fichajesDelDia].sort((a, b) => a.momento.getTime() - b.momento.getTime());
  const pares: ParFichaje[] = [];
  let abierto: Fichaje | null = null;

  for (const fichaje of ordenados) {
    if (fichaje.tipo === TipoFichaje.ENTRADA) {
      if (abierto) pares.push({ entrada: abierto, salida: null });
      abierto = fichaje;
    } else {
      if (abierto) {
        pares.push({ entrada: abierto, salida: fichaje });
        abierto = null;
      } else {
        pares.push({ entrada: null, salida: fichaje });
      }
    }
  }
  if (abierto) pares.push({ entrada: abierto, salida: null });

  return pares;
}

/**
 * Calcula la jornada de un empleado día por día en `[desde, hasta]` —
 * cálculo puro en memoria, sin I/O (ver `ObtenerRentabilidadTropas` para el
 * mismo patrón en otro módulo). La resolución de fichajes/horarios/tolerancia
 * es responsabilidad de `CalcularJornadasEmpleado` (el use-case).
 */
export function calcularJornadasEmpleado(params: CalcularJornadasEmpleadoParams): Jornada[] {
  const horarioPorDia = new Map(params.horarios.map((h) => [h.diaSemana, h]));

  const fichajesPorDia = new Map<string, Fichaje[]>();
  for (const fichaje of params.fichajes) {
    const clave = fechaISO(fichaje.momento);
    const lista = fichajesPorDia.get(clave) ?? [];
    lista.push(fichaje);
    fichajesPorDia.set(clave, lista);
  }

  const jornadas: Jornada[] = [];
  const cursor = new Date(params.desde);

  while (cursor.getTime() <= params.hasta.getTime()) {
    const fecha = fechaISO(cursor);
    const diaSemana = cursor.getUTCDay();
    const horario = horarioPorDia.get(diaSemana) ?? null;
    const esFrancoPactado = !horario || (!horario.horaEntrada && !horario.horaSalida);

    const fichajesDelDia = fichajesPorDia.get(fecha) ?? [];
    const pares = emparejarFichajesDelDia(fichajesDelDia);
    const paresCompletos = pares.filter((p) => p.entrada && p.salida);
    const hayIncompletos = pares.some((p) => !p.entrada || !p.salida);

    const horasTrabajadas =
      Math.round(
        paresCompletos.reduce((acc, p) => acc + horasEntre(p.entrada!.momento, p.salida!.momento), 0) * 100,
      ) / 100;

    const topeHoras =
      horario?.horaEntrada && horario?.horaSalida
        ? Math.max(0, horasEntreHorarios(horario.horaEntrada, horario.horaSalida))
        : 0;
    const horasNormales = Math.round(Math.min(horasTrabajadas, topeHoras) * 100) / 100;
    const horasExtra = Math.max(0, Math.round((horasTrabajadas - horasNormales) * 100) / 100);

    let estado: EstadoJornada;
    if (fichajesDelDia.length === 0) {
      estado = esFrancoPactado ? EstadoJornada.FRANCO : EstadoJornada.FALTA;
    } else if (hayIncompletos) {
      estado = EstadoJornada.MARCACION_INCOMPLETA;
    } else {
      estado = EstadoJornada.PRESENTE;
    }

    const primeraEntrada = pares.find((p) => p.entrada)?.entrada ?? null;
    const llegadaTarde =
      !!primeraEntrada &&
      !!horario?.horaEntrada &&
      minutosDeDiferencia(primeraEntrada.momento, fecha, horario.horaEntrada) > params.toleranciaMinutos;

    jornadas.push({
      empleadoId: params.empleadoId,
      fecha,
      estado,
      horarioPactado: horario ? { horaEntrada: horario.horaEntrada, horaSalida: horario.horaSalida } : null,
      pares,
      horasTrabajadas,
      horasNormales,
      horasExtra,
      llegadaTarde,
      toleranciaAplicadaMinutos: params.toleranciaMinutos,
      tieneMarcacionManual: fichajesDelDia.some((f) => f.origen === OrigenFichaje.MANUAL),
    });

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return jornadas;
}
