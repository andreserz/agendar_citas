# Acuerdos entre equipos — citas_service

Registro oficial de preguntas, propuestas y decisiones entre `citas_service`, `citas_backend`, `citas_web_1` y `citas_web_2`.

**Cómo se usa:**
1. Se conversa en el chat del grupo.
2. Cuando hay respuesta, el líder de contrato la copia aquí y hace commit.
3. Si una decisión cambia, se edita su fila, se actualiza la fecha y se avisa en el chat.

Los agentes (pi, Claude) deben respetar todo lo que esté en **Decisiones acordadas**. Lo que esté en **Propuestas** todavía puede cambiar.

---

## Preguntas abiertas

Las fechas límite se movieron el 4 nov porque la entrega ahora es el **lun 9 nov**. P1 y P2 ya se respondieron y pasaron a Decisiones (D4 y D5).

| # | Pregunta | Para | Fecha límite |
| --- | --- | --- | --- |
| P3 | ¿Quién carga los datos iniciales (eventos, funciones, asientos, precios)? **Respuesta parcial (backend, 4 nov):** propone cargarlos él con `05_datos_iniciales.sql` (sólo los de web_1); falta confirmarlo. | backend | vie 6 nov |
| P4 | ¿Qué negocio es web_2 y qué datos necesita (asientos numerados, zonas, cupo general)? | web2 | vie 6 nov |
| P5 | ¿Las cuentas de usuario (registro e inicio de sesión) las maneja el servicio o cada sitio? **Propuesta del backend (E3, 4 nov):** la BD guarda a los compradores (nombre, correo único y hash de la contraseña); el hash, la autenticación y los tokens los hace el servicio. Falta que respondan web_1 y web_2. | web1, web2 | vie 6 nov |
| P6 | ¿Dónde está documentado el esquema (diccionario de datos, diagrama o `schema.sql`)? Si necesitamos una columna nueva, ¿quién la agrega y cómo nos avisan? **Respuesta parcial (backend, 4 nov):** el diccionario de datos, con la equivalencia de cada campo del contrato, irá en `BCK_DEFINICION.md` y el diagrama en `citas_backend/docs/architecture/`. Falta responder la segunda parte. | backend | vie 6 nov |
| P7 | Para la demo del lunes 9 nov, ¿se corre todo en una sola laptop o cada equipo muestra su parte en la suya? | todos | sáb 7 nov |
| P8 | ¿En qué zona horaria se expresan los horarios de las funciones? Propuesta del servicio: guardar en UTC y entregar con zona `America/Mexico_City`. **El backend la acepta (E6, 4 nov).** Falta que respondan web_1 y web_2. | web1, web2 | vie 6 nov |
| P9 | Si se piden varios asientos en una reserva y alguno ya no está disponible, ¿se rechaza toda la reserva o se apartan sólo los libres? Propuesta del servicio: rechazar toda la reserva con `409` e indicar qué asientos fallaron. **El backend ya diseña `spReservas_Crear` así (4 nov).** | web1, web2 | vie 6 nov |
| P10 | ¿Cómo elige el sitio el resultado del pago simulado: datos de prueba (por ejemplo, tarjetas que siempre aprueban o rechazan) o un campo en la petición? | web1, web2 | vie 6 nov |
| P11 | Para listar los asientos de una función, ¿`spAsientos_ListarPorFuncion` recibe `@Ahora` y devuelve si cada asiento está disponible, apartado o vendido, o devuelve `ExpiraEn` y el servicio lo calcula? | backend | vie 6 nov |
| P12 | ¿Qué códigos de error `THROW` (50000 o más) devuelve cada procedimiento? El servicio los necesita para responder `409` (no disponible), `410` (reserva vencida) o `422` (regla incumplida, por ejemplo el límite de 10). | backend | vie 6 nov |
| P13 | Cuando `spReservas_Crear` falla porque algunos asientos no están disponibles, ¿cómo indica cuáles son: un conjunto de resultados, un parámetro `OUTPUT` o el texto del mensaje? | backend | vie 6 nov |
| P14 | ¿El precio va por zona o por zona y función? Afecta el campo `precio` de la spec. | backend | vie 6 nov |


## Propuestas del servicio (pendientes de confirmar)

| # | Propuesta | Para confirmar con | Estado |
| --- | --- | --- | --- |
| PR1 | El apartado dura 5 minutos y la expiración la controla el servicio; la BD solo guarda `estado` y `expira_en`. | backend, web1, web2 | El backend la acepta: no guarda el estado «vencida» y los procedimientos reciben `@Ahora` (E7, 4 nov). Falta que respondan web_1 y web_2. |
| PR3 | Errores: `409` cuando el asiento ya no está disponible, `410` cuando la reserva expiró. | web1, web2 | Pendiente |
| PR4 | Máximo 10 asientos por persona y función, validado en el servicio. | web1, web2 | Pendiente |
| PR5 | La API se publica bajo `/api/v1` con Swagger UI en `/docs`; cada sitio se identifica en cada petición. | web1, web2 | Pendiente |
| PR6 | Mientras no exista la BD, el servicio funciona con datos en memoria. Cada equipo web puede levantar la API en su máquina con `npm install` y `npm start`, sin instalar base de datos. | todos | Pendiente |
| PR7 | El servicio devuelve un código de texto por boleto y cada sitio lo dibuja como QR. | web1, web2 | Pendiente |
| PR8 | Puertos locales fijos para que todo pueda correr en la misma máquina: `citas_service` en `3000`, `citas_web_1` en `5501` y `citas_web_2` en `5502`. La URL de la API en los sitios es `http://localhost:3000/api/v1`. | web1, web2, backend | Pendiente |
| PR9 | La API permite llamadas desde el navegador (CORS) para `http://localhost:5501` y `http://localhost:5502` (y sus equivalentes `127.0.0.1`), configurables por variable de entorno. | web1, web2 | Pendiente |

## Decisiones acordadas

| # | Decisión | Acordado con | Fecha |
| --- | --- | --- | --- |
| D1 | `citas_service` se construye con Node.js 20 + Express, OpenAPI 3 y Jest + Supertest. | equipo service | 29 oct 2026 |
| D2 | Canal de comunicación: chat del grupo para conversar y este archivo para registrar acuerdos. | equipo service | 29 oct 2026 |
| D3 | No hay servidor ni dominio: cada equipo ejecuta los proyectos localmente (`localhost`). | equipo service | 29 oct 2026 |
| D4 | (Responde P1) El backend entrega la base de datos con procedimientos almacenados que el servicio invoca (opción C). El servicio no escribe consultas SQL directas. | backend (`citas_backend/docs/BCK_ANTEPROYECTO.md`, E1) | 4 nov 2026 |
| D5 | (Responde P2) El motor es Microsoft SQL Server 2019 o superior (Express o Developer). Se entrega como scripts `.sql` numerados que se ejecutan en SSMS; por ahora no hay Docker. Los datos de conexión llegarán en un `.env.example` del backend, sin contraseñas reales. | backend (`BCK_ANTEPROYECTO.md`, E2 y E8) | 4 nov 2026 |
| D6 | (Venía de PR2) El apartado y el pago son atómicos en la BD: transacción con bloqueo e índice único, para que no se aparte ni se venda dos veces el mismo asiento. | backend (`BCK_ANTEPROYECTO.md`, objetivo 2 y riesgos) | 4 nov 2026 |
