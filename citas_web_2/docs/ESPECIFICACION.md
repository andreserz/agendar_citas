# Especificación — citas_web_2

**Estado:** borrador para revisión del equipo.
**Etapa:** Especificación.
**Alcance:** interfaz web del cineclub en `citas_web_2`.

Esta especificación convierte los requisitos RF01–RF11 de `DEFINICION.md` en pantallas, flujos, integración y criterios de aceptación para la construcción. La API y sus reglas son responsabilidad de `citas_service`; se consumen conforme al contrato `impl-web2` versión `1.0.0`. No se modifica el contrato desde este documento.

## 1. Alcance y restricciones

La aplicación permitirá consultar las funciones, elegir hasta diez butacas, crear una reserva temporal, realizar un pago simulado, consultar el boleto y recuperar una orden con su folio. También mostrará el conteo diario de reservas.

- Se implementará como sitio web responsivo con HTML5, CSS3 y JavaScript vanilla.
- La interfaz usará glassmorphism con la paleta y tipografías propuestas en `docs/PROPUESTA.md`; la aprobación del equipo queda pendiente.
- No habrá registro, inicio de sesión, cuentas, historial de compras ni envío por correo.
- No se conectará directamente con la base de datos ni con `citas_web_1`.
- No se integrará una pasarela de pago real ni audio MP3.
- La API será la fuente de verdad para precios, disponibilidad, estado y vencimiento de reservas.
- La aplicación deberá poder abrirse en pantallas móviles desde 390 px de ancho, sin desplazamiento horizontal.

## 2. Roles y navegación

| Rol | Acciones disponibles |
| --- | --- |
| Visitante / comprador | Consultar funciones y asientos, reservar, pagar y ver o recuperar boletos sin cuenta. |
| Operador | Consultar el conteo diario de reservas por rango de fechas. El reporte no presenta información personal. |

La navegación debe ofrecer acceso a **Cartelera**, **Recuperar boleto** y **Reporte diario**. El flujo de compra guía al usuario desde una función seleccionada hasta la confirmación. No se solicitarán credenciales para ninguna de estas vistas; la autorización y exposición del reporte no están separadas por rol en el contrato actual.

## 3. Pantallas y componentes

### 3.1 Cartelera

- Mostrar la película disponible, *Spider-Man*, y las funciones devueltas por la API para la fecha consultada.
- Permitir consultar una fecha disponible y agrupar las funciones por formato: 2D y 3D.
- Cada tarjeta de función mostrará sala, fecha y hora local, formato, idioma, clasificación y precio por butaca.
- Si idioma o clasificación llegan como `Por confirmar`, mostrar ese texto sin ocultar la función.
- Mostrar el precio entregado por el servicio; la referencia de negocio es $100 MXN en 2D y $150 MXN en 3D.
- Si la API no está disponible y el modo lo permite, mostrar la cartelera demo e indicar claramente **Modo demo**.

La semilla acordada cubre del 19 de noviembre al 18 de diciembre de 2026; la aplicación mostrará únicamente las fechas y funciones disponibles que devuelva la fuente activa.

### 3.2 Mapa y selección de butacas

- Al elegir una función, mostrar la sala y sus 80 butacas numeradas en ocho filas (A–H), diez butacas por fila.
- Presentar los estados disponible, seleccionada, apartada y vendida. `apartado` de la API se presenta como **Apartada** y `comprado` como **Vendida**.
- Sólo las butacas disponibles pueden seleccionarse. La selección local no cambia la disponibilidad del servidor.
- Permitir seleccionar de una a diez butacas. Mostrar las butacas elegidas, precio unitario y total en MXN antes de reservar.
- El precio unitario se obtiene de `funcion.zonas[0].precio`; el total mostrado es la suma de los precios de las butacas seleccionadas.
- Proveer una leyenda comprensible y no depender únicamente del color para comunicar estados.

### 3.3 Reserva y pago

