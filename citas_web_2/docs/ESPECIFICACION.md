# Especificación — citas_web_2

Estado: define las pantallas, la integración con el contrato y los criterios de aceptación de RF01 a RF11. Es la base para construir `app/` y para las pruebas de `tests/`. Pendiente de validación del equipo; la Definición sigue abierta hasta la confirmación del cliente sobre folio y conteo diario.

## 1. Alcance de la interfaz

SPA del cineclub para consultar la cartelera de *Spider-Man*, elegir función y sala, seleccionar butacas numeradas, apartarlas cinco minutos, pagar de forma simulada, ver el boleto con QR y recuperarlo por folio, sin cuenta. Incluye la vista de conteo diario para el operador.

No incluye cuentas, historial de compras, límite de butacas por persona, cobros reales, correos, administración de cartelera ni backoffice. El sitio nunca se conecta a la base de datos: sólo consume la API de `citas_service` (contrato `1.0.0`).

## 2. Rutas y navegación

| Ruta | Vista | Requisito |
| --- | --- | --- |
| `#/` | Cartelera y funciones del día | RF01 |
| `#/funcion/:funcionId` | Mapa de butacas y resumen | RF02, RF03, RF05 |
| `#/checkout/:reservaId` | Cuenta regresiva, pago simulado | RF04, RF06, RF07 |
| `#/orden/:ordenId` | Confirmación, boleto y QR | RF08 |
| `#/recuperar` | Recuperación por folio | RF09 |
| `#/operador` | Conteo diario de reservas | RF10 |
| Cualquier otra | Página no encontrada con salida a la cartelera | — |

La navegación usa `location.hash`, así que el servidor estático no necesita reescritura de rutas. Recargar una vista conserva sólo lo que esté en la URL; la reserva activa se recupera de `sessionStorage` (§6.1).

## 3. Pantallas

### 3.1 Cartelera (RF01)

- Consulta `GET /eventos` y muestra el evento del sitio (`sitio = "web_2"`), con nombre y recinto si existe.
- Selector de fecha con las fechas que devuelvan las funciones; abre en la fecha de hoy en `America/Mexico_City`. Cada fecha muestra sus **30 funciones** (10 salas × 3 horarios), agrupadas por formato 2D y 3D y ordenadas por sala y hora.
- Cada función muestra: sala, horario, formato, idioma, clasificación y precio por butaca. Idioma y clasificación se muestran tal como llegan; mientras el servicio entregue `Por confirmar`, se muestran así, sin inventar valores.
- El precio sale de `zonas[0].precio` de la función: $100 MXN en 2D y $150 MXN en 3D.
- Estados: esqueletos durante la carga, aviso con reintento si falla la petición, mensaje «No hay funciones para esta fecha» si la lista viene vacía.
- Si el modo es demo, se muestra el aviso de §8.

### 3.2 Mapa de butacas y resumen (RF02, RF03)

- Encabezado con película, sala, fecha, horario, formato y precio.
- Mapa de 80 butacas en filas A–H y números 1–10, cada una como botón con etiqueta `A1`…`H10` y `aria-pressed`.
- Estados visuales: **disponible**, **seleccionada** (sólo local), **apartada** y **vendida**. Se mapea `apartado` → apartada y `comprado` → vendida; las butacas seleccionadas no se envían al servicio hasta el checkout.
- Leyenda visible y estados que combinan color, borde y glifo; no dependen sólo del color.
- Selección de hasta **10 butacas por reserva** (límite de formato del contrato); no hay límite por persona ni historial (RN04).
- Resumen fijo con butacas elegidas, precio por butaca y total; «Continuar al pago» se habilita con al menos una butaca.
- Cambiar de función o de fecha descarta la selección local y no crea reserva.

### 3.3 Checkout (RF04, RF06, RF07)

