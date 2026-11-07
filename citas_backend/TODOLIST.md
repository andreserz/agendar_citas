# TODOLIST — citas_backend

Leyenda: ✅ terminado · 🔄 en curso · ⏳ pendiente · ⛔ bloqueado

Responsables (ver `docs/BCK_PLAN_TRABAJO.md`): **S** = Sandra (líder), **A** = Alfredo (modelo y datos), **H** = Hugo (SP y pruebas). Por ahora S también puede ejecutar las tareas de A y H; en ese caso se anota `(A → ejecutó S)`. Sólo S edita este archivo.

Regla de trabajo: al terminar cada etapa se avisa al usuario y **no se inicia la siguiente hasta que la verifique**.

Entrega: **lun 9 nov 2026**.

## Etapa 1 — Anteproyecto ✅ (aprobado 4 nov 2026)
- ✅ Crear el worktree `bck-anteproyecto` (rama `backend/anteproyecto`) (S)
- ✅ Crear el subagente `.claude/agents/sqlserver-dba.md` (S)
- ✅ Leer `citas_web_1/docs/PROPUESTA.md` y `DEFINICION.md` (S)
- ✅ Leer el contrato y los acuerdos de `citas_service` (S)
- ✅ Entrevista: decisiones E1–E8 (S)
- ✅ Redactar `docs/BCK_ANTEPROYECTO.md` (S)
- ✅ Verificación y aprobación del usuario (S)
- ✅ Commit, push y pull request a `main` (PR #4, integrado) (S)

## Etapa 2 — Propuesta ✅ (aprobado 5 nov 2026)
- ✅ Entrevista: decisiones E9–E13 (5 nov 2026) (S)
- ✅ Decidir el precio: por zona y función (E9, responde P14) (S)
- ✅ `docs/BCK_PROPUESTA.md`: modelo de datos, SP01–SP17, índices, trazabilidad con el contrato, rangos `THROW` y respuestas a P3, P6 y P11–P14 (S)
- ✅ Mensaje para el chat del grupo (§8 de la propuesta) (S)
- ✅ Verificación y aprobación del usuario (S)
- ✅ Enviar el mensaje al chat (enviado el 5 nov 2026) (S)
- ✅ Commit, push y pull request a `main` (PR #6, integrado el 5 nov 2026) (S)

## Etapa 3 — Definición ✅ (aprobado 5 nov 2026, rama `backend/definicion`)
- ✅ Plan de trabajo del equipo en `docs/BCK_PLAN_TRABAJO.md` (S)
- ✅ Entrevista: decisiones E14–E18 (S)
- ✅ `docs/BCK_DEFINICION.md`: requisitos RF-B01–RF-B19, requisitos no funcionales, reglas RN01–RN27 y códigos de error (S)
- ✅ `docs/BCK_DEFINICION.md` §6–§7: diccionario de datos con equivalencias del contrato y datos iniciales (A → ejecutó S)
- ✅ `docs/architecture/BCK_DIAGRAMA_ER.md`: diagrama entidad-relación (A → ejecutó S)
- ✅ `docs/architecture/adr/`: BCK ADR-001 a ADR-004 (S)
- ✅ Verificación y aprobación del usuario (S)
- ✅ Enviar al chat las preguntas QB1–QB5 (§8 de la definición; enviado el 5 nov 2026) (S)
- ✅ Commit, push y pull request a `main` (PR #7, abierto el 5 nov 2026) (S)

## Respuestas a otros equipos (P15–P19, límite sáb 7 nov)
- ✅ Revisar las preguntas pendientes en `citas_service/docs/specs/ACUERDOS.md` (6 nov 2026) (S)
- ✅ `docs/BCK_RESPUESTAS_P15_P19.md`: propuesta de respuesta a P15–P19, preguntas nuevas QB6–QB8 para web_2 y mensaje para el chat (S)
- ✅ Verificación y aprobación de la usuaria (6 nov 2026) (S)
- ⏳ Enviar el mensaje al chat (§9) (S)
- ⏳ Enviar a web_2 el aviso sobre `UQ_Funciones_IdEvento_FechaHoraInicio` (§10) y esperar QB6–QB8 (S)
- ⏳ Llevar los cambios aprobados a `BCK_ESPECIFICACION.md` (columnas, SP18, SP19 y errores 53005–53007) (H, A)
- ⏳ Confirmar en el chat: PR8 (puertos) y el formato del mensaje de `51001` (QB3 y D11) (S)
- ✅ Commit, push y pull request a `main` (PR #12, rama `backend/respuestas-p15-p19`, integrado el 6 nov 2026) (S)
- ✅ Revisar la Definición de web_2 (PR #13): RN06 coincide con SP19; RN05 se ajusta con la opción 1, folio y código (§11) (S)
- ⏳ Enviar a web_2 el mensaje de la §11 (folio y código, conteo diario y recordatorio de QB6–QB8) (S)

## Etapa 4 — Especificación ⏳ (vie 6 nov)
- ⏳ `docs/BCK_ESPECIFICACION.md`: firmas de SP01–SP17, parámetros, resultados y lista final de códigos `THROW` (H)
- ⏳ `docs/BCK_ESPECIFICACION.md`: índices definitivos y algoritmo de datos iniciales (A)
- ⏳ Aprobación de cada SP por el usuario (S)

## Etapa 5 — Construcción ⏳ (sáb 7 nov, subagente `sqlserver-dba`)
- ⏳ `app/01_crear_bd.sql` (A)
- ⏳ `app/02_tablas.sql` (A)
- ⏳ `app/03_indices.sql` (A)
- ⏳ `app/04_sps.sql`: prioridad SP06, SP07 y SP13 (H)
- ⏳ `app/05_datos_iniciales.sql` (A)
- ⏳ `.env.example` (sólo con aviso previo y sin datos reales) (S)
- ⏳ Avisar en el chat que los scripts están disponibles (S)

## Etapa 6 — Pruebas ⏳ (dom 8 nov)
- ⏳ `tests/`: apartado concurrente, vencimiento con `@Ahora`, límite de 10, pago atómico, unicidad (H)
- ⏳ Datos de prueba (A)
- ⏳ Revisión final con el subagente `sqlserver-dba` (S)
- ⏳ Demo y entrega el lun 9 nov (todos)
