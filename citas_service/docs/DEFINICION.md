# Definición — citas_service

Estado: borrador para revisión del equipo (L, R). Registra los requisitos y reglas de negocio del servicio. Lo que depende de otros equipos se marca como **condicional** o **pendiente** y se sigue en `specs/ACUERDOS.md`; lo marcado como propuesta no se considera acordado. El detalle de rutas, cuerpos y códigos de error se fija en la Especificación (`specs/openapi.yaml` y `ESPECIFICACION.md`).

## Objetivo y límites

Proveer a `citas_web_1` y `citas_web_2` una API REST común para consultar funciones, apartar asientos durante 5 minutos y comprarlos con un pago simulado, garantizando que todos los sitios vean el mismo estado de disponibilidad. Quedan fuera las interfaces, el diseño de la base de datos, el pago real y el backoffice (ver `ANTEPROYECTO.md`).

## Actores

- **Sitio consumidor:** `citas_web_1` o `citas_web_2`. Se identifica en cada petición; el mecanismo se define en la Especificación (PR5).
- **Comprador:** persona que aparta y compra asientos desde un sitio. Quién gestiona su cuenta está pendiente (P5).
- **Visitante:** consulta eventos, funciones y asientos sin identificarse.
- **Backoffice:** consumidor futuro de datos de consolidación; alcance y responsable pendientes.

## Conceptos del dominio

Términos genéricos para que el contrato sirva a otros negocios además del teatro (P4).

| Concepto | Descripción |
| --- | --- |
| Evento | Lo que se ofrece; en web_1, la obra «¡Que no se entere la suegra!». |
| Función | Una presentación del evento en fecha y hora concretas. |
| Zona | Agrupación de asientos con un mismo precio por función (Preferente, General, Balcón en web_1). |
| Asiento | Lugar identificable dentro de una zona (fila y número en web_1). |
| Reserva | Apartado temporal de uno o más asientos de una función, hecho por un comprador desde un sitio. |
| Intento de pago | Cada pago simulado sobre una reserva, con su resultado. |
| Orden | Compra concluida a partir de una reserva pagada. |
| Boleto | Un asiento comprado dentro de una orden, con un código único (PR7). |

### Estados

**Asiento en una función** (calculado, no se guarda como dato independiente):

| Estado | Condición |
| --- | --- |
| Comprado | Tiene boleto en una orden. |
| Apartado | Pertenece a una reserva activa cuyo `expiraEn` es posterior a la hora actual. |
| Disponible | Ninguna de las anteriores. |

El estado "seleccionado" de web_1 es sólo de la interfaz y no existe en el servicio.

**Reserva:**

| Estado | Significado |
| --- | --- |
| Activa | Creada y sin pagar; vigente mientras `expiraEn` sea posterior a la hora actual. |
| Vencida | Activa cuyo `expiraEn` ya pasó. Se determina al consultarla (ver ADR-003). |
| Liberada | El comprador la canceló antes de vencer. |
| Pagada | Tuvo un pago exitoso y generó una orden. |

## Requisitos funcionales

| # | Requisito | Condición |
| --- | --- | --- |
| RF01 | Listar los eventos disponibles. | — |
| RF02 | Listar las funciones de un evento con fecha y hora. | Zona horaria pendiente (P8) |
| RF03 | Consultar los asientos de una función con zona, precio y estado (disponible, apartado o comprado). No se revela quién aparta o compra un asiento. | — |
| RF04 | Apartar uno o más asientos de una misma función creando una reserva que vence a los 5 minutos. Devuelve el identificador de la reserva, los asientos, el total y `expiraEn`. | Comportamiento ante disponibilidad parcial pendiente (P9) |
| RF05 | Consultar una reserva con su estado, asientos, total y tiempo restante. | — |
| RF06 | Liberar una reserva activa; sus asientos vuelven a estar disponibles. | — |
| RF07 | Considerar vencida una reserva activa al llegar su `expiraEn`; sus asientos vuelven a estar disponibles sin intervención del sitio. | — |
| RF08 | Registrar un pago simulado sobre una reserva activa. Si es exitoso, genera la orden; si es rechazado, la reserva sigue activa y se puede reintentar. La respuesta identifica el pago como simulado. | Forma de elegir el resultado pendiente (P10) |
| RF09 | Consultar una orden con su número, fecha, total y boletos; cada boleto con evento, función, zona, asiento, precio y código. | Código para QR: PR7 |
| RF10 | Consultar las reservas activas y las órdenes de un comprador. | Identificación del comprador depende de P5 |
| RF11 | Rechazar apartados que harían que un comprador supere 10 asientos en una función (ver RN04). | PR4 |
| RF12 | Registrar compradores con nombre, correo y contraseña, e iniciar sesión. | **Condicional:** sólo si P5 asigna las cuentas al servicio |
| RF13 | Identificar al sitio consumidor en cada petición y registrar en cada reserva y orden desde qué sitio se hizo. | Mecanismo en la Especificación (PR5) |
| RF14 | Publicar el contrato OpenAPI 3 bajo `/api/v1` con Swagger UI en `/docs`. | PR5 |
| RF15 | Permitir obtener, para consolidación, comprador, asiento, función, fecha de compra y monto de cada boleto. | **Condicional:** alcance del backoffice pendiente |

## Reglas de negocio

