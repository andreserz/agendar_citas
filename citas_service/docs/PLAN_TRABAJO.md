# Plan de trabajo — citas_service

Estado: propuesto por el equipo de servicio; actualizado el 18 nov 2026 con OpenSpec y la llegada de Isidro. Entrega del ejercicio: **lunes 23 de noviembre de 2026** (se cambió el 18 nov; antes fue el lun 9 nov y, originalmente, el lun 2 nov).

> Desde el 18 nov el trabajo pendiente vive en el change de OpenSpec `openspec/changes/impl-service/` (34 tareas). El reparto está en «Reparto» y la forma de ejecutarlo en «Cómo ejecutar con OpenSpec». Si este documento y el contrato de OpenSpec (`contrato-entre-capas`) difieren, manda el contrato.

## Contexto

`citas_service` es la API REST, documentada con Swagger, que usan `citas_web_1` y `citas_web_2` para consultar funciones, apartar asientos durante 5 minutos y comprarlos. La base de datos la construye el equipo de `citas_backend` y aún no está definida. `citas_web_1` ya va en la etapa de Definición y espera de nosotros la URL, la autenticación, el Swagger y las reglas de reserva y expiración.

## Estrategia: avanzar sin esperar al backend

1. **Spec primero.** `docs/specs/openapi.yaml` es la fuente de verdad. Los webs pueden trabajar contra un mock generado de ese archivo desde el viernes.
2. **Patrón repositorio.** La lógica depende de interfaces (`AsientosRepo`, `ReservasRepo`, `OrdenesRepo`). Hoy se implementa la versión en memoria. Cuando el backend decida (SQL directo o su propia API), se agrega el adaptador sin tocar la lógica ni las pruebas.
3. **La regla de 5 minutos vive en el servicio.** Cada reserva guarda `expiraEn = ahora + 5 min`. El estado de un asiento se calcula así: comprado → apartado (si `expiraEn > ahora`) → disponible. Se usa expiración perezosa al leer y, opcionalmente, un barrido periódico.
4. **Contrato de datos hacia el backend.** `docs/specs/contrato-datos-backend.md` dice qué entidades, campos y garantías necesitamos. El backend responde en el chat y los ajustes se registran en `docs/specs/ACUERDOS.md`.

## ¿Quién escribe primero las reglas?

El servicio. La demanda fluye así:

```
web_1 / web_2  ──piden──▶  citas_service  ──pide──▶  citas_backend (BD)
 (qué necesito)          (reglas + contrato API)      (cómo lo guardo)
```

- **Servicio:** dueño de las reglas de negocio (tiempos, límites, estados, errores) y del contrato que ven los sitios.
- **Backend:** dueño de la integridad de los datos (unicidad, transacciones, persistencia). Decide el motor, el esquema y los índices.
- Al backend se le pide *qué* necesitamos, no *cómo* hacer las tablas. Por ejemplo: "apartar un asiento debe ser atómico para que dos sitios no aparten el mismo".

## Dónde viven las specs

| Archivo | Etapa | Contenido |
| --- | --- | --- |
| `docs/ANTEPROYECTO.md`, `docs/PROPUESTA.md`, `docs/DEFINICION.md` | 1–3 | Mismo formato que web_1 (RF numerados y pendientes) |
| `docs/ESPECIFICACION.md` | 4 | Estados, errores (409 conflicto, 410 expirada), criterios de aceptación Given/When/Then |
| `docs/specs/openapi.yaml` | 4 | Contrato público `/api/v1` para web_1 y web_2 |
| `docs/specs/contrato-datos-backend.md` | 3–4 | Lo que pedimos al backend |
| `docs/specs/ACUERDOS.md` | Todas | Preguntas abiertas, propuestas y decisiones entre equipos |
| `docs/architecture/` y `docs/architecture/adr/` | 3–5 | Diagrama y decisiones |

