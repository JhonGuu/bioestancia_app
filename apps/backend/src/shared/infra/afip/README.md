# AFIP (WSAA + WSLSP)

Integración con AFIP para emitir el CAE de la "Liquidación de Compra
Directa" (comprobante que Bioestancia le emite al criadero al comprarle una
tropa) sin cargarla a mano en la web de AFIP.

## Qué hay acá

- `wsaa.client.ts` — autenticación (WSAA). Firma un TRA con el certificado
  del CUIT y pide un ticket (`token`+`sign`) válido 12hs para hablarle a
  WSLSP. Genérico: sirve igual para cualquier otro web service de AFIP el
  día de mañana (WSFE, etc.), no solo WSLSP.
- `wslsp.client.ts` — el servicio de Liquidación Sector Pecuario en sí.
  `dummy()` y `consultarUltimoNroComprobante()` están confirmados contra el
  manual oficial. `autorizarLiquidacionCompraDirecta()` (el que pide el CAE)
  ya usa el método SOAP y la estructura real (ver hallazgo abajo), pero
  todavía tiene gaps de datos — ver el TODO en ese método.
- `wslsp.types.ts` / `categoria-porcino-wslsp.map.ts` — códigos AFIP
  (tipos de comprobante, operación, categorías porcinas, motivo, provincia)
  confirmados.
- `modules/liquidacion-compra/use-cases/emitir-cae-liquidacion-compra.use-case.ts`
  — orquesta todo el flujo (buscar la liquidación, el proveedor, armar la
  solicitud, guardar la respuesta). Expuesto en
  `POST /compras/:compraId/liquidacion/emitir-cae`.

## Hallazgo importante (corregido)

La primera versión de este cliente llamaba al método SOAP
`autorizarLiquidacion`. Investigando más a fondo (ver fuentes abajo) se
confirmó que **el método real es `generarLiquidacion`** — con el nombre
viejo, esto iba a fallar el 100% de las veces contra AFIP, incluso en
homologación. Ya está corregido en `wslsp.client.ts`.

De paso se confirmó que la respuesta trae el CAE anidado bajo
`liquidacion.cabecera.cae` (no plano como estaba antes), y se reconstruyó
la estructura real de la solicitud: `{codOperacion, emisor, receptor,
datosLiquidacion, itemDetalleLiquidacion[], guia[], dte[], tributo[],
gasto[]}` — bastante más rica que la versión plana que había antes.

### Fuentes usadas para reconstruir el esquema

El manual oficial (ver abajo) no se pudo leer completo, así que se cruzó
con dos fuentes externas de referencia, ambas de la misma librería
open-source (LGPL) que implementa este mismo web service:

- **Código real**: https://github.com/reingart/pyafipws/blob/main/wslsp.py
  — de acá sale la confirmación del nombre del método, la estructura
  anidada exacta, y qué campos son opcionales (tienen default `None` en la
  función Python) vs. obligatorios.
- **Documentación**: https://www.sistemasagiles.com.ar/trac/wiki/LiquidacionSectorPecuario
  — de acá salen las tablas de códigos (motivos, provincias, razas).

Esto da bastante más confianza que adivinar a ciegas, pero **no reemplaza
al WSDL real ni al manual completo** — quedan gaps genuinos (ver abajo).

## Qué falta para que esto funcione de verdad

### 1. El certificado digital (trámite, no técnico)

Sin esto nada de lo de acá se puede probar, ni siquiera en homologación:

1. Generar un par clave privada + CSR (`openssl req -new -newkey rsa:2048
   -nodes -keyout privada.key -out pedido.csr`).
2. Entrar a AFIP con clave fiscal → "Administración de Certificados
   Digitales" (o WSASS para el certificado de **homologación**/testing, que
   es más simple de sacar que el de producción).
