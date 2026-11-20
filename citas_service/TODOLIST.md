# Lista de tareas — citas_service

Entrega: **lunes 23 de noviembre de 2026** (se cambió el 18 nov al llegar OpenSpec; antes era el lun 9 nov). Responsables según `docs/PLAN_TRABAJO.md`: **L** = Líder de contrato (Osvaldo), **R** = Dominio de reservas (Juan Carlos), **D** = Datos e integración (Isaac), **S** = Seguridad y base de la API (Isidro, se integró el 18 nov).

Desde el 18 nov el trabajo pendiente se ejecuta con OpenSpec: el change `openspec/changes/impl-service/` tiene las 34 tareas (sección final de este archivo). QA ya tiene responsables: cada quien escribe las pruebas de su parte y L hace las de contrato.

Para evitar conflictos en git, sólo L edita este archivo; los demás reportan su avance en el chat. Ramas: `service/contrato-v1` (L), `service/reservas` (R), `service/datos-sql` (D) y `service/seguridad-api` (S).

Leyenda de estatus: ⬜ pendiente · 🔄 en progreso · ✅ hecho · 🚧 bloqueado · ⏭️ omitido o reemplazado

## 1. Anteproyecto — jue 29 oct · ✅ 3/3
- [x] Documentar contexto, alcance, consumidores y restricciones en `docs/ANTEPROYECTO.md` (L). **Integrado a `main` en el PR #3.**
- [x] Corregir `AGENTS.md` y crear `CLAUDE.md` para este servicio (L). **Hecho.**
- [x] Plan de trabajo y reparto en `docs/PLAN_TRABAJO.md` (L). **Hecho; el 18 nov se agregó a Isidro y el reparto de `impl-service`.**

## 2. Propuesta — jue 29 oct · ✅ 2/3 · ⏭️ 1
- [x] Documentar alcance, endpoints borrador y dependencias en `docs/PROPUESTA.md` (L). **Integrado a `main` en el PR #3.**
- [x] Crear `docs/specs/ACUERDOS.md` con preguntas abiertas y propuestas (L). **Hecho; P8–P10 agregadas el 29 oct, P11–P13 el 4 nov, P15–P19 y las respuestas a QB2–QB5 del backend el 6 nov, y D15–D25 el 18 nov (preguntas resueltas por el contrato de OpenSpec).**
- [ ] ⏭️ Compartir `ACUERDOS.md` en el chat del grupo y pedir respuestas a P1–P10 antes del viernes (L). **Ya no hace falta: el 18 nov el contrato de OpenSpec resolvió todas las preguntas y propuestas que seguían abiertas (P4, P5, P9, P15–P19, PR1, PR3–PR9 y QB4), registradas como D15–D25. Los cambios nuevos se proponen con un change de OpenSpec (D25).**

