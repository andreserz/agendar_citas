# TODOLIST — citas_backend

Leyenda: ✅ terminado · 🔄 en curso · ⏳ pendiente · ⛔ bloqueado

Regla de trabajo: al terminar cada etapa se avisa al usuario y **no se inicia la siguiente hasta que la verifique**.

## Etapa 1 — Anteproyecto ✅ (aprobado 4 nov 2026)
- ✅ Crear el worktree `bck-anteproyecto` (rama `backend/anteproyecto`)
- ✅ Crear el subagente `.claude/agents/sqlserver-dba.md`
- ✅ Leer `citas_web_1/docs/PROPUESTA.md` y `DEFINICION.md`
- ✅ Leer el contrato y los acuerdos de `citas_service`
- ✅ Entrevista: decisiones E1–E8
- ✅ Redactar `docs/BCK_ANTEPROYECTO.md`
- ✅ Verificación y aprobación del usuario
- 🔄 Commit, push y pull request a `main`

## Etapa 2 — Propuesta ⏳
- ⏳ `docs/BCK_PROPUESTA.md`: modelo de datos propuesto y lista de SPs a aprobar
- ⏳ Decidir el precio por zona o por zona y función
- ⏳ Mensaje para el chat del grupo con las respuestas a P1, P2, P3, P5, P6 y P8

## Etapa 3 — Definición ⏳
- ⏳ `docs/BCK_DEFINICION.md`: requisitos, reglas de negocio y diccionario de datos (con equivalencias del contrato)
- ⏳ `docs/architecture/`: diagrama entidad-relación y ADRs

## Etapa 4 — Especificación ⏳
- ⏳ `docs/BCK_ESPECIFICACION.md`: firmas de los SPs, parámetros, resultados, códigos `THROW` e índices
- ⏳ Aprobación de cada SP por el usuario

## Etapa 5 — Construcción ⏳ (subagente `sqlserver-dba`)
- ⏳ `app/01_crear_bd.sql`
- ⏳ `app/02_tablas.sql`
- ⏳ `app/03_indices.sql`
- ⏳ `app/04_sps.sql`
- ⏳ `app/05_datos_iniciales.sql`
- ⏳ `.env.example` (sólo con aviso previo y sin datos reales)

## Etapa 6 — Pruebas ⏳
- ⏳ `tests/`: apartado concurrente, vencimiento con `@Ahora`, límite de 10, pago atómico, unicidad
- ⏳ Revisión final con el subagente `sqlserver-dba`
