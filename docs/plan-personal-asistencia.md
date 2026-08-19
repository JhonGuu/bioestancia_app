# Plan: módulo de Personal (asistencia y control de horas)

## Alcance decidido

- Solo asistencia y horas: fichajes, horas normales/extra, ausencias, balance de horas extra por empleado. **Sin cálculo de sueldos/nómina** — eso sigue por fuera del sistema, como hoy.
- Ingesta de datos: subiendo el Excel que exporta el lector de huellas (igual que ahora), sin integración directa al dispositivo.
- Compensación de horas entre empleados: el sistema **muestra el balance** de horas extra acumuladas por empleado; la decisión de a quién no asignarle extras la semana siguiente la sigue tomando el administrativo, a mano.
- Horarios pactados: **fijos por empleado y día de la semana** (ej. Lu-Vi 8 a 17, franco los domingos), configurados una vez y editados solo cuando cambia el pacto real.
- Tolerancia de llegada tarde: **configurable en 3 niveles** — general (empresa), por cargo, o por empleado puntual (ver modelo de datos).
- Balance de horas extra: la vista deja **elegir el período** (semanal, quincenal o mensual) en vez de tener uno fijo.
- Múltiples entradas/salidas por día: **sí es un caso real** — un empleado puede marcar salida y volver a marcar entrada más de una vez en el mismo día (ej. se fue a hacer algo personal) y esas horas "afuera" no se le imputan como trabajadas.
- Gestión de usuarios: se agrega una **pantalla de administración de usuarios** (crear, editar, desactivar, asignar rol) — reutiliza endpoints que YA existen en el backend. Los roles siguen siendo los que ya están en código (admin/contable/veterinario/operario, más los que se agreguen a futuro); no se construyen permisos dinámicos por pantalla en esta etapa.

## Lo que releva de los dos Excel

**`HORAS mayo.xls`** (lo que manda el lector de huellas): una fila por marcación, columnas `Nombre`, `Fecha/Hora` (fecha y hora juntas en un mismo valor), `Registro` (0/1, sin uso claro), `Tipo de registro` (`In`/`Out`), `Posición` (casi siempre vacía). Encontré:
- **Marcaciones duplicadas**: el mismo empleado con dos `In` seguidos a segundos de diferencia (ej. Jonatan Carrizo, 07:49:47 y 07:49:51) — hay que filtrarlas al importar.
- **Nombres truncados por el dispositivo**: `"Matias Sil"`, `"Enzo Cuell"`, `"Quiroga Pa"`, `"Juan Jose corzo"` — no coinciden textualmente con los nombres completos que usás en la planilla (`MATIAS SILVA`, `CUELLO ENZO`, `QUIROGA PABLO`, `CORZO JUAN JOSE`). El matcheo automático por nombre exacto **no va a funcionar** — hace falta un mapeo explícito por empleado (ver más abajo).

**`Horas del personal.xlsx`** (la planilla que llenan a mano hoy): una hoja por empleado con columnas `Entrada de huella` (marcación real), `Entrada`/`Hora citada` (horario pactado ese día), `Salida`, `Horas`, `Normales` (tope diario, ej. 9 hs), `Extras` (lo que excede el tope), `Observaciones` (texto libre: tardanzas justificadas, disposiciones puntuales). Además:
- Hoja **`RECUENTO DE HORAS`**: totales por empleado y mes, un `Estado` (`OK`/otros), y una distinción entre personal de horario **FIJO** y **ROTATIVO** (este último con un compañero asignado que lo cubre).
- Hoja **`NOVEDADES`**: notas semanales sueltas (quién cubre a quién, casos puntuales) y un resumen de horas extra acumuladas por empleado.
- El archivo pesa 52 MB por rango de filas usado mucho más grande que los datos reales (una hoja de empleado llega a fila ~37.900) — no es un problema para el sistema nuevo, solo explica el tamaño del archivo actual.

## Modelo de datos propuesto

Siguiendo el mismo patrón hexagonal del resto del proyecto (catálogos tipo Proveedores/Frigoríficos + un módulo de cálculo sin tabla propia, como `informes-compras`):

1. **`Cargo`** (catálogo chico, como `Frigorifico`): `id`, `nombre` (ej. "Administrativo", "Operario de faena"), `activo`, y opcionalmente `toleranciaMinutos` (ver punto 3). Solo hace falta si querés agrupar tolerancia (o a futuro otras reglas) por puesto en vez de cargarla persona por persona.