- Al confirmar la selección, solicitar la reserva al servicio. La selección no se considera apartada hasta recibir una respuesta exitosa.
- Tras crearla, mostrar el tiempo restante basado en `expiraEn` o `segundosRestantes` del servicio. El límite de cinco minutos lo controla la API.
- Mostrar el resumen de función, sala, butacas, total y un formulario de pago simulado.
- Indicar junto al formulario que el pago es simulado. Admitir las tarjetas de prueba definidas por contrato: `4242 4242 4242 4242` (aprobado) y `4000 0000 0000 0002` (rechazado). No almacenar ni registrar el número completo ni el CVV en la aplicación.
- Tras un rechazo, permitir reintentar mientras la reserva permanezca activa y vigente.
- Ofrecer una acción explícita para abandonar la compra y liberar una reserva activa. No depender exclusivamente del cierre de pestaña para liberar asientos.
- Guardar en `sessionStorage` el identificador y vencimiento de la reserva para poder retomar el checkout en la misma sesión; no guardar datos de tarjeta.

### 3.4 Conflicto y expiración

- Si la reserva devuelve `409 ASIENTO_NO_DISPONIBLE`, descartar toda la selección local, volver a consultar el mapa y destacar las butacas indicadas en `error.detalles.asientoIds`.
- Explicar que algunas butacas dejaron de estar disponibles y pedir una nueva selección. Nunca presentar como reservadas las butacas disponibles de una solicitud rechazada.
- Si la reserva vence o fue liberada (`410 RESERVA_VENCIDA` o `410 RESERVA_LIBERADA`), detener el checkout y ofrecer volver al mapa.
- Al vencer el contador, consultar o reflejar el estado del servicio; no autorizar nuevos intentos de pago desde la interfaz.

### 3.5 Confirmación y boleto

- Después de un pago aprobado, mostrar el folio de orden, el total y un boleto por cada asiento comprado.
- Cada boleto mostrará película, función, fecha y hora local, sala, asiento, precio y código generado por el servicio.
- El código de boleto tiene 12 caracteres del conjunto `[A-Z2-9]`. La SPA lo convierte en QR; si el QR no se puede mostrar, debe seguir visible el código textual.
- Dar una indicación clara para guardar el folio, ya que no existe cuenta ni recuperación por correo.

### 3.6 Recuperación de boleto

- Ofrecer un formulario que solicite el folio de orden (`ORD-` seguido de seis dígitos).
- Consultar la orden con `GET /ordenes/buscar?folio={folio}` y presentar el mismo detalle de boleto que en la confirmación.
- Si el folio no existe o no corresponde al sitio, informar que no se encontró la compra sin revelar datos de otras órdenes.

### 3.7 Reporte diario

- Permitir consultar el conteo con fecha inicial y fecha final (`desde`, `hasta`).
- Mostrar el total por día calendario en `America/Mexico_City`, sin desglose por sala ni estado y sin datos de compradores.
- Aceptar rangos de hasta 92 días, conforme al contrato. Validar fechas y orden del rango antes de consultar.
- Si el reporte no está disponible en modo demo, identificar los datos como demo; no presentarlos como cifras reales.

## 4. Flujos principales

### 4.1 Compra

1. El visitante abre la cartelera y elige fecha y función.
2. La SPA consulta y presenta los asientos de la sala.
3. El visitante selecciona de una a diez butacas y revisa el precio y total.
4. Al confirmar, la SPA envía la solicitud de reserva.
5. Si se crea, inicia el checkout con el vencimiento informado por el servicio.
6. El visitante envía el pago simulado.
7. Si se aprueba, la SPA presenta la confirmación y los boletos. Si se rechaza, permite reintentar mientras la reserva siga vigente.

### 4.2 Recuperación

1. El visitante abre **Recuperar boleto** e ingresa el folio.
2. La SPA consulta la orden para `web_2`.
3. Si existe, muestra los boletos y códigos QR; si no, informa que no se encontró.

### 4.3 Reporte