3. Subir el CSR, descargar el certificado (`.crt`).
4. En el "Administrador de Relaciones de Clave Fiscal", vincular ese
   certificado al servicio **WSLSP** para el CUIT de Bioestancia (o de "El
   Meridiano", el que efectivamente emite — confirmar cuál).
5. Cargar `AFIP_CUIT` / `AFIP_CERT_PATH` / `AFIP_KEY_PATH` /
   `AFIP_WSLSP_PUNTO_VENTA` en el `.env` (ver `.env.example`).

Con el certificado de **homologación** ya se puede probar todo el flujo
contra el ambiente de testing de AFIP (`AFIP_AMBIENTE=homologacion`) sin
arriesgar comprobantes reales. Una vez que exista, pedir el WSDL en vivo
(`{endpoint}?wsdl`) es la forma más confiable de cerrar los gaps que
quedan abajo — es autodescriptivo y no depende de leer el PDF a mano.

### 2. Datos que hay que cargar una sola vez (`.env`)

Ver la sección nueva en `.env.example` (`AFIP_EMISOR_*`,
`AFIP_LUGAR_REALIZACION`, `AFIP_LOCALIDAD_DESTINO`/`AFIP_PROVINCIA_DESTINO`,
`AFIP_MOTIVO`). Son datos fijos de Bioestancia como emisor — no dependen de
cada compra. `AFIP_LOCALIDAD_DESTINO` en particular solo se puede obtener
en vivo contra AFIP (`consultarLocalidadesPorProvincia`), así que va a
quedar pendiente hasta que haya certificado.

### 3. Gaps reales que quedan (no se inventaron valores)

Estos SÍ bloquean poder emitir un CAE real hoy — `WslspClient.
autorizarLiquidacionCompraDirecta` corta con un error explícito antes de
llamar a AFIP si faltan `codigoRaza`/`tipoLiquidacion` por categoría, así
que no hay riesgo de mandarle a AFIP un valor inventado:

- **`raza.codRaza` por ítem**: WSLSP lo pide en cada ítem de la
  liquidación. Hay una tabla de razas porcinas (5201-5299, ej. 5201 =
  Yorkshire/Large-White) pero **no hay un código "sin especificar"** — y
  Bioestancia no registra raza por categoría de compra hoy. Para cerrar
  esto hace falta decidir: (a) empezar a cargar raza por categoría en el
  sistema, o (b) confirmar contra el manual/WSDL si hay un código genérico
  aceptable cuando no se conoce la raza.
- **`tipoLiquidacion` por ítem**: ninguna de las dos fuentes documenta la
  tabla de códigos. El único ejemplo real visto es de hacienda (bovino), no
  de porcino/compra directa, y usa `1` — sin garantía de que aplique igual.
- **`codLocalidadProcedencia`/`codProvinciaProcedencia`**: son la
  localidad/provincia del establecimiento del proveedor. Hoy `Proveedor`
  tiene `provincia` como texto libre, no el código AFIP — falta decidir si
  se agrega ese código al proveedor (mismo patrón que ya tiene `renspa`/
  `codigoAfip`) o se resuelve de otra forma.
- **`operador`** (comisionista intermediario, si lo hay): no quedó claro en
  ninguna fuente si aplica al código de operación 105 (compra directa). No
  se está mandando.

### 4. Probar de punta a punta

Con certificado de homologación y los gaps de arriba resueltos:

1. `wslspClient.dummy()` — confirma que el endpoint/credenciales andan.
2. `wslspClient.consultarUltimoNroComprobante(...)` contra una compra de
   prueba.
3. `EmitirCaeLiquidacionCompra` completo contra una liquidación de prueba en
   homologación (AFIP da CUITs de prueba para esto — ver Tabla 1-5 del
   manual).

Recién ahí pasar a producción.

## Referencia

Manual del desarrollador WSLSP v2.0.3:
https://www.afip.gob.ar/ws/WSLSP/manual_wslsp_2.0.3.pdf (168 páginas; la
extracción automática usada para este módulo solo llegó limpia hasta
~página 44 — para lo que sigue después se usaron las fuentes externas de
arriba).
