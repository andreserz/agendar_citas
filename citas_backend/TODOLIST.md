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
- ✅ Enviar el mensaje al chat (§9; enviado el 6 nov 2026) (S)
- ✅ Enviar a web_2 el aviso sobre `UQ_Funciones_IdEvento_FechaHoraInicio` (§10; enviado el 6 nov 2026) (S)
- ⏳ Recibir de web_2 las respuestas a QB6–QB8 (límite sáb 7 nov; si no llegan, se carga la propuesta del backend) (S)
- ✅ Llevar los cambios aprobados a `BCK_ESPECIFICACION.md` (columnas, SP18, SP19 y errores 53005–53007) (H, A → ejecutó S)
- ✅ Confirmar en el chat: PR8 (puertos), el formato del mensaje de `51001` (QB3 y D11) y QB5 (enviado el 6 nov 2026) (S)
- ✅ Commit, push y pull request a `main` (PR #12, rama `backend/respuestas-p15-p19`, integrado el 6 nov 2026) (S)
- ✅ Revisar la Definición de web_2 (PR #13): RN06 coincide con SP19; RN05 se ajusta con la opción 1, folio y código (§11) (S)
- ✅ Enviar a web_2 el mensaje de la §11 (folio y código, conteo diario y recordatorio de QB6–QB8; enviado el 6 nov 2026) (S)
- ⏳ Verificar que el líder de contrato registre P15–P19 en `ACUERDOS.md` (S)
- ✅ Commit, push y pull request a `main` (PR #14, rama `backend/ajuste-web2-folio`, integrado el 6 nov 2026) (S)

## Etapa 4 — Especificación ✅ (aprobado 6 nov 2026, rama `backend/especificacion`)
- ✅ `docs/BCK_ESPECIFICACION.md`: plantilla común, firmas de SP01–SP19, validaciones, resultados y lista final de códigos `THROW` (H → ejecutó S)
- ✅ Alinear los SP con `citas_service/app/repos/interfaces.js`: hallazgos H1–H7 y error 53008 (S)
- ✅ `docs/BCK_ESPECIFICACION.md`: esquema final, índices definitivos y algoritmo de datos iniciales de web_1 y web_2 (A → ejecutó S)
- ✅ Aprobación de cada SP por la usuaria (§12; SP01–SP19 aprobados el 6 nov 2026) (S)
- ✅ Verificación y aprobación de la etapa completa por la usuaria (6 nov 2026) (S)
- ⏳ Enviar al servicio el aviso de la §11 (cambios por H1–H7) (S)
- ✅ Commit, push y pull request a `main` (PR #15, rama `backend/especificacion`, abierto el 6 nov 2026) (S)

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

---

## Plan de implementación — change `impl-backend` (actualizado 18 nov 2026)

Fuente: `openspec/changes/impl-backend/` (`tasks.md` tiene el detalle). El contrato entre capas es `openspec/changes/impl-backend/specs/contrato-entre-capas/spec.md`; no hace falta acordar nada con otros equipos.

Cambios que este plan exige a la base de datos: `Sitios.RequiereComprador`, compradores nulables, `UltimosDigitos` en intentos, código `52002` para reservas liberadas, SP18 renombrado a `spOrdenes_Buscar` y SP19 como `spReservas_ContarPorDia`.

- [x] 1. Preparación: `app/`, `tests/` y `.env.example` (tareas 1.1–1.2) **Hecho el 20 nov 2026 en la rama `backend/impl-backend` (S); aprobado por la usuaria el 20 nov 2026. Se agregó `citas_backend/.gitignore` con `.env` y se corrigió `CitasDB` → `CitasBD` en `BCK_ESPECIFICACION.md` §9.**
- [x] 2. Esquema en `02_tablas.sql` (tareas 2.1–2.6) **Hecho el 20 nov 2026 (S, rama `backend/impl-backend-esquema`): `01_crear_bd.sql` (CitasBD, `Modern_Spanish_CI_AS`, SIMPLE, rol `rolCitasServicio`) y `02_tablas.sql` (16 tablas). Validado en SQL Server 2019 con una base temporal: dos ejecuciones sin errores, columnas y restricciones del contrato correctas, sin columnas de tarjeta ni CVV. Las filas de `Sitios` se cargan en `05` (tareas 6.1–6.2). Ajustes por el punto 3 de `promt.md` (más sitios a futuro) tras la revisión de `sqlserver-dba`: `Sitios.Moneda` y `Sitios.ZonaHoraria`, `CK_AsientosFuncion_Vendido` (RN15) y `RECOVERY SIMPLE` sólo al crear la base; `BCK_ESPECIFICACION.md` §3.1 alineada con el contrato. Revalidado en SQL Server 2019. Aprobado por la usuaria el 20 nov 2026; se incluye el `promt.md` actualizado.**
- [x] 3. Índices en `03_indices.sql` (tareas 3.1–3.3) **Hecho el 20 nov 2026 (S, rama `backend/impl-backend-indices`): 9 índices de §4; `UQ_Funciones_IdEvento_FechaHoraInicio` con clave `(IdEvento, FechaHoraInicio, IdZona)` (aprobado por la usuaria); la tarea 3.2 la cubren `UQ_Ordenes_Folio` y `UQ_Boletos_Codigo`. Revisado por `sqlserver-dba` y validado en SQL Server 2019. Aprobado por la usuaria el 20 nov 2026.**
- [x] 4. Procedimientos prioritarios: SP06, SP07 y SP13 (tareas 4.1–4.3) **Hecho el 20 nov 2026 (H → ejecutó S, rama `backend/impl-backend-sps`): `04_sps.sql` con firmas y códigos del contrato, `Reservas.IdPublico` (UUID v4, aprobado por la usuaria) y funciones internas para las formas R y O; diferencias con la Especificación en `BCK_ESPECIFICACION.md` §2.4. Revisado por `sqlserver-dba` (se corrigió un posible deadlock en SP13). Validado en SQL Server 2019: 18 casos funcionales y prueba de concurrencia con dos sesiones (sin dobles apartados ni deadlocks). Aprobado por la usuaria el 20 nov 2026.**
- [x] 5. Resto de procedimientos SP01–SP19 en `04_sps.sql` (tareas 5.1–5.8) **Hecho el 20 nov 2026 (H → ejecutó S, rama `backend/impl-backend-sps-resto`): 16 SP más con firmas y códigos del contrato; `spOrdenes_Buscar` reemplaza a `spOrdenes_ObtenerPorCodigo`; SP07 y SP10 cuentan el límite con la misma función; `RequiereComprador` validado en SP01, SP07, SP13 y SP15. Decisiones en `BCK_ESPECIFICACION.md` §2.4. Revisado por `sqlserver-dba` (se corrigieron el candado del comprador en SP13, la limpieza por lotes de SP17 y la validación de sitio en SP08, SP11, SP14 y SP18). Validado en SQL Server 2019: 31 casos de esta etapa, 18 de la anterior y concurrencia de pago contra liberación y de limpieza contra apartado. SP01 y SP02 devuelven `Id`, como el contrato. Aprobado por la usuaria el 20 nov 2026.**
- [ ] 6. Semilla web_1 (120 funciones, 360 precios) y web_2 (800 asientos, 900 funciones, 900 precios; la tarea 6.2 decía 9,000 y se corrigió el 20 nov 2026) (tareas 6.1–6.3)
- [ ] 7. Pruebas de base de datos: concurrencia, vencimiento, límite, pago atómico, unicidad, `RequiereComprador` (tareas 7.1–7.7)
- [ ] 8. Entrega: revisión con `sqlserver-dba`, aviso a los demás equipos por el propio contrato y avance registrado aquí (tareas 8.1–8.3)
