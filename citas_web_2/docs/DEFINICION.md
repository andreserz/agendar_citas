# Definición — citas_web_2

Estado: borrador en elaboración para revisión del equipo y del cliente. Registra los requisitos y reglas de negocio del sitio del cineclub. El contexto y los datos vienen del `ANTEPROYECTO.md` cerrado el 3 de noviembre de 2026 y de las respuestas del cliente. Los puntos que dependen de otros equipos se marcan como **condicional** o **pendiente** y se siguen en `RESPUESTA_P4.md` y en `../../citas_service/docs/specs/ACUERDOS.md`. El detalle de pantallas y criterios de aceptación se fija en la Especificación.

## Objetivo y límites

El sitio del cineclub permitirá consultar la cartelera de *Spider-Man*, elegir función y sala, seleccionar butacas numeradas en el mapa, apartarlas durante cinco minutos, pagar de forma simulada, recibir el boleto con código QR y recuperarlo después sin cuenta. `citas_web_2` es el frontend del cineclub; la API es de `citas_service`, la base de datos de `citas_backend` y el sitio del teatro de `citas_web_1` (ver `ANTEPROYECTO.md`).

## Usuarios

- **Visitante:** consulta la cartelera, funciones, precios y disponibilidad sin identificarse.
- **Comprador:** persona que compra sin crear cuenta. El sistema no la identifica entre compras distintas, así que no existe historial, límite por persona ni recuperación por correo. Para volver a ver su boleto guarda el **folio de la orden**.
- **Operador del cineclub:** consulta el conteo diario de reservas. Es un uso de consulta definido en este documento; la consolidación detallada es responsabilidad del backend.

## Oferta

Una sola película en cartelera por ahora: *Spider-Man*. El cineclub abre de lunes a domingo con 10 salas de 80 butacas numeradas (800 en total) y 30 funciones diarias de dos horas.

| Salas | Formato | Precio por butaca | Función 1 | Función 2 | Función 3 |
| --- | --- | ---: | --- | --- | --- |
| 1–5 | 2D | $100 MXN | 13:00–15:00 | 16:00–18:00 | 20:00–22:00 |
| 6–10 | 3D | $150 MXN | 12:30–14:30 | 15:30–17:30 | 18:30–20:30 |

- Todas las butacas de una función cuestan lo mismo: el precio lo determina el formato de la función, no la butaca.
- Cada función pertenece a una sala y muestra película, fecha, horario, formato y precio.
- Resultado: 210 funciones por semana y 2,400 butacas disponibles por día.

## Requisitos funcionales

| # | Requisito |
| --- | --- |
| RF01 | Mostrar la cartelera con la película vigente, sus funciones por sala, fecha, horario, formato, idioma y clasificación, y el precio según el formato. |
| RF02 | Permitir elegir una función y dibujar el mapa de las 80 butacas de esa sala con su estado: disponible, apartada o vendida. |
| RF03 | Permitir seleccionar butacas y mostrar un resumen con las butacas elegidas, el precio por butaca y el total. |
| RF04 | Al pasar a pagar, solicitar la reserva al servicio, iniciar la cuenta regresiva de cinco minutos y bloquear al comprador el flujo contra el vencimiento. |
| RF05 | Rechazar la selección completa cuando alguna butaca ya no esté disponible: mostrar el mapa actualizado, indicar las butacas en conflicto y pedir una nueva elección. **No aparta butacas parciales.** |
| RF06 | Ofrecer el pago simulado con resultados exitoso y rechazado. Tras un rechazo, permitir reintentos mientras la reserva siga vigente. |
| RF07 | Informar el vencimiento del apartado y los asientos liberados; liberarlos antes del vencimiento si el comprador abandona. |
| RF08 | Tras una compra exitosa, mostrar la confirmación con número de orden, folio, boleto y su código QR. |
| RF09 | Permitir recuperar un boleto sin cuenta ingresando el folio de la orden. |
| RF10 | Mostrar el conteo diario de reservas para el operador del cineclub. |
| RF11 | Permitir configurar la URL de la API, los contextos y la referencia Swagger, con CORS desde el puerto local `5502`. |

## Reglas de negocio

