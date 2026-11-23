# Proposal — cambio-paleta-verde

## Why

El issue #37 pide cambiar los colores rojos de la interfaz por color verde, y el issue #39 aclara que el cambio aplica únicamente a `citas_web_1`. Hoy esa SPA resuelve su acento y sus estados con la familia roja (coral `#FF6B5E`), de modo que la identidad visual del sitio no cumple el color pedido.

## What Changes

- Sustituir todos los colores rojos de `citas_web_1/app/` (tokens `--coral`, `--coral-oscuro` y `--rojo`, degradados, tintes `rgba(...)`, textos sobre fondo de color y `stop-color` de los SVG) por su equivalente verde.
- Renombrar los tokens de color para que el nombre refleje el tono real (`--verde-acento`, `--verde-oscuro`, `--verde-claro`, `--verde-alerta`) y mantener el contraste mínimo AA sobre el fondo nocturno.
- Mantener distinguibles los estados: el verde de acento no debe confundirse con el verde de éxito ni con el verde de alerta.
- Actualizar la documentación de paleta del sitio (`ANTEPROYECTO.md`, `PROPUESTA.md`, `DEFINICION.md`, `ESPECIFICACION.md`) y el avance de `citas_web_1/TODOLIST.md`.
- No hay cambios de comportamiento, contratos ni lógica de dominio: es un cambio visual.

## Capabilities

### New Capabilities
- `web1-paleta-verde`: color de marca, estados y contraste de la interfaz de `citas_web_1`.

### Modified Capabilities
- Ninguna. `web1-compra-entradas` no fija tonos concretos, así que sus requisitos siguen vigentes sin cambios.

## Impact

- `citas_web_1/app/css/styles.css`, `citas_web_1/app/index.html`, `citas_web_1/app/js/ui.js`, `citas_web_1/app/js/views/home.js`.
- `citas_web_1/tests/paleta.test.js` (nuevo), `citas_web_1/docs/`, `citas_web_1/TODOLIST.md`.
- `citas_web_1/package.json`: el script `test` pasa a `node --test "tests/**/*.test.js"` porque `node --test tests` no resolvía el directorio con Node 24 y dejaba la suite sin ejecutar.
- Fuera de alcance: `citas_web_2` mantiene su paleta original (issue #39).
- Sin dependencias nuevas, sin cambios de contrato HTTP y sin efecto en `citas_service` ni en `citas_backend`.