1. El operador indica el rango de fechas.
2. La SPA valida que las fechas sean válidas y que el rango no supere 92 días.
3. La SPA consulta el reporte y muestra el total por día con zona horaria `America/Mexico_City`.

## 5. Integración con la API

### 5.1 Configuración

La configuración local estará en `app/config.js` y tendrá estos valores iniciales:

| Propiedad | Valor |
| --- | --- |
| `apiBaseUrl` | `http://localhost:3000/api/v1` |
| `sitio` | `web_2` |
| `modo` | `auto`, `demo` o `api` |
| `tiempoEsperaMs` | `2200` |
| `duracionReservaSegundos` | `300` |

La SPA se servirá en `http://localhost:5502`. La URL base se configura y no se duplica en los módulos que consumen API. No se guardarán secretos en el frontend.

### 5.2 Encabezados, rutas y datos

- Todas las solicitudes de negocio incluirán `X-Sitio: web_2`.
- Ninguna solicitud incluirá `Authorization`; no hay identidad de comprador en este sitio.
- Usar únicamente rutas del contrato v1 necesarias para la interfaz:

| Uso | Método y ruta |
| --- | --- |
| Cartelera | `GET /eventos` |
| Funciones de una película | `GET /eventos/{eventoId}/funciones` |
| Detalle de función y precio | `GET /funciones/{funcionId}` |
| Mapa de butacas | `GET /funciones/{funcionId}/asientos` |
| Crear reserva | `POST /reservas` |
| Consultar reserva y vencimiento | `GET /reservas/{reservaId}` |
| Liberar reserva activa | `DELETE /reservas/{reservaId}` |
| Pagar | `POST /reservas/{reservaId}/pago` |
| Recuperar orden por folio | `GET /ordenes/buscar?folio={folio}` |
| Conteo diario | `GET /reportes/reservas-por-dia?desde={AAAA-MM-DD}&hasta={AAAA-MM-DD}` |

El servicio devuelve fechas ISO 8601 con desplazamiento `-06:00`. La SPA las presentará en `America/Mexico_City`. Para el QR se utilizará el código de boleto recibido; la SPA no genera folios ni códigos de boleto.

### 5.3 Errores

Los mensajes visibles serán claros, en español y no mostrarán trazas ni detalles internos.

| Respuesta | Comportamiento de interfaz |
| --- | --- |
| `400 SOLICITUD_INVALIDA` | Mostrar validación asociada al dato corregible; no repetir automáticamente la solicitud. |
| `404 NO_ENCONTRADO` | Informar que no se encontró la función, reserva, orden o reporte solicitado y ofrecer volver a la cartelera cuando aplique. |
| `409 ASIENTO_NO_DISPONIBLE` | Aplicar el rechazo completo y refrescar el mapa como se define en 3.4. |
| `409 RESERVA_PAGADA` | Informar que la reserva ya fue pagada y consultar la orden asociada si la respuesta permite identificarla. |
| `410 RESERVA_VENCIDA` / `410 RESERVA_LIBERADA` | Cerrar el checkout e invitar a elegir de nuevo. |
| Error de red / `5xx` | Mostrar indisponibilidad temporal y permitir reintentar manualmente; no duplicar pagos ni reservas de forma automática. |

### 5.4 Modo demo

- `api`: consumir la API y mostrar sus errores de conexión.
- `demo`: usar datos demo y mostrar el aviso **Modo demo**.
- `auto`: intentar la API; si no responde, usar datos demo y mostrar el mismo aviso.
- La demo reflejará la semilla del contrato: una película, diez salas, 80 asientos por sala, horarios y precios acordados. No debe presentarse como disponibilidad o ventas reales.

## 6. Criterios de aceptación

Los siguientes criterios corresponden a RF01–RF11. Se verificarán durante Pruebas; no constituyen resultados de ejecución en esta etapa.

