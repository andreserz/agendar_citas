# Plan de trabajo — citas_service

Estado: propuesto por el equipo de servicio. Entrega del ejercicio: **lunes 9 de noviembre de 2026** (se cambió el 4 nov; antes era el lun 2 nov).

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

| Rol | Quién | Responsabilidad |
| --- | --- | --- |
| Líder de contrato | Osvaldo Sánchez | Docs de etapas, `openapi.yaml`, coordinación con webs, revisión de PR |
| Dominio de reservas | Juan Carlos Martínez | Apartar, liberar, expirar y comprar; concurrencia; límite por persona y función |
| Datos e integración | Isaac Tenorio | Interfaces de repositorio, versión en memoria, contrato de datos, enlace con backend y adaptador real |
| QA / pruebas | Sin asignar (propuesta del 4 nov, falta confirmarla) | Juan Carlos: criterios de aceptación y pruebas del dominio · Isaac: pruebas de repositorios y autenticación · Osvaldo: pruebas de contrato, mock y colección Postman |

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

Se cambió el 4 nov: la entrega pasó del lun 2 al **lun 9 de noviembre de 2026**.

| Día | Etapas | Salida |
| --- | --- | --- |
| Jue 29 oct | 1–3 | Docs de etapa, `AGENTS.md` corregido, contrato de datos enviado al backend (en `main` con el PR #3) |
| Mié 4 nov | 4 (inicio) y 5 (esqueleto) | Respuestas del backend registradas en `ACUERDOS.md`; arranca el esqueleto Express (D) |
| Jue 5 nov | 4 | `openapi.yaml` v1 y `ESPECIFICACION.md` publicados; contrato de datos actualizado y ADR-004 |
| Vie 6 – Sáb 7 nov | 5 | API Express con repositorio en memoria y Swagger UI en `/docs` |
| Dom 8 nov | 6 | Suite verde, pruebas de expiración y concurrencia, colección Postman; integración con la BD si existe |
| Lun 9 nov | — | Entrega y demo |

## Skills y loops

- **Skills** en `.claude/skills/` de esta carpeta:
  - `etapa`: genera el documento de la etapa y actualiza TODOLIST.
  - `endpoint-desde-spec`: genera ruta, servicio y prueba a partir de un path del OpenAPI.
  - `validar-contrato`: valida el OpenAPI y compara las rutas implementadas contra la spec.
- **Loops:**
  - Construcción: tomar la siguiente tarea de `TODOLIST.md`, implementar, correr `npm test` y marcarla, hasta que la suite pase.
  - Pruebas: correr la suite y revisar la expiración.
- **Agentes:** `AGENTS.md` lo leen pi y Codex; `CLAUDE.md` lo importa para Claude Code.

## Propuesta para los demás equipos

No modificamos sus carpetas; lo proponemos en el chat:

1. Que todos consulten `citas_service/docs/specs/ACUERDOS.md` y referencien ese archivo en su propio `AGENTS.md`, para que sus agentes también respeten las decisiones.

