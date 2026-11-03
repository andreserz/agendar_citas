# Acuerdos entre equipos — citas_service

Registro oficial de preguntas, propuestas y decisiones entre `citas_service`, `citas_backend`, `citas_web_1` y `citas_web_2`.

**Cómo se usa:**
1. Se conversa en el chat del grupo.
2. Cuando hay respuesta, el líder de contrato la copia aquí y hace commit.
3. Si una decisión cambia, se edita su fila, se actualiza la fecha y se avisa en el chat.

Los agentes (pi, Claude) deben respetar todo lo que esté en **Decisiones acordadas**. Lo que esté en **Propuestas** todavía puede cambiar.

---

## Preguntas abiertas

| # | Pregunta | Para | Fecha límite |
| --- | --- | --- | --- |
| P1 | ¿Qué nos entregan: (A) solo la base de datos y nosotros escribimos las consultas, (B) una API propia que nosotros llamamos por HTTP, o (C) la base de datos con procedimientos almacenados | backend | vie 30 oct |
| P2 | ¿Qué motor de BD usarán y cómo la entregan para correrla localmente: Docker Compose (recomendado), scripts SQL (`schema.sql`, `seed.sql`) o archivo SQLite? ¿Qué datos de conexión usamos (host, puerto, nombre de la BD)? Se comparten en un `.env.example`, nunca con contraseñas reales. | backend | vie 30 oct |
| P3 | ¿Quién carga los datos iniciales (eventos, funciones, asientos, precios)? | backend | vie 30 oct |
| P4 | ¿Qué negocio es web_2 y qué datos necesita (asientos numerados, zonas, cupo general)? | web2 | vie 30 oct |
| P5 | ¿Las cuentas de usuario (registro e inicio de sesión) las maneja el servicio o cada sitio? | web1, web2 | vie 30 oct |
| P6 | ¿Dónde está documentado el esquema (diccionario de datos, diagrama o `schema.sql`)? Si necesitamos una columna nueva, ¿quién la agrega y cómo nos avisan? | backend | vie 30 oct |
| P7 | Para la demo del lunes, ¿se corre todo en una sola laptop o cada equipo muestra su parte en la suya? | todos | dom 1 nov |
| P8 | ¿En qué zona horaria se expresan los horarios de las funciones? Propuesta del servicio: guardar en UTC y entregar con zona `America/Mexico_City`. | web1, web2, backend | vie 30 oct |
| P9 | Si se piden varios asientos en una reserva y alguno ya no está disponible, ¿se rechaza toda la reserva o se apartan sólo los libres? Propuesta del servicio: rechazar toda la reserva con `409` e indicar qué asientos fallaron. | web1, web2 | vie 30 oct |
| P10 | ¿Cómo elige el sitio el resultado del pago simulado: datos de prueba (por ejemplo, tarjetas que siempre aprueban o rechazan) o un campo en la petición? | web1, web2 | vie 30 oct |


## Propuestas del servicio (pendientes de confirmar)

| # | Propuesta | Para confirmar con | Estado |
| --- | --- | --- | --- |
| PR1 | El apartado dura 5 minutos y la expiración la controla el servicio; la BD solo guarda `estado` y `expira_en`. | backend, web1, web2 | Pendiente |
| PR2 | Apartar un asiento debe ser atómico (restricción única o transacción) para que dos sitios no aparten el mismo. | backend | Pendiente |
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