- Al entrar, `POST /reservas` con `{ funcionId, asientoIds }`. La respuesta `201` trae la reserva con `id`, `expiraEn`, `segundosRestantes` y `total`; se guardan en `sessionStorage`.
- Cuenta regresiva `mm:ss` visible desde `segundosRestantes` (reloj del servicio) y sincronizada al volver a la pestaña. Se anuncia por accesibilidad al minuto restante y a los 10 segundos, no en cada segundo.
- Formulario de pago: número de tarjeta, titular, vencimiento `MM/AA` y CVV de 3 dígitos. Se indica siempre que el pago es simulado y que no hay cargos reales.
- Acciones: pagar, reintentar tras un rechazo y «Liberar butacas» para volver al mapa.
- Al vencer la reserva o recibir `410 RESERVA_VENCIDA` / `410 RESERVA_LIBERADA`, se bloquea el pago y se ofrece «Elegir butacas de nuevo».
- Si el pago responde `409 RESERVA_PAGADA`, se avisa que la reserva ya se pagó y se ofrece recuperar el boleto por folio.
- Un pago aprobado navega a `#/orden/:ordenId` con la orden de la respuesta.

### 3.4 Confirmación (RF08)

- Muestra folio `ORD-` + 6 dígitos, total, función y un boleto por butaca con sala, etiqueta, precio, código de 12 caracteres y QR.
- Acciones: imprimir, copiar folio, copiar códigos, ir a la cartelera o recuperar otro boleto.
- La confirmación no depende de que el QR se dibuje: si falla, el código textual sigue visible (§5).
- La orden se puede volver a consultar con `GET /ordenes/{ordenId}` al recargar.

### 3.5 Recuperación por folio (RF09)

- Campo con máscara `ORD-000000`; se normaliza a mayúsculas y se valida el formato antes de enviar.
- Consulta `GET /ordenes/buscar?folio=ORD-000123` (exactamente un parámetro) y muestra la orden con sus boletos y QR.
- `404` se explica como «No encontramos una orden con ese folio»; `400` como folio inválido. No se revela si existe una orden de otro sitio.
- Enlace a la vista de operador y a la cartelera.

### 3.6 Conteo diario (RF10)

- Dos campos de fecha `AAAA-MM-DD` (`desde`, `hasta`), con hoy como valor inicial y un máximo de 92 días.
- Consulta `GET /reportes/reservas-por-dia?desde=&hasta=` y muestra una tabla por día con el total de reservas creadas, incluidas vencidas y liberadas, y la suma del rango.
- Aclara que la cifra mide demanda, no ventas, y que no hay desglose por sala.
- `400` por rango inválido se muestra junto a los campos, sin perder los valores capturados.
- Vista sin autenticación, definida como uso interno del operador (RF10); el acceso público queda como riesgo aceptado en la Definición.

## 4. Integración con `citas_service`

### 4.1 Configuración (RF11)

`app/config.js` expone estos valores, sobrescribibles con `window.CITAS_CONFIG`:

| Clave | Valor | Uso |
| --- | --- | --- |
| `apiBaseUrl` | `http://localhost:3000/api/v1` | Base del contrato |
| `swaggerUrl` | `http://localhost:3000/docs` | Enlace de documentación en el pie |
| `sitio` | `web_2` | Encabezado `X-Sitio` |
| `modo` | `auto` | `auto`, `demo` o `api` |
| `tiempoEsperaMs` | `2200` | Tiempo máximo por petición |
| `duracionReservaSegundos` | `300` | Vigencia que se muestra; la real la fija el servicio |
| `maxButacasPorReserva` | `10` | Límite de formato del contrato |

El sitio se sirve en `http://localhost:5502`, origen aceptado por CORS (PR8, PR9). La URL no se escribe dentro del código de la interfaz.

### 4.2 Peticiones

- Toda petición envía `Accept: application/json` y `X-Sitio: web_2`; los `POST` agregan `Content-Type: application/json`.
- Ninguna petición envía `Authorization` ni se guarda token (RN04, D18).
- Tiempo máximo por petición con `AbortController` (`tiempoEsperaMs`). No se reintentan `POST` ni `DELETE` para no duplicar reservas, pagos o liberaciones.
- Los errores del contrato se normalizan a `{ codigo, mensaje, detalles }`; los fallos de red o tiempo de espera se tratan como servicio no disponible.

