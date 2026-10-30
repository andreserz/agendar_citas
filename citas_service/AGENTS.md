# AGENTS.md — citas_service: API de reserva y compra de boletos

**Este archivo se carga automáticamente por pi (y por Claude Code vía `CLAUDE.md`).** Léelo completo antes de tocar código.

---

## 0. Contexto del proyecto

`citas_service` es la API REST que permite a varios sitios web consultar funciones, apartar asientos y comprar boletos. Forma parte de un monorepo con otras tres áreas a cargo de otros equipos:

| Carpeta | Responsable | Relación con este servicio |
| --- | --- | --- |
| `citas_web_1` | Equipo web 1 (teatro) | Consumidor de la API |
| `citas_web_2` | Equipo web 2 | Consumidor de la API |
| `citas_backend` | Equipo backend | Base de datos; motor y esquema **aún no definidos** |
| `citas_service` | Este equipo | Reglas de negocio y contrato de la API |

Reglas de negocio conocidas:
- Un asiento puede apartarse por **5 minutos**. Si no se compra en ese plazo, se libera automáticamente.
- Mientras está apartado, ningún otro sitio ni usuario puede apartarlo.
- El pago es **simulado** y puede resultar en éxito o en rechazo. Tras un rechazo se puede reintentar mientras el apartado siga vigente.
- Por ahora, la única regla adicional conocida viene de web_1: máximo 10 asientos por persona y función. Ver `../citas_web_1/docs/DEFINICION.md`.

Stack aprobado: **Node.js 20 + Express**, contrato **OpenAPI 3** (`swagger-ui-express` en `/docs`), pruebas con **Jest + Supertest**.

Los proyectos usan sólo las siguientes etapas:
1. Anteproyecto
2. Propuesta
3. Definición
4. Especificación
5. Construcción
6. Pruebas

---

## 1. Reglas obligatorias (no negociables)
- Siempre realiza validación de tu respuesta antes de entregar.
- Los resultados los quiero en:
  - Documentos de etapa en `./docs`
  - Contratos (OpenAPI y datos para backend) en `./docs/specs`
  - Arquitectura y decisiones (ADR) en `./docs/architecture`
  - Aplicación en `./app`
  - Pruebas en `./tests`
- No modificar más de lo que se especifica. Sólo propón.
- **No modificar carpetas de otros equipos** (`citas_web_1`, `citas_web_2`, `citas_backend`, raíz). Si algo debe cambiar ahí, regístralo como pregunta o propuesta en `./docs/specs/ACUERDOS.md`.
- Antes de diseñar o programar, lee `./docs/specs/ACUERDOS.md` y respeta las **Decisiones acordadas**. No tomes como definitivo lo que esté en Propuestas o Preguntas abiertas.
- Nunca muestres datos sensibles en la conversación. No muestres el archivo `.env`.
- Siempre mantén actualizado `TODOLIST.md` para planificar el proyecto completo y reportar el avance de cada tarea.

---

## 2. Reglas de diseño del servicio
- **Spec primero:** ningún endpoint se implementa si antes no existe en `./docs/specs/openapi.yaml`. Si el código y la spec difieren, la spec manda.
- **Cambios de contrato:** se acuerdan primero con el equipo consumidor afectado y se registran en `./docs/specs/ACUERDOS.md`; después se actualiza `./docs/specs/openapi.yaml`. Versionar bajo `/api/v1`.
- **Patrón repositorio:** la lógica de negocio depende de interfaces (`AsientosRepo`, `ReservasRepo`, `OrdenesRepo`). Mientras el backend no defina la base de datos, se usa la implementación en memoria. El adaptador real se agrega sin tocar la lógica ni las pruebas.
- **La regla de 5 minutos vive en el servicio:** cada reserva guarda `expiraEn`. Un asiento está comprado, apartado (si `expiraEn > ahora`) o disponible. El tiempo se inyecta (reloj configurable) para poder probar la expiración sin esperar.
- **Errores consistentes:** `409` cuando hay conflicto de disponibilidad y `410` cuando la reserva ya expiró. El cuerpo de error usa el formato definido en la spec.
- Cada sitio consumidor se identifica en cada petición; el mecanismo exacto se define en la Especificación.
- Configuración (puerto, URL de backend, llaves) sólo por variables de entorno; nunca en el código.

---

## 3. Comunicación con otros equipos
- El repositorio pertenece al instructor; no se usan issues ni etiquetas de GitHub.
- Se conversa en el chat del grupo. Las preguntas, propuestas y decisiones se registran por escrito en `./docs/specs/ACUERDOS.md`, que es la fuente oficial.
- El servicio escribe primero las reglas y le pide al backend lo que necesita (`./docs/specs/contrato-datos-backend.md`). El backend decide el motor, el esquema y los índices.
- Ramas: `service/<etapa-o-tema>` → PR a `main`, siguiendo la convención del repositorio.
- No todo el equipo maneja git. Cuando el usuario pida operaciones de git, explica en una línea qué hará cada comando antes de ejecutarlo. Nunca uses `--force`, `reset --hard` ni resuelvas conflictos sin confirmación; ante un conflicto, detente y explica qué pasó.