- **RN01 — Apartado de cinco minutos.** El apartado lo controla el servicio: `expiraEn` lo determina el reloj del servicio (PR1). El sitio no reimplementa la regla; sólo la refleja con la cuenta regresiva.
- **RN02 — Rechazo de la selección completa (P9).** Si al confirmar alguna butaca no está disponible, la respuesta del servicio es `409` y el sitio rechaza toda la selección: no guarda ni aparta la parte disponible. Muestra el mapa actualizado y pide una nueva elección.
- **RN03 — Precio por formato.** 2D $100 MXN; 3D $150 MXN, por butaca, en todas las funciones de ese formato. El precio oficial lo entrega el servicio al crear la reserva (RN08 de `citas_service`); el sitio sólo lo muestra y lo suma.
- **RN04 — Sin cuentas ni límite por persona.** No hay registro, inicio de sesión, historial ni límite de diez butacas por persona y función (PR4 no aplica). El riesgo queda aceptado con el cliente y documentado en el `ANTEPROYECTO.md`.
- **RN05 — Recuperación del boleto por folio.** La única forma de volver a ver un boleto sin cuenta es el folio de la orden, entregado en la confirmación. El sitio consulta la orden al servicio con ese folio. **Condicional:** el servicio debe permitir consultarla por folio y asignar un comprador anónimo a cada orden (consecuencia 1 de `RESPUESTA_P4.md`).
- **RN06 — Conteo diario de reservas.** El cliente pidió el conteo de reservas por día. Definición acordada para el sitio: **total de reservas creadas por día calendario en `America/Mexico_City`, sin importar su estado final** (incluye pagadas, vencidas y liberadas, porque el cliente pidió contar la demanda, no las ventas). **Sin desglose por sala o función en esta entrega.** **Condicional:** revisar si el servicio expone el conteo; si no, el sitio lo calcula con los datos disponibles para la demo.
- **RN07 — Zona horaria (P8).** Funciones, vencimientos y conteo diario se presentan en `America/Mexico_City`, sujeta a lo que confirme el servicio.
- **RN08 — Código de boleto y QR (PR7).** El código único por boleto lo genera el servicio; el sitio lo convierte en QR. El formato se fija en la Especificación (PR7).

## Estados y comportamiento

Para la interfaz se identifican los estados de butaca: **disponible**, **seleccionada** (sólo de la interfaz, mientras dura la elección), **apartada** (reserva activa vigente) y **vendida** (con boleto). La reserva comienza al pasar a pagar. Los estados los entrega el servicio (RF03, RF05); el sitio sólo muestra el estado final de cada butaca.

La interfaz comunica la cuenta regresiva, el conflicto de disponibilidad (RN02), el rechazo y la expiración del pago. Los mensajes de error `409` (conflicto) y `410` (reserva vencida, PR3) se presentan con texto claro y sin jerga técnica.

## Condiciones de diseño y tecnología

Interfaz responsiva con glassmorphism, HTML5, CSS3 y JavaScript vanilla; sin audio MP3 por el momento. Paleta por confirmar: el `AGENTS.md` exige colores primario y de acento que se definen en la etapa de **Propuesta** y se validan en contraste. El contrato genérico del servicio (evento, función, zona, asiento) admite una sola zona por función sin cambios, como lo confirma `RESPUESTA_P4.md`.

## Correspondencia con el servicio

| Requisito o regla de web_2 | Cubierto por el servicio |
| --- | --- |
| RF01, RF02 Cartelera, funciones y mapa con estados | RF01, RF02, RF03 del servicio |
| RF03 Resumen y total | RF04 (el total oficial lo da la reserva) |
| RF04, RF07 Apartado, cuenta regresiva y liberación | RF04, RF05, RF06, RF07, RN01 |
| RN02 Rechazo de la selección completa | RN11 (propuesta, pendiente de P9) |
| RF06, pago simulado | RF08, RN05, RN06 |
| RF08, RF09 Confirmación y boleto con QR | RF09, RN10 (PR7) |
| RF09 Recuperación por folio | **Pendiente:** consulta de orden por folio sin comprador identificado |
| RF10 Conteo diario | **Pendiente:** exposición del conteo de reservas por día |
| RF11 Integración y CORS | RF13, RF14, PR5, PR8, PR9 |

## Pendientes

| Tema | Referencia | Etapa o responsable |
| --- | --- | --- |
| Registrar la respuesta a P4 (P4, P5, P9) en `ACUERDOS.md` | `RESPUESTA_P4.md` | Servicio, por el líder de contrato |
| Resultado del pago simulado (P10) | P10 | Coordinación con `citas_service` |
| Consulta de orden por folio sin comprador | RN05 | Propuesta nueva al servicio |
| Exposición del conteo diario de reservas | RN06 | Coordinación con `citas_service` |
| Paleta primario y acento, tipografías y marca | — | Propuesta |
| Formato del código de boleto para el QR | RN08 | Especificación (PR7) |
| Pantallas, flujos y criterios de aceptación | — | Especificación |

## Referencias

- `../AGENTS.md` y `../TODOLIST.md` de este sitio.
- `ANTEPROYECTO.md`, `contexto_negocio/RESPUESTAS_CLIENTE.md` y `contexto_negocio/RESPUESTA_P4.md`.
- `../../citas_service/docs/DEFINICION.md`, `../../citas_service/docs/specs/ACUERDOS.md` y `../../citas_service/docs/ESPECIFICACION.md`.
- `../../citas_web_1/docs/DEFINICION.md` como referencia de formato y negocio vecino.