2. **`Empleado`** (catálogo, como `Proveedor`/`Frigorifico`) — el legajo básico, agrupado igual que lo pediste:

   **Datos personales e identificatorios**: `nombre`, `apellido`, `dni`, `dniArchivoUrl` (copia digitalizada, ver nota de Documentos más abajo), `cuil`, `domicilio`, `telefono`, `fechaNacimiento`, `estadoCivil` (soltero/a, casado/a, divorciado/a, viudo/a, unión convivencial), `contactoEmergenciaNombre`, `contactoEmergenciaTelefono`.

   **Datos laborales y contractuales**: `fechaIngreso`, `cargoId` (FK a `Cargo` — el "puesto"), `categoriaProfesional` (texto libre, ej. "Oficial especializado"), `convenioColectivo` (texto libre, ej. "CCT 122/75"), `tipoContrato` (tiempo indeterminado / plazo fijo / eventual / temporada / pasantía), `modalidad` (presencial / teletrabajo / híbrido), `lugarPrestacionTareas` (texto libre — el horario de trabajo en sí ya lo cubre `HorarioEmpleado`), `datosBancarios` (CBU/alias, mismo campo que ya existe en `Proveedor`).

   Más lo operativo para este módulo: `activo`, `toleranciaMinutos` (opcional — si está cargado, pisa el del cargo), y un campo clave — `nombreDispositivo` (o una lista de alias) para matchear con lo que manda el lector. Se completa una vez por empleado, no hace falta tocarlo salvo que cambie el nombre en el dispositivo o el pacto de horario.

   **Documentos (copia del DNI)**: hoy el proyecto no tiene ningún mecanismo de subida/almacenamiento de archivos (los PDF que genera el sistema los arma él mismo, no recibe archivos del usuario) — hay que sumarlo. Mi recomendación: guardar el archivo en disco en el propio servidor (mismo criterio de bajo-infra que ya usa el proyecto — sin depender de un bucket externo), servido por un endpoint autenticado, no público. Si en algún momento ya usás algo como Google Drive/Dropbox para estos documentos, avisame y lo adapto a eso en vez de disco local.

3. **Tolerancia de llegada tarde** (resolución en cascada, sin tabla extra): `Empleado.toleranciaMinutos` si está cargada → si no, `Cargo.toleranciaMinutos` del cargo del empleado → si no, un default general en `Empresa` (se agrega `toleranciaTardanzaMinutos` a la entidad `Empresa` que ya existe, mismo criterio que se usó para sumar `telefono`/`direccion`). Se usa al calcular si una entrada cuenta como tardanza — no afecta el cómputo de horas en sí (eso ya lo cubre el tope diario de `HorarioEmpleado`).

4. **`HorarioEmpleado`** (sub-recurso de Empleado, como `CompraCategoria` de `Compra`): una fila por `empleadoId` + `diaSemana` (0–6), con `horaEntrada`/`horaSalida` (nulas si ese día es franco). Es lo que reemplaza a la columna "Hora citada" cargada a mano cada vez.

5. **`Fichaje`** (crudo, inmutable): `id`, `empleadoId`, `fecha`, `hora`, `tipo` (`entrada`/`salida`), `origen` (`importado`/`manual`, por si hace falta cargar una marcación a mano — olvido de marcar, etc.). Es la fuente de verdad; nunca se recalcula ni se pisa, solo se agrega. Un mismo día puede tener más de un par entrada/salida.

6. **Importación de fichajes** (use-case, no tabla): sube el `.xls` del lector → separa fecha y hora del campo combinado → intenta matchear `Nombre` contra `Empleado.nombreDispositivo` → si no matchea ninguno, la pantalla de importación pide asignarlo a mano (y opcionalmente guarda el alias para la próxima vez) → descarta duplicados (mismo empleado, mismo tipo, a menos de N minutos de diferencia) → guarda los `Fichaje` nuevos.

