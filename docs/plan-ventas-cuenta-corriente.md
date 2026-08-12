# Plan: Ventas — cuenta corriente, cobros y cheques

Documento de planificación. No implementa nada todavía — es la base para ir avanzando por fases una vez que esté validado.

## 1. Punto de partida (qué hay hoy)

Corrigiendo el planteo inicial: `Boleta` no "centraliza" ventas en un sentido rígido — hoy ya es exactamente lo que se pide en el punto 1: un encabezado liviano (cliente + fecha + número + comentarios) que agrupa líneas de `Venta` (cada garrón/media res/pulpa entregado). El operario carga boleta + ítems sin precio desde el celular; el administrativo completa `precioKg` por línea después (`SetPrecioVenta`). Eso ya cubre los puntos 1 y 2 de las anotaciones.

Punto 3 (peso por tropa): el kg ya se carga por línea de venta al momento de repartir, ligado a la `compraId` (tropa). No hay un paso de "pesaje" separado — si se necesita uno, es una variante a definir (ver sección 7).

Punto 7 (existencias): al cerrar una compra (`CerrarCompra`) ya se reconcilia que las cabezas vendidas coincidan con las compradas, y bloquea el cierre si no coinciden. No existe hoy una vista en tiempo real de "cabezas pendientes de repartir" de una tropa abierta — es una mejora posible, no un bug.

**Lo que no existe en absoluto hoy:** cuenta corriente, cobros, medios de pago, cheques/echeqs, y cualquier dato de fecha de cobro para reportes futuros. Puntos 4, 5 y 6 son 100% nuevos.

## 2. Decisiones ya tomadas (respuestas del formulario)

- **Aplicación de pagos:** FIFO automático — un cobro cubre primero las boletas más viejas con saldo pendiente.
- **Plazo de pago:** configurable por cliente, 7 días por defecto si no se especifica (mismo patrón que `Proveedor.porcentajeDesbaste`).
- **Estados de cheque/echeq a trackear:** En cartera, Depositado, Acreditado, Rechazado, Endosado a terceros.
- **Alcance contable:** por ahora solo cuenta corriente y cobros. Asientos contables y estado de resultado quedan para una fase futura — pero el modelo de datos se diseña para no tener que refactorizar cuando se aborden.
- **Quién carga cobros:** admin y contable (mismo `RoleGroups.AdminAndContable` que ya se usa en clientes/proveedores/compras).
- **Prioridad:** diseño completo primero, fases después (sección 8 propone un orden sugerido).

## 3. Modelo de dominio nuevo

### 3.1. `Cliente.diasPlazoPago`

`number | null` — nullable, si no está cargado se usa un default global de 7 días. Mismo patrón que `Proveedor.porcentajeDesbaste`.

### 3.2. `Boleta.fechaVencimiento`

Se calcula UNA vez, al crear la boleta: `boleta.fecha + diasPlazoPago(cliente)`. No se recalcula si después cambia el plazo del cliente (el plazo pactado es el vigente al momento de la entrega). Esto evita tener que hacer el cálculo en cada consulta de saldo vencido.

⚠️ Caso de borde real: si el administrativo tarda en cargar los precios, el vencimiento corre igual aunque el monto de la boleta todavía no se conozca. Una boleta con ventas sin precio no debería contar en el saldo (no se sabe cuánto es), pero si vence antes de tener precio cargado, conviene poder detectarlo (ver "alertas" en la sección 7 de mejoras opcionales).

### 3.3. `Cobro` (nuevo módulo `modules/cobros`)

Header, mismo patrón que `Boleta`/`Venta`: un cobro agrupa una o más líneas (el cliente puede pagar con 2 cheques + efectivo en una sola visita).

```
Cobro
  id, empresaId, clienteId, fecha, comentarios, activo, createdAt, updatedAt

LineaCobro
  id, cobroId, medioPago (MedioPago), monto
  chequeId  // solo si medioPago es CHEQUE o ECHEQ
```

```ts
enum MedioPago {
  EFECTIVO,
  TRANSFERENCIA_BANCO,
  BILLETERA_VIRTUAL,
  CHEQUE,
  ECHEQ,
}
```

Al crear un `Cobro`, el use-case `CreateCobro`:
1. Crea el header + las líneas.
2. Por cada línea `CHEQUE`/`ECHEQ`, crea el `Cheque` asociado (datos del cheque van en el payload de esa línea).
3. Dispara la aplicación FIFO (`AplicarCobroFifo`) contra las boletas del cliente con saldo pendiente, ordenadas por `fecha` ascendente.
4. Si el monto del cobro excede el total adeudado, el remanente queda como saldo a favor (reduce automáticamente la próxima boleta que se genere).

### 3.4. `AplicacionCobro` (tabla de unión, no es una "pantalla")

```
AplicacionCobro
  id, cobroId, boletaId, monto, createdAt
```

Permite que un cobro cubra parcialmente una boleta, o varias boletas, sin ambigüedad. El saldo de una boleta puntual = `montoBoleta - sum(AplicacionCobro.monto donde boletaId = X)`.

### 3.5. `Cheque` (nuevo módulo `modules/cheques`)

Vive aparte de `Cobro` porque su ciclo de vida sigue después de que el cobro ya "cerró" (puede tardar semanas en acreditarse, rechazarse, o endosarse a un proveedor).

