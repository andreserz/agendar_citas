# BCK — Plan de trabajo del equipo de backend

| Campo | Valor |
| --- | --- |
| Proyecto | `citas_backend`: base de datos SQL Server para reservar y comprar boletos |
| Equipo | Sandra, Alfredo y Hugo |
| Entrega | **lunes 9 de noviembre de 2026** (demo con los demás equipos) |
| Fecha del plan | 5 de noviembre de 2026 |
| Seguimiento | `TODOLIST.md`, con el responsable de cada tarea |

---

## 1. Integrantes y roles

| Clave | Integrante | Rol | Responsabilidades |
| --- | --- | --- | --- |
| **S** | Sandra | Líder del backend | Documentos de cada etapa (`docs/BCK_*.md`), arquitectura y ADR, coordinación con `citas_service` en el chat, revisión, integración y pull requests |
| **A** | Alfredo | Modelo y datos | Diccionario de datos, diagrama entidad-relación, scripts de base de datos, tablas, índices y datos iniciales (`01`, `02`, `03` y `05`) |
| **H** | Hugo | Procedimientos y pruebas | Firmas y lógica de los procedimientos almacenados (`04_sps.sql`), códigos `THROW` y pruebas T-SQL en `tests/` |

### Regla de suplencia

**Por ahora, Sandra también puede ejecutar cualquier tarea de Alfredo o de Hugo.** Cuando lo haga:

1. En `TODOLIST.md` se deja el responsable original y se anota quién la ejecutó, por ejemplo `(A → ejecutó S)`.
2. Si la tarea ya estaba en curso, primero se avisa en el chat del equipo para no duplicar trabajo.
3. La revisión la hace otra persona, o el subagente `sqlserver-dba` si nadie más está disponible.

Alfredo y Hugo no se suplen entre sí, salvo que Sandra lo indique.

## 2. Forma de trabajo

### Etapas y aprobación

El proyecto sigue las seis etapas de `AGENTS.md`. **Al terminar cada etapa, Sandra la revisa y la aprueba antes de empezar la siguiente.** Ninguna etapa se inicia sin esa aprobación.

| Etapa | Documento o entregable | Responsable principal |
| --- | --- | --- |
| 1. Anteproyecto | `docs/BCK_ANTEPROYECTO.md` ✅ | S |
| 2. Propuesta | `docs/BCK_PROPUESTA.md` ✅ | S |
| 3. Definición | `docs/BCK_DEFINICION.md`, `docs/architecture/` | S (requisitos y reglas), A (diccionario y diagrama) |
| 4. Especificación | `docs/BCK_ESPECIFICACION.md` | H (firmas de los SP y errores), A (índices y scripts de datos), S (aprobación de cada SP) |
| 5. Construcción | `app/01`–`05_*.sql` | A (`01`, `02`, `03`, `05`), H (`04`) |
| 6. Pruebas | `tests/*.sql` | H (pruebas), A (datos de prueba), S (revisión final) |

### Git

- Una rama por etapa: `backend/<etapa>`, por ejemplo `backend/definicion`.
- Cada quien edita sus propios archivos para evitar conflictos. **Sólo S edita `TODOLIST.md`**; los demás reportan su avance en el chat del equipo.
- S integra los cambios: hace commit, sube a su fork (`sandra-msn/agendar_citas`) y abre el PR a `main` del repositorio del instructor.
- No se fuerza un `push` ni se resuelven conflictos a ciegas: se avisa en el chat.

### Herramientas

- **Subagente `sqlserver-dba`** (`.claude/agents/sqlserver-dba.md`): construye y revisa los scripts T-SQL de A y H.
- **SQL Server 2019 o superior** (Express o Developer) con SSMS en la máquina de cada quien. Sin Docker (D5).
- Datos de conexión: sólo en un `.env.example` sin contraseñas reales. **El `.env` nunca se sube al repositorio.**

## 3. Calendario

| Día | Etapa | Tareas | Responsable |
| --- | --- | --- | --- |
| Jue 5 nov | 3. Definición | Requisitos, reglas, diccionario de datos, diagrama y ADR | S, A |
| Vie 6 nov | 3 → 4. Especificación | Aprobar la Definición; firmas de los SP, códigos de error finales e índices; aprobar cada SP | H, A, S |
| Sáb 7 nov | 5. Construcción | Scripts `01`–`05` disponibles para el servicio (fecha que pidió `citas_service`) | A, H |
| Dom 8 nov | 6. Pruebas | Pruebas de concurrencia, vencimiento, límite de 10, pago e integración con el servicio | H, A, S |
| Lun 9 nov | Entrega | Demo con los demás equipos | Todos |

Si el sábado 7 no están los scripts, el servicio entrega con datos en memoria (PR6) y deja el adaptador como siguiente paso. Por eso los SP de reservas y pago (SP06, SP07 y SP13) tienen prioridad.

## 4. Comunicación con otros equipos

- **Chat del grupo (WhatsApp):** S responde y pregunta en nombre del backend.
- **Registro oficial:** `citas_service/docs/specs/ACUERDOS.md`. Lo edita el líder de contrato del servicio (Osvaldo); el backend no modifica carpetas ajenas.
- **Cambios de esquema** (P6): se hacen con un script numerado nuevo, se avisa en el chat y se actualiza el diccionario en `BCK_DEFINICION.md`.

| Fecha | Mensaje | Estado |
| --- | --- | --- |
| 5 nov | Respuestas a P3, P6 y P11–P14 (`BCK_PROPUESTA.md` §8) | ✅ Enviado por S |
| 6 nov | Preguntas abiertas de la Definición (`BCK_DEFINICION.md` §8) | ⏳ |
| 7 nov | Aviso de que los scripts están disponibles | ⏳ |

## 5. Criterio de terminado

Una tarea está terminada cuando:

1. El archivo está en la carpeta que indica `AGENTS.md` (`docs`, `docs/architecture`, `app` o `tests`).
2. Para los scripts: se ejecutan sin errores en SQL Server y los revisó `sqlserver-dba` u otro integrante.
3. Su casilla en `TODOLIST.md` está marcada y dice quién la hizo.
4. Si cierra una etapa, Sandra la aprobó.

## 6. Riesgos del equipo

| Riesgo | Mitigación |
| --- | --- |
| Alfredo o Hugo no están disponibles | Regla de suplencia: S toma la tarea (§1) |
| Una sola persona concentra el trabajo | Priorizar los SP06, SP07 y SP13 y las tablas de reservas; SP16 y SP17 pueden quedar para después de la entrega |
| Cada quien tiene una versión distinta de SQL Server | Versión mínima 2019 y nada de funciones más nuevas |
| Calendario corto (entrega el lun 9) | Definición y Especificación compactas, sin repetir lo que ya está en la Propuesta |