Endpoints borrador (genéricos, porque web_2 puede ser otro negocio):
- `GET /eventos`
- `GET /eventos/{id}/funciones`
- `GET /funciones/{id}/asientos`
- `POST /reservas` (apartar)
- `GET /reservas/{id}`
- `DELETE /reservas/{id}` (liberar)
- `POST /reservas/{id}/pago` (simulado)
- `GET /ordenes/{id}`
- `POST /auth/registro`
- `POST /auth/login`

## Comunicación entre equipos

El repositorio pertenece al instructor, así que no usamos issues ni etiquetas de GitHub. Usamos dos piezas:

1. **Chat del grupo** (WhatsApp) para conversar y preguntar rápido.
2. **`docs/specs/ACUERDOS.md`** como registro oficial. Tiene tres secciones: Preguntas abiertas, Propuestas del servicio y Decisiones acordadas.

**Flujo:**
1. Se pregunta en el chat.
2. Cuando hay respuesta, el líder de contrato la copia en `ACUERDOS.md` y hace commit.
3. Si una decisión cambia, se edita su fila y se avisa en el chat.

El chat no lo leen los agentes; el archivo sí. Lo que no esté en `ACUERDOS.md` no se considera acordado.

**Nadie más necesita saber git para comunicarse.** Los demás equipos y compañeros solo escriben en el chat. El líder de contrato es la única persona que edita `ACUERDOS.md` y hace commit. Cuando hay una actualización importante, comparte en el chat una captura o el texto del archivo.

- **Cambios de contrato:** se acuerdan en el chat con el equipo afectado, se registran en `ACUERDOS.md` y después se actualiza `openapi.yaml`.
- **Sincronía:** 15 minutos diarios entre un enlace por equipo, de jueves a domingo.
- **Fechas propuestas al backend** (se cambiaron el 4 nov; la BD ya se confirmó: SQL Server con procedimientos almacenados, D4 y D5):
  - Viernes 6 nov: responder P3, P6 y P11–P13.
  - Sábado 7 nov: scripts del esquema y de los procedimientos disponibles.
  - Si no llegan, se entrega con el repositorio en memoria y el adaptador queda documentado como siguiente paso (ADR-004).

## Reparto

Actualizado el 18 nov: se suma Isidro Gutiérrez y las 34 tareas de `impl-service` quedan repartidas, una por persona.

| Rol | Quién | Responsabilidad | Tareas de `impl-service` |
| --- | --- | --- | --- |
| **L** Líder de contrato | Osvaldo Sánchez | Docs de etapas, `openapi.yaml`, pruebas de contrato, coordinación con webs, revisión e integración de PR | 6.1–6.3, 7.1, 7.6, 8.1–8.3 (8) |
| **R** Dominio de reservas | Juan Carlos Martínez | Apartar, liberar, expirar y pagar; concurrencia; límite por persona y función; sus pruebas | 4.1, 4.2, 4.5, 3.3, 3.4, 7.2–7.5 (9) |
| **D** Datos e integración | Isaac Tenorio | Repositorios (sitios, semilla de web_2), rutas de catálogo, órdenes y reportes, adaptador SQL Server | 4.3, 4.6, 3.2, 3.5, 3.6, 5.1–5.3 (8) |
| **S** Seguridad y base de la API | Isidro Gutiérrez | Configuración y dependencias, middlewares (`X-Sitio`, comprador, errores), `/salud`, registro e inicio de sesión, hash scrypt y JWT | 1.1–1.3, 2.1–2.3, 3.1, 3.7, 4.4 (9) |

**QA:** ya no queda sin responsable. Cada quien escribe las pruebas de lo que implementa y L hace las pruebas de contrato por ruta (7.1) y cuida que la suite siga en verde (7.6).

## Cómo ejecutar con OpenSpec

OpenSpec está instalado en la raíz del monorepo (`openspec/`) y sus skills están en `.claude/skills/` de la raíz. Nuestro change es `impl-service`; las tareas completas están en `openspec/changes/impl-service/tasks.md`.

**Antes de empezar cada ola:**
1. Abre Claude Code (o pi) en la raíz del monorepo y pídele: "trae lo último del repo y cámbiate a mi rama `service/<mi-rama>`".
2. Revisa el avance con `openspec list` o `openspec instructions apply --change impl-service`.

