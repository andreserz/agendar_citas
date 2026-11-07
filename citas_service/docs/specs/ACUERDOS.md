# Acuerdos entre equipos — citas_service

Registro oficial de preguntas, propuestas y decisiones entre `citas_service`, `citas_backend`, `citas_web_1` y `citas_web_2`.

**Cómo se usa:**
1. Se conversa en el chat del grupo.
2. Cuando hay respuesta, el líder de contrato la copia aquí y hace commit.
3. Si una decisión cambia, se edita su fila, se actualiza la fecha y se avisa en el chat.

Los agentes (pi, Claude) deben respetar todo lo que esté en **Decisiones acordadas**. Lo que esté en **Propuestas** todavía puede cambiar.

---

## Preguntas abiertas

Las fechas límite se movieron el 4 nov porque la entrega ahora es el **lun 9 nov**. P1 y P2 pasaron a Decisiones (D4 y D5) el 4 nov; P3, P6 y P11–P13 pasaron a D7–D11 el 6 nov con las respuestas de `citas_backend/docs/BCK_DEFINICION.md`. P7, P8 y P10 pasaron a D12–D14 el 6 nov.

Las respuestas de web_2 vienen de `citas_web_2/docs/contexto_negocio/RESPUESTA_P4.md`, que está en el PR #8 **todavía sin integrar a `main`**; se registran como parciales hasta que se integre.