### 4.3 Rutas consumidas

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/eventos` | Catálogo del sitio y prueba de conexión |
| GET | `/eventos/{id}/funciones` | Funciones del evento |
| GET | `/funciones/{id}/asientos` | Mapa de la sala |
| POST | `/reservas` | Apartar butacas |
| GET | `/reservas/{id}` | Estado y tiempo restante |
| DELETE | `/reservas/{id}` | Liberar butacas |
| POST | `/reservas/{id}/pago` | Pago simulado |
| GET | `/ordenes/{id}` | Orden y boletos |
| GET | `/ordenes/buscar?folio=` | Recuperación por folio |
| GET | `/reportes/reservas-por-dia` | Conteo diario |

### 4.4 Formas de datos

Se consumen las formas del contrato sin agregar campos:

```jsonc
// Función
{ "id": "fun-...", "eventoId": "evt-...", "inicio": "2026-11-23T13:00:00-06:00",
  "formato": "2D", "idioma": "Por confirmar", "clasificacion": "Por confirmar",
  "zonas": [{ "id": "sala-1", "nombre": "Sala 1", "precio": 100, "moneda": "MXN" }] }

// Asiento
{ "id": "A1", "zonaId": "sala-1", "fila": "A", "numero": 1, "etiqueta": "A1",
  "precio": 100, "estado": "disponible" }

// Reserva (201)
{ "id": "uuid", "sitio": "web_2", "funcionId": "fun-...", "estado": "activa",
  "asientos": [{ "asientoId": "A1", "etiqueta": "A1", "zonaId": "sala-1", "precio": 100 }],
  "total": 100, "moneda": "MXN", "creadaEn": "...", "expiraEn": "...", "segundosRestantes": 300 }

// Pago aprobado
{ "resultado": "aprobado", "simulado": true, "reserva": { "...": "..." },
  "orden": { "id": "...", "folio": "ORD-000123", "total": 100, "moneda": "MXN",
             "boletos": [{ "codigo": "H32G3S9X2QB9", "etiqueta": "A1", "zonaId": "sala-1",
                           "precio": 100, "eventoNombre": "Spider-Man", "inicio": "..." }] } }
```

Las fechas se muestran en `America/Mexico_City` tal como llegan, con desplazamiento `-06:00` (D13). Los campos opcionales ausentes no se muestran como «null».

### 4.5 Asientos y precios

- El estado del asiento lo calcula el servicio con su reloj; el sitio lo refleja y no lo recalcula.
- El precio por butaca es `zonas[0].precio` de la función; el total oficial es el de la reserva. El resumen previo puede sumar butacas × precio, pero al crear la reserva manda el total del servicio.
- Si una butaca aparece con un estado distinto entre dos consultas, se vuelve a pedir el mapa antes de confirmar.

### 4.6 Errores y mensajes

| HTTP | `codigo` | Mensaje en la interfaz | Acción |
| --- | --- | --- | --- |
| 409 | `ASIENTO_NO_DISPONIBLE` | «Alguien más tomó una de tus butacas. Elige de nuevo.» | Volver al mapa, marcar `detalles.asientoIds`, pedir nueva selección |
| 410 | `RESERVA_VENCIDA` | «Tu apartado venció. Las butacas se liberaron.» | Bloquear el pago y ofrecer elegir butacas |
| 410 | `RESERVA_LIBERADA` | «Este apartado ya se liberó.» | Igual que el anterior |
| 409 | `RESERVA_PAGADA` | «Esta reserva ya se pagó.» | Ofrecer recuperar el boleto por folio |
| 404 | `NO_ENCONTRADO` | «No encontramos esa información.» | Reintentar o volver a la cartelera |
| 400 | `SOLICITUD_INVALIDA` | «Revisa los datos.» | Señalar `detalles.campo` si existe |
| 422 | `LIMITE_EXCEDIDO` | «Esta compra supera el máximo de butacas por reserva.» | Volver al mapa |
| 500 | `ERROR_INTERNO` | «Tuvimos un problema. Intenta de nuevo.» | Reintento manual |
| — | Red o tiempo de espera | «No pudimos conectar con el servicio.» | Reintento manual; en `auto`, demo (§8) |

Los mensajes no muestran códigos HTTP, trazas ni datos de otros compradores.

## 5. Boleto y QR (RF08, PR7)

- El código del boleto lo genera el servicio: 12 caracteres `[A-Z2-9]`. El sitio no lo altera ni lo regenera.
- El QR se dibuja en JavaScript vanilla con la librería vendorizada que ya usa `citas_web_1` (`app/js/vendor/qrcode.js`), copiada sin dependencias de red. Contenido del QR: el código del boleto, sin URL ni datos personales.
- Presentación: lienzo cuadrado de 200 px sobre una tarjeta clara `#F2F6FF`, módulos `#0A0F18`, zona de silencio de 4 módulos y corrección de errores nivel M, para que se lea desde la pantalla o impreso.
- Respaldo textual: si la librería no está disponible, el lienzo no soporta dibujo o el QR no se completa en 1 segundo, se oculta el lienzo y se muestra el código en tipografía monoespaciada grande con el texto «Muestra este código en taquilla». La confirmación nunca se bloquea por el QR.
- La hoja de impresión oculta la navegación y muestra folio, datos de la función y un boleto por página, conservando el código textual al lado del QR.

