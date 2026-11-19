# Acuerdos entre equipos — citas_service

Registro oficial de preguntas, propuestas y decisiones entre `citas_service`, `citas_backend`, `citas_web_1` y `citas_web_2`.

**Cómo se usa:**
1. Una pregunta para otro equipo se registra aquí como `P#` en **Preguntas abiertas**; un cambio de contrato se propone con un change de OpenSpec (D25).
2. Cuando hay respuesta, el líder de contrato la pasa a **Decisiones acordadas** y hace commit.
3. Si una decisión cambia, se edita su fila y se actualiza la fecha.

Entre equipos no se usa el chat (D26); el chat solo sirve para organizarse dentro del equipo service.

Los agentes (pi, Claude) deben respetar todo lo que esté en **Decisiones acordadas**. Lo que esté en **Propuestas** todavía puede cambiar.

**Desde el 18 nov 2026** el contrato entre capas lo fija OpenSpec: `openspec/changes/impl-service/specs/contrato-entre-capas/spec.md`. Ese contrato resolvió todas las preguntas y propuestas que seguían abiertas (D15–D25). Si este archivo y el contrato difieren, manda el contrato. Los cambios nuevos de rutas, formas de datos o errores ya no se acuerdan por chat: se proponen con un change nuevo de OpenSpec (D25).

---

## Preguntas abiertas

| # | Pregunta | Para | Abierta |
| --- | --- | --- | --- |
| P20 | La forma «Función» del contrato (`openapi.yaml` 1.0.0) no tiene `asientosDisponibles`, pero web_1 lo usa en `citas_web_1/app/js/views/cartelera.js` (líneas 165 y 196) con `?? 0`: contra la API real todas las funciones se verían agotadas. ¿web_1 deja de usarlo (y calcula la disponibilidad con `GET /funciones/{id}/asientos`) o se abre un change de OpenSpec para agregar el campo al contrato (D25)? | web_1 | 18 nov 2026 |

Historial: P1 y P2 pasaron a Decisiones (D4 y D5) el 4 nov; P3, P6 y P11–P13 pasaron a D7–D11 el 6 nov con las respuestas de `citas_backend/docs/BCK_DEFINICION.md`; P7, P8 y P10 pasaron a D12–D14 el 6 nov. El 18 nov, P4, P5, P9 y P15–P19 pasaron a D15–D22, resueltas por el contrato de OpenSpec (`contrato-entre-capas`).

P14 («¿el precio va por zona o por zona y función?») se retiró el 4 nov. El precio es una regla del negocio y web_1 ya lo definió en `citas_web_1/docs/DEFINICION.md`: Preferente $800, General $500 y Balcón $300 MXN, iguales en todas las funciones. El backend lo guarda por zona y función en `PreciosZonaFuncion` (`BCK_DEFINICION.md` §6.2), lo que también sirve para el precio por formato de web_2.

## Preguntas del backend al servicio

Vienen de `citas_backend/docs/BCK_DEFINICION.md` §8. QB1 es para web_1.

| # | Pregunta del backend | Respuesta del servicio (6 nov) |
| --- | --- | --- |
| QB2 | `spReservas_Crear` recibirá `@Ahora` y `@ExpiraEn`; la regla de 5 minutos sigue en el servicio. ¿Ok? | **Sí.** El servicio calcula `ExpiraEn = ahora + 5 min` con su reloj configurable (ADR-003) y envía los dos valores en UTC con milisegundos. |
| QB3 | ¿El driver `mssql` lee el conjunto de resultados que llega antes del `THROW 51001`, o sólo el mensaje? | No lo hemos comprobado, así que **no dependeremos de ese conjunto de resultados: usaremos los Id del mensaje.** Pedimos un formato fijo: `Asientos no disponibles: 12,15,18` (Id separados por comas y sin espacios). Pueden conservar el SELECT como algo adicional. |
| QB4 | ¿Sirven el folio `ORD-000123` y el código de boleto de 12 caracteres para el QR? | **Sí** de parte del servicio. **Cerrada el 18 nov:** el contrato de OpenSpec fija el folio `ORD-` + 6 dígitos y el código de 12 caracteres `[A-Z2-9]` (D24). |
| QB5 | Errores nuevos: 53004 (vencimiento inválido, 422) y 54005 (sitio o evento no encontrado, 404). | **Ok.** Sólo una aclaración: 53004 significa que el servicio envió mal `@ExpiraEn`, así que para el sitio es un error interno; el servicio lo registra y responde `500`, no `422`. 54005 se responde con `404`. |

## Propuestas del servicio (pendientes de confirmar)

**No hay propuestas pendientes desde el 18 nov 2026.** PR1 y PR3–PR9 quedaron confirmadas por el contrato de OpenSpec y pasaron a D23 y D24. PR2 había pasado a D6 el 4 nov y PR10 a D14 el 6 nov.

## Decisiones acordadas