| ID | Requisito | Criterio verificable |
| --- | --- | --- |
| CA-01 | RF01 Cartelera | Dada una fecha con funciones, al consultarla se muestran las funciones recibidas agrupadas por formato, con sala, hora, idioma, clasificación y precio; los datos pendientes aparecen como `Por confirmar`. |
| CA-02 | RF02 Mapa | Al elegir una función, se muestran las 80 butacas de su sala con filas A–H, números 1–10 y estados disponibles, apartadas o vendidas, usando el mapeo del contrato. |
| CA-03 | RF03 Selección y total | Al seleccionar butacas disponibles (máximo diez), el resumen enumera cada butaca, muestra el precio de la función y calcula correctamente la suma en MXN; butacas no disponibles no se pueden seleccionar. |
| CA-04 | RF04 Reserva | Al confirmar una selección válida, se solicita la reserva y, al recibir éxito, el checkout refleja el vencimiento de cinco minutos proporcionado por el servicio. |
| CA-05 | RF05 Conflicto | Si una butaca entra en conflicto, no queda ninguna de la selección apartada; el mapa se actualiza, las butacas reportadas se destacan y se solicita una nueva selección. |
| CA-06 | RF06 Pago | El checkout informa que el pago es simulado; un pago rechazado permite reintentar mientras la reserva continúe activa, y uno aprobado lleva a la confirmación. |
| CA-07 | RF07 Liberación | Al abandonar expresamente un checkout activo, la SPA solicita liberar la reserva; al vencer, informa que los asientos ya no se pueden pagar y permite volver a elegir. |
| CA-08 | RF08 Confirmación | Tras pago aprobado, se muestran folio, total y un boleto por asiento con código QR; si falla la representación QR, el código de 12 caracteres permanece legible. |
| CA-09 | RF09 Recuperación | Al ingresar un folio válido existente, se consultan y muestran los boletos asociados; un folio inválido o inexistente produce un mensaje de no encontrado sin exponer otra orden. |
| CA-10 | RF10 Reporte diario | Para un rango válido de hasta 92 días, se presentan conteos diarios en `America/Mexico_City`, incluyendo reservas pagadas, vencidas y liberadas, sin desglose por sala. |
| CA-11 | RF11 Configuración e integración | La SPA usa la URL configurada, corre en el puerto 5502, envía `X-Sitio: web_2`, omite `Authorization` y, en modo `auto` sin API, muestra los datos demo con aviso visible. |
| CA-12 | Responsividad y estilo | En viewport de 390 px la interfaz no requiere desplazamiento horizontal, conserva controles utilizables y mantiene los estados legibles; la presentación usa glassmorphism y la paleta aprobada en Propuesta. |

## 7. Pendientes y condiciones para construcción

- Validar esta especificación con el equipo y registrar la aprobación antes de dar por cerrada la etapa.
- Aprobar la identidad visual de `docs/PROPUESTA.md` con el equipo y revisar contraste sobre las superficies reales antes de cerrar la etapa.
- Revisar que `docs/DEFINICION.md` presente las 30 funciones diarias y marque idioma y clasificación como `Por confirmar`.
- Confirmar que el endpoint de reporte y búsqueda por folio se mantienen en el contrato v1 referenciado por el change `impl-web2`.
- El alcance de la demo no simula una autorización de operador; el reporte no incluye datos personales y el contrato actual no define un mecanismo de autenticación para esa vista.

## 8. Referencias

- `DEFINICION.md` — requisitos funcionales y reglas de negocio RF01–RF11 / RN01–RN08.
- `ANTEPROYECTO.md` — negocio, alcance, horarios y restricciones aprobadas.
- `contexto_negocio/RESPUESTA_P4.md` — datos entregados al servicio y acuerdos de web_2.
- `../../openspec/specs/web2-cineclub/spec.md` — requisitos base de la capacidad del cineclub.
- `../../openspec/changes/impl-web2/specs/contrato-entre-capas/spec.md` — contrato API, datos, rutas y errores.
- `../../openspec/changes/impl-web2/specs/web2-integracion-contrato/spec.md` — configuración y requisitos del consumidor web_2.
- `../../openspec/changes/impl-web2/tasks.md` — tareas de implementación vinculadas.