## 6. Reserva, temporizador y abandono

### 6.1 Estado local

`sessionStorage["citas_web_2.reserva"]` guarda `{ reservaId, funcionId, expiraEn, guardadaEn }`. Es la única forma de retomar el pago tras recargar sin cuenta (design.md, decisión 2). Al liberar, vencer o pagar, se elimina la entrada.

### 6.2 Cuenta regresiva (RF04)

- Se calcula con `segundosRestantes` de la última respuesta y el tiempo transcurrido local; no se confía en el reloj del equipo para decidir el vencimiento.
- Al volver a la pestaña o recuperar foco, se consulta `GET /reservas/{id}` y se resincroniza.
- En `0` se bloquea el pago y se muestra el aviso de vencimiento; el servicio sigue siendo la autoridad final (RN01).

### 6.3 Abandono y liberación (RF07)

- «Liberar butacas» llama a `DELETE /reservas/{id}` y vuelve al mapa con la selección vacía.
- Al cerrar o recargar el checkout, se intenta la misma liberación con `fetch(..., { keepalive: true })`; si no se completa, la reserva vence a los 5 minutos por el servicio. No se usa `sendBeacon` porque no permite enviar `X-Sitio`.
- Un `410` al liberar se trata como reserva ya vencida: se informa y se limpia el estado local.

### 6.4 Conflicto de selección completa (RF05, RN02)

- Ante `409 ASIENTO_NO_DISPONIBLE`, se descarta **toda** la selección: no se guarda ni se aparta ninguna butaca.
- Se vuelve a pedir el mapa, se marcan las butacas de `detalles.asientoIds` como «en conflicto» durante al menos 8 segundos, se actualiza la leyenda y se pide una nueva elección.
- No existe apartado parcial ni reintento automático con las butacas disponibles.

## 7. Pago simulado (RF06)

| Campo | Validación local |
| --- | --- |
| `numeroTarjeta` | Sólo `4242 4242 4242 4242` (aprobada) o `4000 0000 0000 0002` (rechazada); cualquier otra se marca inválida sin enviar |
| `titular` | No vacío, hasta 80 caracteres |
| `vencimiento` | `MM/AA`, mes 01–12 y no anterior al mes actual |
| `cvv` | Exactamente 3 dígitos |

- La validación local evita peticiones inútiles; el servicio vuelve a validar y es la autoridad.
- Un rechazo (`resultado = "rechazado"`) no consume la reserva: se muestra el mensaje y se permite reintentar mientras quede tiempo.
- El número de tarjeta y el CVV no se guardan en el almacenamiento del sitio ni se registran en consola.
- La interfaz repite en el formulario y en el resultado que el pago es simulado.

## 8. Modo demo

- Se activa con `modo = "demo"`, o con `modo = "auto"` cuando la API no responde dentro de `tiempoEsperaMs` o falla la red.
- Usa la semilla del contrato: 1 evento *Spider-Man*, 10 salas «Sala 1» a «Sala 10» con 80 butacas (filas A–H, 1–10), 2D $100 en salas 1–5 y 3D $150 en 6–10, 30 funciones diarias (2D 13:00/16:00/20:00; 3D 12:30/15:30/18:30) del 19 nov al 18 dic 2026, con idioma y clasificación «Por confirmar».
- Las butacas ocupadas de la semilla son deterministas y dejan libres A1–A4 de cada sala para las pruebas.
- Persiste en `localStorage["citas_web_2.demo.v1"]`; si el almacenamiento falla, usa memoria. «Reiniciar demo» en el pie vuelve a la semilla.
- En demo se respetan las mismas reglas: conflicto `409`, vencimiento a 300 s, pago aprobado/rechazado, folio y códigos.
- El aviso «Modo demo: datos de ejemplo, sin servicio conectado» es visible en todas las vistas, con acción para reintentar la conexión. En `modo = "api"` no hay respaldo demo y los fallos se muestran como error.

