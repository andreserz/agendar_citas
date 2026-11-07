# AGENTS.md — reserva de lugares 

**Este archivo se carga automáticamente por pi.** Léelo completo antes de tocar código.

---

## 0. Contexto del proyecto
Usaremos sólo diseños tipo glassmorfism
El diseño de marca requiere el uso de la siguiente paleta:
- # Color primario
- # Color de acento
- Siempre entrega interfaz web (responsiva)
Usa sólo HTML5, CSS3, JS Vanilla
Por el momento no se usará la capacidad de audio mp3
Los proyectos usamos sólo las siguientes etapas:
1. Anteproyecto
2. Propuesta
3. Definición
4. Especificación
5. Construcción
6. Pruebas

---

## 1. Reglas obligatorias (no negociables)
- Siempre realiza validación de tu respuesta antes de entregar
- Los resultados los quiero en:
  - Documentos en ./docs
  - Aplicación en ./app
  - Pruebas en ./tests
  - Arquitectura en ./docs/architecture
- No modificar más de lo que se especifica. Sólo propón
- Nunca muestres datos sensibles en la conversación. No muestres el  archivo .env
- Siempre prepara un archivo de TODOLIST.md (To Do List), para que planifiques el proyecto completo, tareas e informes el avance en cada una




<!-- context7 -->
Use Context7 MCP to fetch current documentation whenever the user asks about a library, framework, SDK, API, CLI tool, or cloud service — even well-known ones like React, Next.js, Prisma, Express, Tailwind, Django, or Spring Boot. This includes API syntax, configuration, version migration, porting code between libraries, platforms, or SQL dialects, library-specific debugging, setup instructions, and CLI tool usage. Use even when you think you know the answer — your training data may not reflect recent changes. Prefer this over web search for library docs.

Do not use for: refactoring, debugging, or reviewing code that does not depend on a library or platform API, or general programming concepts.

## Steps

1. Always start with `resolve-library-id` using the library name and what to look up in the library's documentation, unless the user provides an exact library ID in `/org/project` format
2. Pick the best match (ID format: `/org/project`) by: exact name match, description relevance, code snippet count, source reputation (High/Medium preferred), and benchmark score (higher is better). If results don't look right, try alternate names or queries (e.g., "next.js" not "nextjs", or rephrase the question). Use version-specific IDs when the user mentions a version
3. `query-docs` with the selected library ID and what to look up in the library's documentation (not single words), scoped to a single concept. If the question spans multiple distinct concepts (e.g. routing and auth and caching), make a separate `query-docs` call per concept with the same library ID, unless the question is about how the concepts interact — combined queries dilute ranking and return shallow results for each topic
4. Answer using the fetched docs
<!-- context7 -->
