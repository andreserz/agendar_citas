# Lista de tareas — citas_service

Entrega: lunes 2 de noviembre de 2026. Responsables según `docs/PLAN_TRABAJO.md`: **L** = Líder de contrato (Osvaldo), **R** = Dominio de reservas (Juan Carlos), **D** = Datos e integración (Isaac), **Q** = QA / pruebas (por asignar).

Leyenda de estatus: ⬜ pendiente · 🔄 en progreso · ✅ hecho · 🚧 bloqueado · ⏭️ omitido

## 1. Anteproyecto — jue 29 oct · 🔄 2/3
- [ ] 🔄 Documentar contexto, alcance, consumidores y restricciones en `docs/ANTEPROYECTO.md` (L). **Borrador listo y corregido; falta revisión del equipo.**
- [x] Corregir `AGENTS.md` y crear `CLAUDE.md` para este servicio (L). **Hecho.**
- [x] Plan de trabajo y reparto en `docs/PLAN_TRABAJO.md` (L). **Hecho.**

## 2. Propuesta — jue 29 oct · 🔄 1/3
- [ ] 🔄 Documentar alcance, endpoints borrador y dependencias en `docs/PROPUESTA.md` (L). **Borrador listo y corregido; falta revisión del equipo.**
- [x] Crear `docs/specs/ACUERDOS.md` con preguntas abiertas y propuestas (L). **Hecho; P8–P10 agregadas el 29 oct.**
- [ ] 🔄 Compartir `ACUERDOS.md` en el chat del grupo y pedir respuestas a P1–P10 antes del viernes (L). **P1–P6 enviadas, sin respuesta; faltan enviar P7–P10.**

## 3. Definición — jue 29 oct · 🔄 0/3
- [ ] 🔄 Requisitos funcionales numerados (RF) y reglas de negocio en `docs/DEFINICION.md` (L, R). **Borrador listo; falta revisión de L y R.**
- [ ] 🔄 Borrador de `docs/specs/contrato-datos-backend.md` y envío al backend (D). **Borrador listo; falta revisión de D y envío al backend.**
- [ ] 🔄 ADR-001 Express, ADR-002 repositorio y ADR-003 expiración en `docs/architecture/adr/` (L, D). **Redactados; ADR-003 queda como propuesta hasta que R la revise.**

## 4. Especificación — vie 30 oct · 🔄 0/4
- [ ] 🔄 `docs/specs/openapi.yaml` v1 publicado a web_1 y web_2 (L). **Borrador v0.1 con 14 operaciones; válido con `redocly lint` (29 oct, 0 errores). Falta revisarlo con el equipo y publicarlo a los webs.**
- [ ] `docs/ESPECIFICACION.md`: estados, errores 409/410 y criterios de aceptación Given/When/Then (R, Q). **Pendiente.**
- [ ] Mock disponible para los webs a partir del OpenAPI (Q). **Pendiente.**
- [ ] Skills del proyecto: `etapa`, `endpoint-desde-spec`, `validar-contrato` (L). **Pendiente.**

## 5. Construcción — sáb 31 oct – dom 1 nov · ⬜ 0/5
- [ ] Esqueleto Express, configuración por entorno y Swagger UI en `/docs` (D). **Pendiente.**
- [ ] Interfaces de repositorio e implementación en memoria (D). **Pendiente.**
- [ ] Apartar, liberar, expirar, pagar (simulado) y límite por persona y función (R). **Pendiente.**
- [ ] Endpoints de eventos, funciones, asientos, reservas, órdenes y autenticación (R, D). **Pendiente.**
- [ ] Loop TDD: tomar la siguiente tarea, implementar, correr `npm test` y marcarla (todos). **Pendiente.**

## 6. Pruebas — dom 1 – lun 2 nov · ⬜ 0/4
- [ ] Pruebas de contrato (rutas implementadas = spec) (Q). **Pendiente.**
- [ ] Pruebas de expiración a 5 min con reloj simulado y de apartado simultáneo (Q, R). **Pendiente.**
- [ ] Colección Postman/Swagger para los webs (Q). **Pendiente.**
- [ ] Adaptador a la BD real si el backend la entregó; si no, documentar el siguiente paso (D). **Pendiente.**