```
Cheque
  id, empresaId, clienteId, lineaCobroId
  numero, banco, cuitLibrador, titular
  fechaEmision, fechaPago (vencimiento del cheque)
  monto
  estado (EstadoCheque)
  fechaUltimoCambioEstado
  motivoRechazo (nullable, solo si estado = RECHAZADO)
  comentarios
  createdAt, updatedAt
```

```ts
enum EstadoCheque {
  EN_CARTERA,
  DEPOSITADO,
  ACREDITADO,
  RECHAZADO,
  ENDOSADO_A_TERCEROS,
}
```

El tipo (cheque físico vs echeq) no necesita campo propio — ya está implícito en si la `LineaCobro` que lo originó era `CHEQUE` o `ECHEQ`.

`ActualizarEstadoCheque` es un use-case simple: cambia `estado` + `fechaUltimoCambioEstado`, exige `motivoRechazo` si el nuevo estado es `RECHAZADO`.

### 3.6. Cuenta corriente — capa de agregación, sin tablas propias

`modules/cuenta-corriente` no persiste nada: lee `Boleta`+`Venta` (cargos) y `Cobro`+`AplicacionCobro` (abonos) y arma:

- **Movimientos**: lista cronológica de boletas (cargo) y cobros (abono) de un cliente.
- **Saldo total** = Σ montos de boletas completamente facturadas − Σ cobros aplicados.
- **Saldo vencido** = Σ saldo pendiente de boletas con `fechaVencimiento < hoy`.
- **Saldo a vencer** = saldo total − saldo vencido.

Se calcula on-demand (query agregada), no como un contador que se va actualizando — mismo criterio que `CerrarCompra` calcula `rinde` a partir de los datos reales en vez de mantener un acumulador aparte. Si el volumen crece y esto se vuelve lento, se puede materializar en una tabla de snapshot más adelante sin cambiar la interfaz pública.

Una boleta con ventas sin precio queda fuera del cálculo de saldo hasta que todas sus líneas tengan `precioKg` — no se puede facturar un monto que no se conoce.

## 4. Endpoints (alto nivel)

| Método | Ruta | Rol |
|---|---|---|
| `POST` | `/cobros` | Admin/contable |
| `GET` | `/cobros?clienteId=` | Admin/contable |
| `GET` | `/clientes/:id/cuenta-corriente` | Admin/contable |
| `GET` | `/clientes/:id/cuenta-corriente/resumen.pdf` \| `.xlsx` | Admin/contable |
| `GET` | `/cheques?estado=&clienteId=` | Admin/contable |
| `PATCH` | `/cheques/:id/estado` | Admin/contable |
| `PATCH` | `/clientes/:id` | ya existe — se le suma `diasPlazoPago` |

## 5. Frontend (alto nivel)

- **Cuenta corriente por cliente**: nueva pestaña/página en el detalle de cliente — saldo vencido/a vencer arriba, listado de movimientos (boletas cargo, cobros abono) abajo, botón "Registrar cobro" (form con líneas de medio de pago; si es cheque/echeq, pide los datos del cheque en la misma línea).
- **Cartera de cheques**: listado global con filtro por estado/cliente, acción para cambiar estado (con motivo si es rechazo).
- **Resumen de cuenta**: botón para descargar PDF/Excel del período — reusa la infraestructura de `pdfkit`/`exceljs` ya armada para boletas.
- **Listado de clientes**: columna/indicador de saldo vencido, para ver de un vistazo quién debe.

## 6. Lo que queda deliberadamente afuera (por ahora)

Por la respuesta de "alcance contable": no se construyen todavía plan de cuentas, asientos contables, estado de resultado ni flujo de caja. Lo que SÍ se hace ahora es dejar bien modeladas las fechas (`Boleta.fecha`, `Cobro.fecha`, `Cheque.fechaEmision/fechaPago`) y los medios de pago, para que esos reportes se puedan construir después sin tener que rehacer el modelo de datos.

Tampoco se automatiza el envío del resumen de cuenta "día por medio" — eso requiere integrar email/WhatsApp y tareas programadas, que son infraestructura nueva. El resumen queda disponible para descargar/enviar a mano; automatizarlo es un paso natural después de tener el módulo andando.

## 7. Mejoras opcionales (no bloquean el resto, se pueden sumar cuando convenga)

- **Alerta de boletas sin precio vencidas**: listado de boletas cuyo `fechaVencimiento` ya pasó pero todavía tienen ventas sin `precioKg` — para que el administrativo no las pierda de vista.
- **Cabezas pendientes por tropa**: en el selector de tropa al cargar una boleta, mostrar cuántas cabezas quedan sin repartir de esa compra (hoy la reconciliación solo se ve al cerrar la compra).

## 8. Orden sugerido para avanzar (a decidir)

1. **Base**: `Cliente.diasPlazoPago` + `Boleta.fechaVencimiento`. Chico, no rompe nada existente.
2. **Cobros**: módulo `cobros` + `AplicacionCobro` con FIFO + cálculo de saldo cliente. El corazón de la cuenta corriente.
3. **Cheques**: módulo `cheques` con sus estados. Depende de (2) porque nace de una línea de cobro.
4. **Resumen de cuenta**: reportes PDF/Excel + pantallas de frontend (cuenta corriente por cliente, cartera de cheques).
5. **Futuro, fuera de este alcance**: asientos contables, estado de resultado, envío automático de resúmenes.