**Comando por persona.** Pásale al agente **solo tus tareas de la ola**: si no lo limitas, `/opsx:apply` intenta hacer las 34.

| Quién | Rama | Ola 1 (jue 19) | Ola 2 (vie 20) | Ola 3 (sáb 21) | Ola 4 (dom 22) y entrega (lun 23) |
| --- | --- | --- | --- | --- | --- |
| Osvaldo (L) | `service/contrato-v1` | `/opsx:apply impl-service solo tareas 6.1, 6.2, 6.3` | Revisión de PR | Revisión de PR | `/opsx:apply impl-service solo tareas 7.1, 7.6, 8.1, 8.2, 8.3` |
| Juan Carlos (R) | `service/reservas` | `/opsx:apply impl-service solo tareas 4.1, 4.2, 4.5` | — | `/opsx:apply impl-service solo tareas 3.3, 3.4, 7.2, 7.3, 7.4, 7.5` | Apoyo a pruebas |
| Isaac (D) | `service/datos-sql` | `/opsx:apply impl-service solo tareas 4.3, 4.6` | — | `/opsx:apply impl-service solo tareas 3.2, 3.5, 3.6` | `/opsx:apply impl-service solo tareas 5.1, 5.2, 5.3` |
| Isidro (S) | `service/seguridad-api` | `/opsx:apply impl-service solo tareas 1.1, 1.2, 1.3, 4.4` | `/opsx:apply impl-service solo tareas 2.1, 2.3, 3.1, 2.2` | `/opsx:apply impl-service solo tareas 3.7` | Apoyo a pruebas |

**Dependencias entre personas:**
- Ninguna ruta se implementa antes de estar en `openapi.yaml` (AGENTS.md §2). Por eso 6.1 (L) va en la ola 1 y las rutas en la ola 3.
- 2.2 (S) necesita el repositorio de sitios 4.3 (D) y el JWT 4.4 (S).
- En la ola 2, S deja montados en `app/app.js` los routers de `app/rutas/` (design §1). Así R y D solo agregan su archivo de rutas y nadie más edita `app.js`.
- 5.x (D) depende de los procedimientos de `impl-backend`. Si no llegan, 5.3 queda 🚧 y se entrega con `REPOSITORIO=memoria`.

**Reglas:**
- Cada quien marca en `tasks.md` solo los `[x]` de sus tareas (lo hace `/opsx:apply`) y trabaja en sus propios archivos. S: `app/config.js`, `package.json`, `.env.example`, `app/middlewares/`, `app/auth/`, `app/rutas/salud.js` y `auth.js`. R: `app/rutas/reservas.js` y `pagos.js`, y `app/repos/memoria/reservas-repo-memoria.js`. D: `app/repos/` (sitios, semilla y `sql/`), y `app/rutas/catalogo.js`, `ordenes.js` y `reportes.js`. L: `docs/specs/openapi.yaml` y `tests/contrato/`.
- Las dependencias nuevas (`jsonwebtoken`, `mssql`) solo las agrega S (1.3), para no chocar en `package.json`.
- Si una tarea no se puede cumplir tal como está escrita, no se improvisa: se usa `/opsx:explore` para analizarla o `/opsx:update` para proponer el ajuste, y se avisa a L en el chat.
- Al terminar una ola, cada quien corre `npm test` y avisa en el chat; L integra y actualiza `TODOLIST.md`.
- Al final, L corre `openspec validate impl-service`. El archivado (`/opsx:archive`) solo se hace cuando lo pida el instructor.
- No se modifican `openspec/` fuera de los `[x]` propios ni las carpetas de otros equipos. Si algo debe cambiar ahí, se registra en `docs/specs/ACUERDOS.md`.

## Git mínimo para el equipo