| # | Pregunta | Para | Fecha límite |
| --- | --- | --- | --- |
| P4 | ¿Qué negocio es web_2 y qué datos necesita (asientos numerados, zonas, cupo general)? **Respuesta parcial (web_2, PR #8):** cineclub con 10 salas de 80 butacas numeradas, una sola zona por función, precio por formato ($100 MXN en 2D y $150 MXN en 3D), 30 funciones al día, compra como invitado y conteo de reservas por día. Sus consecuencias para el servicio y el backend están en P15–P18. | web2 | vie 6 nov |
| P5 | ¿Las cuentas de usuario (registro e inicio de sesión) las maneja el servicio o cada sitio? **Propuesta del backend (E3, 4 nov):** la BD guarda a los compradores (nombre, correo único y hash de la contraseña); el hash, la autenticación y los tokens los hace el servicio. **web_2 (PR #8):** no usa cuentas y pide que el servicio no las exija para comprar (ver P15). Falta que responda web_1. | web1, web2 | vie 6 nov |
| P9 | Si se piden varios asientos en una reserva y alguno ya no está disponible, ¿se rechaza toda la reserva o se apartan sólo los libres? Propuesta del servicio: rechazar toda la reserva con `409` e indicar qué asientos fallaron. **El backend ya lo define así (RN08) y web_2 está de acuerdo (PR #8).** Falta que responda web_1. | web1, web2 | vie 6 nov |
| P15 | web_2 compra como invitado, pero en el esquema del backend `Reservas.IdComprador` y `Ordenes.IdComprador` no aceptan nulos. ¿Cómo se registra una reserva u orden sin cuenta? Por ejemplo, permitir nulos o crear un comprador «invitado» por sitio. web_2 propone un folio generado por el sitio. | backend, web2 | sáb 7 nov |
| P16 | web_2 necesita sala (nombre y capacidad), formato (2D o 3D), idioma, clasificación y duración, y el esquema no tiene esas columnas. ¿Se agregan (por ejemplo, la sala como `Zonas`) o se dejan fuera para la demo? | backend, web2 | sáb 7 nov |
| P17 | Sin cuenta, el comprador de web_2 sólo puede recuperar su boleto con el folio de la orden o el código del boleto. ¿Puede haber un procedimiento que busque la orden por `Folio` o por `Codigo` (hoy SP14 la busca por `Id`)? | backend | sáb 7 nov |
| P18 | web_2 pide el conteo de reservas por día. ¿Se agrega un procedimiento para eso o el servicio lo calcula a partir de SP16? | backend, web2 | sáb 7 nov |
| P19 | El pago simulado (D14) registra sólo los últimos 4 dígitos de la tarjeta, pero `IntentosPago` no tiene una columna para ellos (`BCK_DEFINICION.md` §6.3). ¿Pueden agregar `UltimosDigitos CHAR(4)` y recibirlo en SP12 y SP13? | backend | sáb 7 nov |

P14 («¿el precio va por zona o por zona y función?») se retiró el 4 nov. El precio es una regla del negocio y web_1 ya lo definió en `citas_web_1/docs/DEFINICION.md`: Preferente $800, General $500 y Balcón $300 MXN, iguales en todas las funciones. El backend lo guarda por zona y función en `PreciosZonaFuncion` (`BCK_DEFINICION.md` §6.2), lo que también sirve para el precio por formato de web_2.

## Preguntas del backend al servicio

Vienen de `citas_backend/docs/BCK_DEFINICION.md` §8. QB1 es para web_1.

| # | Pregunta del backend | Respuesta del servicio (6 nov) |
| --- | --- | --- |
| QB2 | `spReservas_Crear` recibirá `@Ahora` y `@ExpiraEn`; la regla de 5 minutos sigue en el servicio. ¿Ok? | **Sí.** El servicio calcula `ExpiraEn = ahora + 5 min` con su reloj configurable (ADR-003) y envía los dos valores en UTC con milisegundos. |
| QB3 | ¿El driver `mssql` lee el conjunto de resultados que llega antes del `THROW 51001`, o sólo el mensaje? | No lo hemos comprobado, así que **no dependeremos de ese conjunto de resultados: usaremos los Id del mensaje.** Pedimos un formato fijo: `Asientos no disponibles: 12,15,18` (Id separados por comas y sin espacios). Pueden conservar el SELECT como algo adicional. |
| QB4 | ¿Sirven el folio `ORD-000123` y el código de boleto de 12 caracteres para el QR? | **Sí** de parte del servicio. Falta que responda web_1. |
| QB5 | Errores nuevos: 53004 (vencimiento inválido, 422) y 54005 (sitio o evento no encontrado, 404). | **Ok.** Sólo una aclaración: 53004 significa que el servicio envió mal `@ExpiraEn`, así que para el sitio es un error interno; el servicio lo registra y responde `500`, no `422`. 54005 se responde con `404`. |

## Propuestas del servicio (pendientes de confirmar)

| # | Propuesta | Para confirmar con | Estado |
| --- | --- | --- | --- |
| PR1 | El apartado dura 5 minutos y la expiración la controla el servicio; la BD solo guarda `estado` y `expira_en`. | backend, web1, web2 | El backend la acepta: no guarda el estado «vencida», los procedimientos reciben `@Ahora` (E7, 4 nov) y `spReservas_Crear` recibe `@ExpiraEn` (E15, 5 nov). web_2 está de acuerdo (PR #8). Falta que responda web_1. |
| PR3 | Errores: `409` cuando el asiento ya no está disponible, `410` cuando la reserva expiró. | web1, web2 | web_2 está de acuerdo (PR #8). Falta web_1. |
| PR4 | Máximo 10 asientos por persona y función, validado en el servicio. | web1, web2 | El backend también lo valida (RN09, error 53001). **web_2 (PR #8): no aplica**, porque sin cuentas no se identifica a la persona. Falta web_1. |
| PR5 | La API se publica bajo `/api/v1` con Swagger UI en `/docs`; cada sitio se identifica en cada petición. | web1, web2 | web_2 está de acuerdo (PR #8): identifica al sitio, pero no al usuario final. Falta web_1. |
| PR6 | Mientras no exista la BD, el servicio funciona con datos en memoria. Cada equipo web puede levantar la API en su máquina con `npm install` y `npm start`, sin instalar base de datos. | todos | Pendiente |
| PR7 | El servicio devuelve un código de texto por boleto y cada sitio lo dibuja como QR. | web1, web2 | web_2 está de acuerdo (PR #8). El backend define el código de 12 caracteres (E16, ver QB4). Falta web_1. |
| PR8 | Puertos locales fijos para que todo pueda correr en la misma máquina: `citas_service` en `3000`, `citas_web_1` en `5501` y `citas_web_2` en `5502`. La URL de la API en los sitios es `http://localhost:3000/api/v1`. | web1, web2, backend | web_2 está de acuerdo (PR #8). Faltan web_1 y backend. |
| PR9 | La API permite llamadas desde el navegador (CORS) para `http://localhost:5501` y `http://localhost:5502` (y sus equivalentes `127.0.0.1`), configurables por variable de entorno. | web1, web2 | web_2 está de acuerdo (PR #8). Falta web_1. |

## Decisiones acordadas

| # | Decisión | Acordado con | Fecha |
| --- | --- | --- | --- |
| D1 | `citas_service` se construye con Node.js 20 + Express, OpenAPI 3 y Jest + Supertest. | equipo service | 29 oct 2026 |
| D2 | Canal de comunicación: chat del grupo para conversar y este archivo para registrar acuerdos. | equipo service | 29 oct 2026 |
| D3 | No hay servidor ni dominio: cada equipo ejecuta los proyectos localmente (`localhost`). | equipo service | 29 oct 2026 |
| D4 | (Responde P1) El backend entrega la base de datos con procedimientos almacenados que el servicio invoca (opción C). El servicio no escribe consultas SQL directas. | backend (`citas_backend/docs/BCK_ANTEPROYECTO.md`, E1) | 4 nov 2026 |
| D5 | (Responde P2) El motor es Microsoft SQL Server 2019 o superior (Express o Developer). Se entrega como scripts `.sql` numerados que se ejecutan en SSMS; por ahora no hay Docker. Los datos de conexión llegarán en un `.env.example` del backend, sin contraseñas reales. | backend (`BCK_ANTEPROYECTO.md`, E2 y E8) | 4 nov 2026 |
| D6 | (Venía de PR2) El apartado y el pago son atómicos en la BD: transacción con bloqueo e índice único, para que no se aparte ni se venda dos veces el mismo asiento. | backend (`BCK_ANTEPROYECTO.md`, objetivo 2 y riesgos) | 4 nov 2026 |
| D7 | (Responde P3) El backend carga los datos iniciales de web_1 con `05_datos_iniciales.sql`: 1 sitio, 1 evento, 3 zonas, 120 asientos, 120 funciones, 360 precios y 14,400 asientos por función. Las horas se guardan en UTC (UTC−6 fijo). El repositorio en memoria del servicio usa los mismos datos. | backend (`BCK_DEFINICION.md` §7, E17 y E18) | 6 nov 2026 |
| D8 | (Responde P6) El esquema está documentado en el diccionario de `citas_backend/docs/BCK_DEFINICION.md` §6 y en `citas_backend/docs/architecture/BCK_DIAGRAMA_ER.md`. Cada cambio de esquema se hace con un script numerado nuevo, se avisa en el chat y se actualiza el diccionario. | backend (`BCK_PLAN_TRABAJO.md` §4) | 6 nov 2026 |
| D9 | (Responde P11) `spAsientos_ListarPorFuncion` (SP06) recibe `@Ahora` y devuelve por asiento la zona, la etiqueta, el precio, el `Estado` (Disponible, Apartado o Vendido) y `ExpiraEn`. El servicio no recalcula el estado. | backend (`BCK_DEFINICION.md` RF-B06 y RN01) | 6 nov 2026 |
| D10 | (Responde P12) Los procedimientos lanzan errores `THROW` por rangos y el servicio responde según el rango: 51000–51999 → `409`, 52000–52999 → `410`, 53000–53999 → `422`, 54000–54999 → `404` y 50000 → `500`. Excepción: 53004 se responde con `500` (ver QB5). La lista de códigos está en `BCK_DEFINICION.md` §5.6; la final se cierra en la Especificación del backend. | backend (`BCK_ADR-004-errores-throw-por-rangos.md`) | 6 nov 2026 |
| D11 | (Responde P13) Si algún asiento no está disponible, `spReservas_Crear` no aparta ninguno y lanza `51001` con los Id de los asientos en el texto del mensaje. El servicio usa esos Id (ver QB3); el formato exacto del mensaje está pendiente de que el backend lo confirme. | backend (`BCK_DEFINICION.md` RN08) | 6 nov 2026 |
| D12 | (Responde P7) Para la demo del lun 9 nov todo se corre en **una sola laptop**: la base de datos (si el backend la entrega), `citas_service` (puerto 3000), `citas_web_1` (5501) y `citas_web_2` (5502). | chat del grupo | 6 nov 2026 |
| D13 | (Responde P8) Los horarios de las funciones se guardan en UTC y se muestran en hora de la Ciudad de México (`America/Mexico_City`, UTC−6 todo el año). | backend (E6 y E18), web_2 (PR #8) y chat del grupo | 6 nov 2026 |
| D14 | (Responde P10, venía de PR10) El pago simulado lo define el servicio con **dos tarjetas de prueba**: `4242 4242 4242 4242` siempre se **aprueba** y `4000 0000 0000 0002` siempre se **rechaza**; tras un rechazo se puede reintentar mientras el apartado siga vigente. Con cualquier otro número el servicio responde `400` («usa una tarjeta de prueba»). El sitio envía `numeroTarjeta`, `titular`, `vencimiento` (`MM/AA`, no vencida) y `cvv` (3 dígitos); si el formato es incorrecto, también responde `400`. El servicio **nunca guarda el número completo ni el CVV**; el intento registra sólo los últimos 4 dígitos (columna pendiente, P19). Reemplaza el campo `resultadoSimulado` del borrador de `openapi.yaml`. | chat del grupo | 6 nov 2026 |