| # | Decisión | Acordado con | Fecha |
| --- | --- | --- | --- |
| D1 | `citas_service` se construye con Node.js 20 + Express, OpenAPI 3 y Jest + Supertest. | equipo service | 29 oct 2026 |
| D2 | ~~Canal de comunicación: chat del grupo para conversar y este archivo para registrar acuerdos.~~ Reemplazada por D26 el 18 nov 2026. | equipo service | 29 oct 2026 |
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
| D15 | (Responde P4) web_2 es un cineclub: 1 evento («Spider-Man»); 10 salas registradas como zonas («Sala 1» a «Sala 10»), cada una con 80 butacas (filas A–H, números 1–10); salas 1–5 en 2D a $100 MXN y salas 6–10 en 3D a $150 MXN; 30 funciones por día. La semilla va del 19 nov al 18 dic 2026 (900 funciones). `idioma` y `clasificacion` se cargan como «Por confirmar». | contrato de OpenSpec (`contrato-entre-capas`, «Semilla de datos acordada») | 18 nov 2026 |
| D16 | (Responde P5) Las cuentas las maneja el servicio: `POST /auth/registro` y `POST /auth/login`, token JWT HS256 de 8 horas firmado con `JWT_SECRET`, y hash `crypto.scrypt` con sal por comprador. La BD guarda solo el hash. Correo repetido → `409 CORREO_REGISTRADO`; credenciales incorrectas → `401 NO_AUTENTICADO`, sin decir qué dato falló. Solo web_1 exige cuenta (D18). | contrato de OpenSpec («Autenticación de compradores») | 18 nov 2026 |
| D17 | (Responde P9) La reserva es todo o nada: si algún asiento no está disponible, ninguno se aparta y la respuesta es `409 ASIENTO_NO_DISPONIBLE` con `detalles.asientoIds` (todos los asientos en conflicto). | contrato de OpenSpec («Reserva de asientos») | 18 nov 2026 |
| D18 | (Responde P15) Cada sitio tiene la bandera `RequiereComprador`. web_1 (`1`) exige `Authorization: Bearer` para reservar, pagar y listar sus reservas y órdenes. web_2 (`0`) hace lo mismo sin token: la reserva no tiene comprador y se identifica por su `id` (UUID v4), que solo es accesible desde el mismo sitio. El límite de 10 asientos aplica solo a web_1. El backend hace nulables `IdComprador` en reservas y órdenes. | contrato de OpenSpec («Reglas de identidad por sitio») | 18 nov 2026 |
| D19 | (Responde P16) La función incluye los campos opcionales `formato`, `idioma`, `clasificacion` y `duracionMinutos`. Las salas de web_2 son zonas con capacidad. | contrato de OpenSpec («Formas de datos») | 18 nov 2026 |
| D20 | (Responde P17) `GET /api/v1/ordenes/buscar` recibe exactamente uno de `folio` o `codigo` y filtra por `X-Sitio`. Si llegan los dos o ninguno → `400`; si no existe o es de otro sitio → `404`. El backend lo atiende con `spOrdenes_Buscar`. | contrato de OpenSpec («Recuperar compra sin cuenta») | 18 nov 2026 |
| D21 | (Responde P18) `GET /api/v1/reportes/reservas-por-dia?desde=…&hasta=…` cuenta las reservas creadas por día en hora de CDMX, sin importar su estado final y sin desglose por sala. El rango máximo es de 92 días. El backend lo atiende con `spReservas_ContarPorDia`. | contrato de OpenSpec («Conteo diario de reservas») | 18 nov 2026 |
| D22 | (Responde P19) El intento de pago guarda solo los últimos 4 dígitos (`IntentosPago.UltimosDigitos`); nunca el número completo ni el CVV. | contrato de OpenSpec («Pago simulado») | 18 nov 2026 |
| D23 | (Venía de PR1, PR3 y PR4) El apartado dura 5 minutos: el servicio calcula `expiraEn = creadaEn + 300 s` con su reloj y la BD recibe `@Ahora` y `@ExpiraEn` (PR1). Los errores siguen la tabla de mapeo del contrato: `409` por conflicto, `410` por reserva vencida o liberada, `422` por límite y `404` si no existe (PR3). El límite de 10 asientos por comprador y función se valida solo para web_1 (PR4). | contrato de OpenSpec («Reserva de asientos», «Mapeo de errores», «Fechas y zona horaria») | 18 nov 2026 |
| D24 | (Venía de PR5–PR9 y QB4) La API vive bajo `http://localhost:3000/api/v1` y exige `X-Sitio` (`web_1` o `web_2`) en cada petición, salvo `/salud` (PR5); Swagger UI en `/docs` sigue por `AGENTS.md`. El repositorio por defecto es `memoria` (`REPOSITORIO=memoria`) y `sql` es opcional (PR6). Cada boleto trae un `codigo` de 12 caracteres `[A-Z2-9]` y la orden un folio `ORD-` + 6 dígitos; el contrato no define el QR (PR7, QB4). Puertos: servicio `3000`, web_1 `5501` y web_2 `5502` (PR8). CORS solo para esos dos sitios en `localhost` y `127.0.0.1`, configurable con `CORS_ORIGINS` (PR9). | contrato de OpenSpec («Base de la API», «Puertos y orígenes permitidos», «Formas de datos») | 18 nov 2026 |
| D25 | Cualquier cambio en rutas, formas de datos o códigos de error se hace con un change nuevo de OpenSpec que actualice el contrato y `openapi.yaml`; ya no se acuerda por chat ni en archivos de otros equipos. Este archivo sigue como registro del servicio. | contrato de OpenSpec («Cambios de este contrato») | 18 nov 2026 |
| D26 | (Reemplaza D2) Entre equipos ya no se usa el chat del grupo: los cambios de contrato van en un change de OpenSpec (D25) y las preguntas y decisiones se registran en este archivo. El chat solo sirve para que el equipo service se organice. | equipo service | 18 nov 2026 |
