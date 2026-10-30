# Lista de tareas — citas_service

Entrega: lunes 2 de noviembre de 2026. Responsables según `docs/PLAN_TRABAJO.md`: **L** = Líder de contrato (Osvaldo), **R** = Dominio de reservas (Persona 2), **D** = Datos e integración (Persona 3), **Q** = QA / pruebas (Persona 4).

## 1. Anteproyecto — jue 29 oct
- [ ] Documentar contexto, alcance, consumidores y restricciones en `docs/ANTEPROYECTO.md` (L). **Pendiente.**
- [x] Corregir `AGENTS.md` y crear `CLAUDE.md` para este servicio (L). **Hecho.**
- [x] Plan de trabajo y reparto en `docs/PLAN_TRABAJO.md` (L). **Hecho.**

## 2. Propuesta — jue 29 oct
- [ ] Documentar alcance, endpoints borrador y dependencias en `docs/PROPUESTA.md` (L). **Pendiente.**
- [x] Crear `docs/specs/ACUERDOS.md` con preguntas abiertas y propuestas (L). **Hecho.**
- [ ] Compartir `ACUERDOS.md` en el chat del grupo y pedir respuestas a P1–P8 antes del viernes (L). **Pendiente.**

## 3. Definición — jue 29 oct
- [ ] Requisitos funcionales numerados (RF) y reglas de negocio en `docs/DEFINICION.md` (L, R). **Pendiente.**
- [ ] Borrador de `docs/specs/contrato-datos-backend.md` y envío al backend (D). **Pendiente.**
- [ ] ADR-001 Express, ADR-002 repositorio y ADR-003 expiración en `docs/architecture/adr/` (L, D). **Pendiente.**

## 4. Especificación — vie 30 oct
- [ ] `docs/specs/openapi.yaml` v1 publicado a web_1 y web_2 (L). **Pendiente.**
- [ ] `docs/ESPECIFICACION.md`: estados, errores 409/410 y criterios de aceptación Given/When/Then (R, Q). **Pendiente.**
- [ ] Mock disponible para los webs a partir del OpenAPI (Q). **Pendiente.**
- [ ] Skills del proyecto: `etapa`, `endpoint-desde-spec`, `validar-contrato` (L). **Pendiente.**

## 5. Construcción — sáb 31 oct – dom 1 nov
- [ ] Esqueleto Express, configuración por entorno y Swagger UI en `/docs` (D). **Pendiente.**
- [ ] Interfaces de repositorio e implementación en memoria (D). **Pendiente.**
- [ ] Apartar, liberar, expirar, pagar (simulado) y límite por persona y función (R). **Pendiente.**
- [ ] Endpoints de eventos, funciones, asientos, reservas, órdenes y autenticación (R, D). **Pendiente.**
- [ ] Loop TDD: tomar la siguiente tarea, implementar, correr `npm test` y marcarla (todos). **Pendiente.**

## 6. Pruebas — dom 1 – lun 2 nov
- [ ] Pruebas de contrato (rutas implementadas = spec) (Q). **Pendiente.**
- [ ] Pruebas de expiración a 5 min con reloj simulado y de apartado simultáneo (Q, R). **Pendiente.**
- [ ] Colección Postman/Swagger para los webs (Q). **Pendiente.**
- [ ] Adaptador a la BD real si el backend la entregó; si no, documentar el siguiente paso (D). **Pendiente.**