- **RN01 — Duración del apartado.** Una reserva vence 5 minutos después de crearse: `expiraEn = creadaEn + 5 min`. La hora la da el reloj del servicio, que se puede sustituir en pruebas.
- **RN02 — Exclusividad.** Un asiento de una función no puede estar al mismo tiempo en más de una reserva activa vigente ni en una reserva activa y un boleto. Dos peticiones simultáneas por el mismo asiento: sólo una tiene éxito; la otra recibe `409` (PR2, PR3).
- **RN03 — Una función por reserva.** Todos los asientos de una reserva pertenecen a la misma función.
- **RN04 — Límite por persona y función.** Boletos comprados + asientos en reservas activas vigentes + asientos solicitados ≤ 10, contando todas las operaciones del comprador en esa función y en cualquier sitio. El código de error se fija en la Especificación; se sugiere distinguirlo del conflicto de disponibilidad (`409`).
- **RN05 — Pago sobre reserva vencida.** Si al procesar el pago la reserva ya venció, se rechaza con `410` y no se cobra ni se genera orden (PR3). El trato de pagos sobre reservas liberadas o ya pagadas se define en la Especificación.
- **RN06 — Rechazo no extiende el plazo.** Un pago rechazado no modifica `expiraEn`; los reintentos sólo son posibles dentro del plazo original.
- **RN07 — Pago exitoso atómico.** Marcar la reserva como pagada, crear la orden y crear sus boletos ocurre como una sola operación: o se hace todo o nada.
- **RN08 — Precio.** El precio de cada asiento lo determina su zona en esa función. Se toma al crear la reserva y no cambia durante su vigencia. El total es la suma de los asientos. Moneda MXN para web_1; la de web_2 está pendiente (P4).
- **RN09 — Propiedad.** Sólo el comprador dueño de una reserva puede consultarla, liberarla o pagarla, y sólo él puede consultar sus órdenes. La forma de verificarlo depende de P5.
- **RN10 — Código de boleto.** Cada boleto tiene un código único y difícil de adivinar; el sitio lo convierte en QR (PR7).
- **RN11 — Disponibilidad parcial.** Propuesta del servicio, pendiente de P9: si algún asiento solicitado no está disponible, se rechaza toda la reserva con `409` indicando cuáles fallaron.

## Requisitos no funcionales

- **RNF01 — Stack (D1):** Node.js 20 + Express, OpenAPI 3 con `swagger-ui-express`, pruebas con Jest + Supertest.
- **RNF02 — Spec primero:** ninguna ruta existe en el código si no está en `specs/openapi.yaml`.
- **RNF03 — Independencia de la base de datos:** la lógica depende de las interfaces `AsientosRepo`, `ReservasRepo` y `OrdenesRepo` (ADR-002). Mientras no exista la BD, se usa la implementación en memoria con los datos del teatro de web_1.
- **RNF04 — Ejecución local (D3):** `npm install` y `npm start` levantan la API sin instalar base de datos (PR6). Puertos y CORS según PR8 y PR9.
- **RNF05 — Configuración:** puerto, orígenes permitidos, URL o conexión del backend y llaves sólo por variables de entorno; se documentan en `.env.example` sin valores reales.
- **RNF06 — Pruebas de tiempo:** la expiración se prueba con reloj simulado, sin esperar 5 minutos.
- **RNF07 — Errores consistentes:** todas las respuestas de error usan el mismo formato, definido en la Especificación.
- **RNF08 — Fechas:** se intercambian en ISO 8601 con zona horaria explícita (P8).
- **RNF09 — Datos sensibles:** no se registran contraseñas ni datos de pago en logs; si el servicio gestiona cuentas, las contraseñas se guardan con hash.

## Datos iniciales en memoria

Mientras se responde P3, el servicio carga en memoria los datos de web_1: la obra, sus funciones de jueves, viernes y sábado a las 15:00, 19:00 y 21:00 entre octubre y diciembre de 2026, y 120 asientos por función en las zonas Preferente (A–C, $800), General (D–I, $500) y Balcón (J–L, $300). Los datos de web_2 se agregarán cuando responda P4.

## Correspondencia con web_1

| Requisito de web_1 (`../../citas_web_1/docs/DEFINICION.md`) | Cubierto por |
| --- | --- |
| RF01 Información de teatro, obra y funciones | RF01, RF02 |
| RF02 Registro e inicio de sesión | RF12 (condicional, P5) |
| RF03 Mapa de asientos con zona, precio y disponibilidad | RF03 |
| RF04 Resumen de selección y total | Interfaz de web_1; el total oficial lo da RF04 |
| RF05 Límite de diez por persona y función | RF11, RN04 |
| RF06 Reserva con cuenta regresiva de 5 min | RF04, RF05, RN01 |
| RF07 Exclusividad y liberación al vencer | RF07, RN02 |
| RF08 Pago simulado con éxito, rechazo y reintentos | RF08, RN05, RN06 |
| RF09 Confirmación, orden, boleto y QR | RF09, RN10 |
| RF10 Consultar reservas y compras desde la cuenta | RF10 |
| RF11 Configuración de URL, contextos y Swagger | RF14, RNF04 |

## Pendientes

| Tema | Referencia en `specs/ACUERDOS.md` | Afecta |
| --- | --- | --- |
| Qué entrega el backend, motor, ejecución local, datos iniciales y esquema | P1, P2, P3, P6 | Adaptador real (RNF03) |
| Negocio y datos de web_2 | P4 | Conceptos, RN08 |
| Cuentas de usuario e identificación del comprador | P5 | RF10, RF12, RN04, RN09 |
| Forma de la demo | P7 | RNF04 |
| Zona horaria | P8 | RF02, RNF08 |
| Disponibilidad parcial | P9 | RF04, RN11 |
| Resultado del pago simulado | P10 | RF08 |
| Propuestas del servicio sin confirmar | PR1–PR9 | Varias |
| Alcance del backoffice | Sin pregunta registrada | RF15 |
