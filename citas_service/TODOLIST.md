# Lista de tareas — citas_service

Entrega: **lunes 9 de noviembre de 2026** (se cambió el 4 nov; la fecha original era el lun 2 nov). Responsables según `docs/PLAN_TRABAJO.md`: **L** = Líder de contrato (Osvaldo), **R** = Dominio de reservas (Juan Carlos), **D** = Datos e integración (Isaac).

QA sigue sin responsable. Propuesta del 4 nov (falta confirmarla en el chat): R escribe los criterios de aceptación y prueba su dominio, D prueba repositorios y autenticación, y L hace las pruebas de contrato, el mock y la colección Postman.

Para evitar conflictos en git, sólo L edita este archivo; los demás reportan su avance en el chat. Ramas: `service/especificacion` (L, R), `service/esqueleto` (D) y `service/reservas` (R).

Leyenda de estatus: ⬜ pendiente · 🔄 en progreso · ✅ hecho · 🚧 bloqueado · ⏭️ omitido

## 1. Anteproyecto — jue 29 oct · ✅ 3/3
- [x] Documentar contexto, alcance, consumidores y restricciones en `docs/ANTEPROYECTO.md` (L). **Integrado a `main` en el PR #3.**
- [x] Corregir `AGENTS.md` y crear `CLAUDE.md` para este servicio (L). **Hecho.**
- [x] Plan de trabajo y reparto en `docs/PLAN_TRABAJO.md` (L). **Hecho.**

## 2. Propuesta — jue 29 oct · 🔄 2/3
- [x] Documentar alcance, endpoints borrador y dependencias en `docs/PROPUESTA.md` (L). **Integrado a `main` en el PR #3.**
- [x] Crear `docs/specs/ACUERDOS.md` con preguntas abiertas y propuestas (L). **Hecho; P8–P10 agregadas el 29 oct, P11–P13 el 4 nov, y P15–P18 y las respuestas a QB2–QB5 del backend el 6 nov.**
- [ ] 🔄 Compartir `ACUERDOS.md` en el chat del grupo y pedir respuestas a P1–P10 antes del viernes (L). **El 4 nov se registraron las respuestas del backend tomadas de `BCK_ANTEPROYECTO.md` (P1 y P2 pasaron a D4 y D5, y PR2 a D6). El 6 nov se registraron las de `BCK_DEFINICION.md` (P3, P6 y P11–P13 pasaron a D7–D11), las respuestas del servicio a QB2–QB5 y la respuesta parcial de web_2 (PR #8, sin integrar). Falta avisar en el chat: enviar las respuestas a QB2–QB5 y pedir P15–P18 al backend y a web_2, y P5 y P7–P10 a web_1.**

## 3. Definición — jue 29 oct · 🔄 1/3
- [ ] 🔄 Requisitos funcionales numerados (RF) y reglas de negocio en `docs/DEFINICION.md` (L, R). **Ya está en `main` (PR #3); falta la revisión de R.**
- [x] Borrador de `docs/specs/contrato-datos-backend.md` y envío al backend (D). **Enviado; el backend lo tomó como fuente de su anteproyecto (4 nov).**
- [ ] 🔄 ADR-001 Express, ADR-002 repositorio y ADR-003 expiración en `docs/architecture/adr/` (L, D). **Ya están en `main`; falta que R revise ADR-003. El backend ya acepta recibir `@Ahora` (E7).**

## 4. Especificación — mié 4 – jue 5 nov · 🔄 0/6
- [ ] 🔄 `docs/specs/openapi.yaml` v1 publicado a web_1 y web_2 (L). **Borrador v0.1 con 14 operaciones; válido con `redocly lint` (29 oct, 0 errores). Falta agregar las respuestas del backend (errores por rango, D10 y D11), P9, P10 y la compra sin cuenta de web_2 (P15), volver a validarlo y publicarlo a los webs. Va atrasado: vencía el jue 5.**
- [ ] `docs/ESPECIFICACION.md`: estados, errores 409/410 y criterios de aceptación Given/When/Then (R). **Pendiente.**
- [ ] Mock disponible para los webs a partir del OpenAPI (L). **Pendiente. Se puede omitir si los webs usan la API en memoria (PR6).**
- [ ] Skills del proyecto: `etapa`, `endpoint-desde-spec`, `validar-contrato` (L). **Pendiente.**
- [ ] Actualizar `docs/specs/contrato-datos-backend.md` con las respuestas del backend (SQL Server, procedimientos almacenados, `@Ahora` y `@ExpiraEn`, nombres en español, hash calculado en el servicio) (D). **Pendiente. P11–P13 ya se respondieron (D9–D11); el diccionario de referencia es `BCK_DEFINICION.md` §6 (D8).**
- [ ] ADR-004: adaptador a SQL Server mediante procedimientos almacenados, y cómo los errores `THROW` (50000 o más) se convierten en `409`/`410` (L, D). **Pendiente; ya no está bloqueado: la tabla de rangos está en D10 y la lectura de los asientos que fallan en D11.**

## 5. Construcción — mié 4 – sáb 7 nov · ⬜ 0/6
- [ ] Esqueleto Express, configuración por entorno y Swagger UI en `/docs` (D). **Pendiente. Incluye CORS (PR9), puerto 3000 (PR8) y `.env.example` sin secretos. Va primero porque las tareas de R dependen de él; empieza el mié 4.**
- [ ] Interfaces de repositorio e implementación en memoria (D). **Pendiente. Usar los mismos datos iniciales que cargará el backend (D7: 1 evento, 120 funciones, 3 zonas y 120 asientos) y lanzar los mismos códigos de error (D10) para cambiarlo después por SQL Server sin tocar la lógica.**
- [ ] Apartar, liberar, expirar, pagar (simulado) y límite por persona y función (R). **Pendiente.**
- [ ] Registro e inicio de sesión con el hash de la contraseña calculado en el servicio (D). **Pendiente. Depende de P5 (propuesta E3 del backend) y de P15: web_2 compra sin cuenta.**
- [ ] Endpoints de eventos, funciones, asientos, reservas, órdenes y autenticación (R, D). **Pendiente.**
- [ ] Loop TDD: tomar la siguiente tarea, implementar, correr `npm test` y marcarla (todos). **Pendiente.**

## 6. Pruebas — dom 8 – lun 9 nov · ⬜ 0/5
- [ ] Pruebas de contrato (rutas implementadas = spec) (L). **Pendiente.**
- [ ] Pruebas de expiración a 5 min con reloj simulado y de apartado simultáneo (R). **Pendiente.**
- [ ] Colección Postman/Swagger para los webs (L). **Pendiente.**
- [ ] Adaptador a la BD real si el backend la entregó; si no, documentar el siguiente paso (D). **Pendiente. El 4 nov el backend terminó su etapa 1; lo más probable es entregar con datos en memoria y dejar el siguiente paso documentado en ADR-004.**
- [ ] Ensayo de la demo y entrega el lun 9 nov (todos). **Pendiente. Depende de P7.**