## 9. Accesibilidad y respuesta

- HTML semántico, un `h1` por vista, salto al contenido y foco programático en el título al cambiar de ruta.
- Avisos con `aria-live="polite"`; los errores de formulario se asocian con `aria-describedby`.
- Foco visible de 2 px en acento; objetivos táctiles de al menos 44 px; mapa operable con teclado.
- Estados de butaca con color, borde y glifo; contraste mínimo 4.5:1 en texto y 3:1 en componentes, según `PROPUESTA.md`.
- `prefers-reduced-motion` desactiva animaciones; la cuenta regresiva no parpadea.
- Sin desplazamiento horizontal a 390 px; revisión también a 320 px y escritorio. La hoja de impresión cubre el boleto.

## 10. Criterios de aceptación

| ID | Criterio | Requisito | Evidencia |
| --- | --- | --- | --- |
| CA01 | La cartelera muestra la película, el selector de fecha y las 30 funciones del día agrupadas por formato, con sala, horario, formato y precio | RF01 | Revisión en navegador y prueba de datos |
| CA02 | El mapa dibuja 80 butacas por función y traduce `apartado` → apartada y `comprado` → vendida | RF02 | Prueba de mapeo y recorrido |
| CA03 | El resumen muestra butacas, precio unitario y total; 3 butacas 3D suman $450 MXN | RF03 | Prueba de cálculo |
| CA04 | Al pasar a pagar se crea la reserva y la cuenta regresiva arranca en 5 minutos | RF04 | Petición `POST /reservas` y temporizador |
| CA05 | Ante `409 ASIENTO_NO_DISPONIBLE` no queda ninguna butaca apartada, se marca el conflicto y se pide nueva elección | RF05 | Mock del contrato con `detalles.asientoIds` |
| CA06 | El pago rechazado permite reintentar y el aprobado genera orden con folio y boletos | RF06 | Tarjetas `4000…0002` y `4242…4242` |
| CA07 | Al vencer el apartado se bloquea el pago, se avisa y se ofrecen butacas nuevas | RF07 | Reserva vencida y `410 RESERVA_VENCIDA` |
| CA08 | La confirmación muestra folio, un boleto por butaca y el QR del código de 12 caracteres | RF08 | Recorrido de compra completa |
| CA09 | Si el QR no se dibuja, el código textual sigue visible y la confirmación no se bloquea | RF08 | Simulación de fallo de la librería |
| CA10 | La recuperación por folio devuelve la orden y sus boletos; un folio inexistente da un mensaje claro | RF09 | Consulta real y `404` |
| CA11 | El conteo diario suma todas las reservas creadas del día, incluidas vencidas y liberadas | RF10 | Rango con reservas en distintos estados |
| CA12 | El sitio funciona en `5502` con `X-Sitio: web_2` y sin `Authorization` en ninguna petición | RF11, RN04 | Inspección de red y mock del contrato |
| CA13 | Ninguna vista muestra registro, inicio de sesión ni historial de compras | RN04 | Revisión de rutas |
| CA14 | Con el servicio apagado y `modo = auto`, la app usa la semilla demo y muestra el aviso | Modo demo | Recorrido sin servicio |
| CA15 | No hay desplazamiento horizontal a 390 px y la navegación por teclado es completa | Accesibilidad | Revisión con herramientas del navegador |
| CA16 | Los datos demo y los mensajes respetan el contrato: estados, precios, folio y códigos | Contrato | Pruebas de dominio y cliente |

## 11. Fuera de alcance y supuestos

- No hay cuentas, por lo que no hay historial, límite por persona ni recuperación por correo; el folio es la única llave.
- La compra no se puede cancelar después de pagar; no hay reembolsos.
- El conteo diario es de sólo lectura y sin desglose por sala, como se acordó.
- La vista de operador no tiene autenticación en esta entrega (RF10).
- El pago es local y simulado; el sitio nunca recibe ni almacena datos completos de tarjeta.
- El nombre comercial del cineclub y el logotipo definitivo están pendientes; se usa «Cineclub».
- Si el cineclub cambia horarios o precios, cambian juntos la semilla del servicio y este documento; el sitio sólo lee lo que devuelve la API.