- **Cada quien trabaja en sus propios archivos** (según su rol) para evitar conflictos al juntar cambios.
- **Una sola persona integra** (el líder de contrato): revisa, sube a la rama del equipo y abre el PR al repositorio del instructor.
- **El agente puede hacer git por ti.** Pídele a Claude o pi, en español: "trae lo último del repo", "guarda mis cambios con un mensaje" o "súbelos a la rama service/construccion". El agente debe explicar cada comando antes de ejecutarlo.
- Si prefieres hacerlo a mano, solo necesitas cuatro comandos:

```bash
git pull                      # 1. Antes de empezar: traer lo último
git add citas_service/        # 2. Marcar tus cambios
git commit -m "Qué hiciste"   # 3. Guardarlos con un mensaje
git push                      # 4. Subirlos
```

- Si git marca un error o un conflicto, **no lo fuerces**: avisa en el chat al líder.

## Calendario

Se cambió el 18 nov: la entrega pasa al **lun 23 de noviembre de 2026** y se trabaja por olas del change `impl-service`.

| Día | Ola | Salida |
| --- | --- | --- |
| Jue 19 nov | 1 · bases | `openapi.yaml` 1.0.0 con lint limpio (L); configuración, dependencias, hash y JWT (S); repositorio de sitios y semilla de web_2 (D); correcciones del dominio de reservas (R) |
| Vie 20 nov | 2 · middlewares | `X-Sitio`, manejador de errores, `/salud` y autenticación de comprador; routers montados en `app.js` (S) |
| Sáb 21 nov | 3 · rutas | Catálogo, órdenes y reportes (D); reservas y pago con sus pruebas (R); registro e inicio de sesión (S) |
| Dom 22 nov | 4 · SQL y contrato | Adaptador SQL Server (D); pruebas de contrato, suite en verde y web_1 en modo `api` (L) |
| Lun 23 nov | Entrega | TODOLIST final, PR a `main` y demo en una sola laptop (D12) |

**Calendario anterior (histórico, entrega del lun 9 nov):**

| Día | Etapas | Salida |
| --- | --- | --- |
| Jue 29 oct | 1–3 | Docs de etapa, `AGENTS.md` corregido, contrato de datos enviado al backend (en `main` con el PR #3) |
| Mié 4 nov | 4 (inicio) y 5 (esqueleto) | Respuestas del backend registradas en `ACUERDOS.md`; arranca el esqueleto Express (D) |
| Jue 5 nov | 4 | `openapi.yaml` v1 y `ESPECIFICACION.md` publicados; contrato de datos actualizado y ADR-004 |
| Vie 6 – Sáb 7 nov | 5 | API Express con repositorio en memoria y Swagger UI en `/docs` |
| Dom 8 nov | 6 | Suite verde, pruebas de expiración y concurrencia, colección Postman; integración con la BD si existe |
| Lun 9 nov | — | Entrega y demo |

## Skills y loops

- **Skills de OpenSpec** (en `.claude/skills/` de la raíz). Desde el 18 nov reemplazan a las skills propuestas antes (`etapa`, `endpoint-desde-spec`, `validar-contrato`):
  - `openspec-apply-change` (`/opsx:apply`): implementa y marca las tareas indicadas del change.
  - `openspec-explore` (`/opsx:explore`): analiza una duda sin cambiar código.
  - `openspec-update-change` (`/opsx:update`): ajusta propuesta, diseño o tareas cuando la implementación revela un problema.
  - `openspec-archive-change` (`/opsx:archive`): solo al final y cuando lo pida el instructor.
- **Loops:**
  - Construcción: `/opsx:apply impl-service solo tareas …` de tu ola, `npm test` y aviso en el chat, hasta terminar tus tareas.
  - Pruebas: correr la suite y revisar la expiración.
- **Agentes:** `AGENTS.md` lo leen pi y Codex; `CLAUDE.md` lo importa para Claude Code.

## Propuesta para los demás equipos

No modificamos sus carpetas; lo proponemos en el chat:

1. Que todos consulten `citas_service/docs/specs/ACUERDOS.md` y referencien ese archivo en su propio `AGENTS.md`, para que sus agentes también respeten las decisiones.