## 3. Definición — jue 29 oct · 🔄 2/3
- [ ] 🔄 Requisitos funcionales numerados (RF) y reglas de negocio en `docs/DEFINICION.md` (L, R). **Ya está en `main` (PR #3); falta la revisión de R.**
- [x] Borrador de `docs/specs/contrato-datos-backend.md` y envío al backend (D). **Enviado; el backend lo tomó como fuente de su anteproyecto (4 nov).**
- [x] ADR-001 Express, ADR-002 repositorio y ADR-003 expiración en `docs/architecture/adr/` (L, D). **En `main`; R aceptó ADR-003 el 6 nov (PR #10).**

## 4. Especificación — mié 4 – jue 5 nov · ✅ 1/6 · ⏭️ 5
- [ ] ⏭️ `docs/specs/openapi.yaml` v1 publicado a web_1 y web_2 (L). **Reemplazada por `impl-service` 6.1–6.3 (OpenAPI `1.0.0`).**
- [x] `docs/ESPECIFICACION.md`: estados, errores 409/410 y criterios de aceptación Given/When/Then (R). **Integrado a `main` en el PR #10 (borrador de R). Donde difiera, manda el contrato de OpenSpec (`contrato-entre-capas`).**
- [ ] ⏭️ Mock disponible para los webs a partir del OpenAPI (L). **Omitida: web_1 usa la API real o su modo demo (`impl-web1`).**
- [ ] ⏭️ Skills del proyecto: `etapa`, `endpoint-desde-spec`, `validar-contrato` (L). **Reemplazada por las skills de OpenSpec (`/opsx:apply`, `/opsx:explore`, `/opsx:update`).**
- [ ] ⏭️ Actualizar `docs/specs/contrato-datos-backend.md` con las respuestas del backend (D). **Reemplazada por `contrato-entre-capas` de OpenSpec, que ya fija procedimientos, códigos y semilla.**
- [ ] ⏭️ ADR-004: adaptador a SQL Server y conversión de `THROW` a `409`/`410` (L, D). **Reemplazada por `impl-service` 2.3 (mapeo de errores) y 5.1–5.3 (adaptador SQL).**

## 5. Construcción — mié 4 – sáb 7 nov · ✅ 2/6 · ⏭️ 4
- [x] Esqueleto Express, configuración por entorno y Swagger UI en `/docs` (D). **Integrado a `main` en el PR #11, con CORS, puerto 3000 y `.env.example`.**
- [x] Interfaces de repositorio e implementación en memoria (D). **Integrado a `main` en el PR #11, con la suite de contrato de repositorios.**
- [ ] ⏭️ Apartar, liberar, expirar, pagar (simulado) y límite por persona y función (R). **Reemplazada por `impl-service` 4.1, 4.2, 4.5, 3.3 y 3.4.**
- [ ] ⏭️ Registro e inicio de sesión con el hash de la contraseña calculado en el servicio (D). **Reemplazada por `impl-service` 3.7 y 4.4; pasa a S.**
- [ ] ⏭️ Endpoints de eventos, funciones, asientos, reservas, órdenes y autenticación (R, D). **Reemplazada por `impl-service` 3.1–3.7.**
- [ ] ⏭️ Loop TDD: tomar la siguiente tarea, implementar, correr `npm test` y marcarla (todos). **Reemplazada por `/opsx:apply impl-service` + `npm test` (ver `docs/PLAN_TRABAJO.md`).**

## 6. Pruebas — dom 8 – lun 9 nov · ⬜ 0/5 · ⏭️ 4
- [ ] ⏭️ Pruebas de contrato (rutas implementadas = spec) (L). **Reemplazada por `impl-service` 7.1.**
- [ ] ⏭️ Pruebas de expiración a 5 min con reloj simulado y de apartado simultáneo (R). **Reemplazada por `impl-service` 7.2 y 7.3.**
- [ ] ⏭️ Colección Postman/Swagger para los webs (L). **Omitida: no está en `impl-service`; los webs usan Swagger UI en `/docs`.**
- [ ] ⏭️ Adaptador a la BD real si el backend la entregó (D). **Reemplazada por `impl-service` 5.1–5.3.**
- [ ] Ensayo de la demo y entrega (todos). **Se movió al lun 23 nov; corresponde a `impl-service` 8.1–8.3. Se corre todo en una sola laptop (D12).**

---

## Plan de implementación — change `impl-service` · 🔄 3/34 (actualizado 18 nov 2026)

Fuente: `openspec/changes/impl-service/` (`tasks.md` tiene el texto completo y es donde `/opsx:apply` marca los `[x]`). El contrato entre capas es `openspec/changes/impl-service/specs/contrato-entre-capas/spec.md`. Cómo ejecutar cada tarea: `docs/PLAN_TRABAJO.md`, sección «Cómo ejecutar con OpenSpec».

Decisiones de este plan que corrigen la implementación actual: liberar una reserva vencida responde `410 RESERVA_VENCIDA` y no la libera; el límite de 10 es obligatorio para `web_1`; `web_2` compra sin token.

Olas: **1** jue 19 · **2** vie 20 · **3** sáb 21 · **4** dom 22 · **E** lun 23 (entrega).

### 1. Configuración · ⬜ 0/3
- [ ] 1.1 `JWT_SECRET`, `REPOSITORIO` y `SQL_*` en `config.js`; no arrancar sin `JWT_SECRET` fuera de `test` — **S** · ola 1
- [ ] 1.2 `.env.example` con valores de ejemplo y sin secretos (cambiar `DB_*` por `SQL_*`) — **S** · ola 1
- [ ] 1.3 Dependencias `jsonwebtoken` y `mssql` — **S** · ola 1

### 2. Middlewares · ⬜ 0/3
- [ ] 2.1 `validarSitio` con `X-Sitio` y excepción de `/salud` — **S** · ola 2
- [ ] 2.2 `autenticarComprador` que respeta `RequiereComprador` (depende de 4.3 y 4.4) — **S** · ola 2
- [ ] 2.3 Manejador de errores que mapea `ErrorRepositorio` con la tabla del contrato — **S** · ola 2

### 3. Rutas · ⬜ 0/7
- [ ] 3.1 `GET /salud` — **S** · ola 2
- [ ] 3.2 Catálogo: eventos, funciones y asientos — **D** · ola 3
- [ ] 3.3 Reservas: `POST`, `GET` por id, `GET ?estado=activa` y `DELETE`, con límite obligatorio para `web_1` — **R** · ola 3
- [ ] 3.4 Pago: `POST /reservas/{id}/pago` con tarjetas de prueba y validación de formato — **R** · ola 3
- [ ] 3.5 Órdenes: `GET /ordenes`, `GET /ordenes/{id}` y `GET /ordenes/buscar` — **D** · ola 3
- [ ] 3.6 Reportes: `GET /reportes/reservas-por-dia` con rango máximo de 92 días — **D** · ola 3
- [ ] 3.7 Auth: `POST /auth/registro` y `POST /auth/login` — **S** · ola 3

### 4. Dominio · ⬜ 0/6
- [ ] 4.1 `ReservasRepo.liberar` en memoria: vencida → `410 RESERVA_VENCIDA` sin liberar — **R** · ola 1
- [ ] 4.2 `limitePorComprador` obligatorio para sitios con `RequiereComprador = 1` — **R** · ola 1
- [x] 4.3 Repositorio de sitios en memoria con `web_1` (1) y `web_2` (0) — **D** · ola 1 **Hecho el 19 nov en `service/datos-sql`: `SitiosRepo` y `sitios-repo-memoria.js`; `crearReposEnMemoria` entrega `sitiosRepo`.**
- [ ] 4.4 Hash scrypt y token JWT — **S** · ola 1
- [ ] 4.5 `reservaId` UUID v4 y verificación de sitio — **R** · ola 1
- [x] 4.6 Semilla en memoria de web_2 igual a la del contrato (10 salas, 800 asientos, 900 funciones) — **D** · ola 1 **Hecho el 19 nov en `service/datos-sql`: `datos-iniciales-web2.js` (Spider-Man, 10 salas, 800 asientos, 900 funciones y 900 precios); cada función muestra solo su sala.**

### 5. Adaptador SQL · ⬜ 0/3
- [ ] 5.1 `AsientosRepo`, `ReservasRepo` y `OrdenesRepo` en `app/repos/sql/` llamando solo a procedimientos — **D** · ola 4
- [ ] 5.2 Mapear `Estado` de SP06 a `disponible`, `apartado` y `comprado` — **D** · ola 4
- [ ] 5.3 Pruebas de integración del adaptador, solo con `CitasBD` disponible (si el backend no la entrega, queda 🚧 y se entrega con `REPOSITORIO=memoria`) — **D** · ola 4

### 6. Contrato OpenAPI · ✅ 3/3
- [x] 6.1 `openapi.yaml` a `1.0.0` con todas las rutas, formas y errores del contrato (va primero: ninguna ruta se implementa antes de estar en la spec) — **L** · ola 1 **Hecho el 18 nov en `service/contrato-v1`: 17 rutas, formas y tabla de errores del contrato.**
- [x] 6.2 Quitar `resultadoSimulado` y los ejemplos con el formato anterior — **L** · ola 1 **Hecho con la reescritura de 6.1.**
- [x] 6.3 `redocly lint` sin errores — **L** · ola 1 **18 nov: 0 errores, 3 advertencias aceptadas (sin `license`, `localhost` por D24, `/salud` sin 4XX por contrato).**

### 7. Pruebas · ⬜ 0/6
- [ ] 7.1 Pruebas de contrato por ruta con Supertest — **L** · ola 4
- [ ] 7.2 Pruebas de expiración con reloj fijo — **R** · ola 3
- [ ] 7.3 Pruebas de concurrencia con `Promise.all` en memoria (CA-25) — **R** · ola 3
- [ ] 7.4 Pruebas del límite de web_1 y de que web_2 no tiene límite — **R** · ola 3
- [ ] 7.5 Pruebas de pago: tarjetas de prueba, atomicidad y que no se guarde el número completo — **R** · ola 3
- [ ] 7.6 Mantener verde la suite actual (58 pruebas) — **L** · ola 4

### 8. Entrega · ⬜ 0/3
- [ ] 8.1 `npm test` y `npm start` con `REPOSITORIO=memoria` — **L** · ola 4
- [ ] 8.2 Verificar que `web_1` funciona en modo `api` contra esta versión — **L** · ola 4
- [ ] 8.3 Actualizar este TODOLIST con el avance final — **L** · E

### Resumen por persona

Estos son los números que cada quien le pasa a `/opsx:apply impl-service solo tareas …`, una ola a la vez.

| Quién | Ola 1 (jue 19) | Ola 2 (vie 20) | Ola 3 (sáb 21) | Ola 4 (dom 22) y E | Total |
| --- | --- | --- | --- | --- | --- |
| **L** Osvaldo | 6.1, 6.2, 6.3 | — | — | 7.1, 7.6, 8.1, 8.2, 8.3 | 8 |
| **R** Juan Carlos | 4.1, 4.2, 4.5 | — | 3.3, 3.4, 7.2, 7.3, 7.4, 7.5 | — | 9 |
| **D** Isaac | 4.3, 4.6 | — | 3.2, 3.5, 3.6 | 5.1, 5.2, 5.3 | 8 |
| **S** Isidro | 1.1, 1.2, 1.3, 4.4 | 2.1, 2.3, 3.1, 2.2 | 3.7 | — | 9 |
| **Total** | 12 | 4 | 10 | 8 | **34** |