7. **Cálculo de jornada** (use-case en memoria, sin tabla — mismo patrón que `ObtenerRentabilidadTropas`): para un empleado y una fecha, toma sus `Fichaje` del día **ordenados cronológicamente y los empareja de a pares** (1ª entrada → 1ª salida, 2ª entrada → 2ª salida, etc.) — el tiempo entre una salida y la siguiente entrada NO cuenta como trabajado. Suma esos intervalos para `horasTrabajadas`, la compara contra `HorarioEmpleado` de ese día para separar `horasNormales` (tope = horario pactado) de `horasExtra` (excedente), y define un `estado`: `presente`, `falta` (tenía horario pactado y no marcó), `franco` (no tenía horario pactado ese día), `marcacion_incompleta` (quedó una entrada sin su salida — típicamente un olvido de marcar). También marca si la primera entrada superó la tolerancia vigente (`llegadaTarde: boolean`).

   **Completar una marcación olvidada**: desde la vista de asistencia vas a poder agregar a mano el `Fichaje` que falta (la entrada o la salida de ese día) — queda guardado con `origen: "manual"`. El día en cuestión sigue mostrando un indicador visible (ej. "completado a mano") aunque ya no esté incompleto, para que quede el rastro de que hubo que corregirlo — no desaparece silenciosamente una vez arreglado.

8. **Balance de horas extra** (use-case, compone lo anterior): suma `horasExtra` por empleado en un período elegido por quien mira la pantalla (semana/quincena/mes) — la vista que reemplaza la hoja `RECUENTO DE HORAS`, para decidir a quién no asignarle extras la semana que viene.

9. **Gestión de usuarios** (reutiliza el módulo `users` que ya existe): el backend ya tiene `POST /account/users` (crear usuario + rol) y `POST /account/access` (dar acceso a un usuario existente) — falta:
   - Un endpoint de **listado** (`GET /account/users`, admin-only) que traiga los usuarios con acceso a la empresa activa y su rol.
   - Un endpoint para **editar rol** de un `UsuarioEmpresa` existente y otro para **desactivar** un usuario (ya existe `isActive` en `User`, ver `auth.types.ts`).
   - La pantalla en sí: tabla de usuarios + rol, botón "Nuevo usuario" (nombre, email, rol), editar rol, activar/desactivar.
   - **Contraseña inicial**: al crear el usuario, el sistema genera una temporal y la muestra una sola vez en pantalla al admin para que se la pase al empleado (por ahora no hay envío de mail configurado en el proyecto — si en algún momento sumamos ese servicio, se puede mandar directo). El usuario nuevo queda marcado para forzar el cambio de contraseña en su primer login — no puede usar el resto del sistema hasta cambiarla.

## Pantallas propuestas

- **Personal** (nueva sección en el menú, como Compras/Ventas): catálogo de empleados con su legajo completo (datos personales + laborales, copia de DNI) y su horario pactado.
- **Importar fichajes**: subir el Excel del lector, ver un resumen de cuántas marcaciones se importaron / cuántos duplicados se descartaron / qué nombres no matchearon (con la resolución manual ahí mismo).
- **Asistencia por empleado**: vista tipo calendario/tabla con el detalle día por día (entradas/salidas, normales, extras, estado, si llegó tarde) — el reemplazo de cada hoja individual de la planilla actual.
- **Balance de horas extra**: tabla con todos los empleados y su acumulado, con selector de período (semanal/quincenal/mensual) — el reemplazo de `RECUENTO DE HORAS`.
- **Usuarios** (nueva, en Configuración/Empresa): tabla de usuarios con acceso a la empresa activa + su rol, alta/edición/baja. Solo Admin.

## Fases sugeridas

1. **Gestión de usuarios** — se puede hacer primero e independiente del resto (reutiliza backend existente, no depende de nada de Personal).
2. **Catálogo de empleados + cargos + horarios pactados + tolerancia** (backend + frontend, CRUD simple, incluye el legajo completo — datos personales, laborales y la subida de la copia del DNI).
3. **Importador de fichajes** (parseo del Excel, dedupe, matcheo/resolución manual de nombres).
4. **Cálculo de jornada + vista de asistencia por empleado** (con el emparejamiento de múltiples entradas/salidas).
5. **Balance de horas extra** (vista con selector de período).
6. *(Opcional, más adelante)* Observaciones/notas por día (para no perder el registro de tardanzas justificadas que hoy cargan a mano), permisos por pantalla completamente dinámicos si en algún momento hace falta, y nómina como módulo aparte.

## Plan cerrado

No quedan decisiones de diseño pendientes — el plan está listo para empezar a construir por la Fase 1 (gestión de usuarios) cuando lo confirmes.
