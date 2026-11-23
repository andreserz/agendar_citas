# Design — cambio-paleta-verde

## Context

`citas_web_1` resuelve el color con tokens CSS en `:root` y con valores hexadecimales sueltos en degradados, tintes `rgba(...)`, texto sobre fondo de color y `stop-color` de SVG.

- `citas_web_1/app/css/styles.css` (4631 líneas) usa `--coral: #ff6b5e`, `--coral-oscuro: #d94b4c` y `--rojo: #ff8b7f`, más 16 hexadecimales y 4 familias de `rgba(...)` de la familia roja, y la clase `.ambient__glow--coral`.
- `citas_web_1/app/js/ui.js` y `citas_web_1/app/js/views/home.js` llevan dos degradados SVG en línea con `#FF6B5E` y `#B53A55`.
- `citas_web_1/app/index.html` instancia el resplandor ambiental `ambient__glow--coral`.
- Las pruebas (`tests/domain.test.js`) cubren dominio; no había cobertura visual.

Restricciones de `AGENTS.md`: HTML5, CSS3 y JavaScript vanilla, sin dependencias nuevas, glassmorphism, entrega en `app/`, pruebas en `tests/` y documentos en `docs/`.

El issue #39 acota el trabajo: **sólo `citas_web_1`**. `citas_web_2` mantiene su paleta original.

## Goals / Non-Goals

**Goals:**

- Dejar cero colores de la familia roja en `citas_web_1/app/`.
- Conservar la estructura visual: mismos degradados, mismos tintes y misma jerarquía, cambiando solo el tono.
- Mantener los cuatro roles de color distinguibles (acento, acento oscuro, éxito, alerta) y con contraste AA.
- Dejar la documentación del sitio coherente con el código.

**Non-Goals:**

- No se toca `citas_web_2` en ningún archivo.
- No se rediseña la interfaz, no se cambian layouts, tipografías, radios ni sombras.
- No se cambia la semántica de los estados (un error sigue siendo un error) ni su texto, icono o forma.
- No se toca `citas_service` ni `citas_backend`.

## Decisions

### Escala de verdes por rol, no sustitución literal

Se definen cuatro roles de color y se mapea cada rojo a su rol, para que el cambio no aplane la jerarquía visual.

| Rol | Token | Valor | Antes (rojo) |
| --- | --- | --- | --- |
| Acento principal | `--verde-acento` | `#3ecf7f` | `--coral: #ff6b5e` |
| Acento oscuro | `--verde-oscuro` | `#1f8f57` | `--coral-oscuro: #d94b4c` |
| Éxito | `--verde-claro` | `#7dd8a5` | `--verde: #7dd8a5` (ya verde) |
| Alerta | `--verde-alerta` | `#0fae7c` | `--rojo: #ff8b7f` |

Valores derivados: degradado claro `#7ee8a8` (por `#ff7d6c`, `#ff9a7d`, `#ff8a76`), degradado oscuro `#179b5f` (por `#e65255`, `#e25357`), texto claro sobre fondo de alerta `#dff8e9` y `#d5f5e1` (por `#ffd1ca`, `#ffd9d4`, `#ffc2b9`, `#ffc9c1`), cortina `#1f6f45` → `#0d3a25` (por `#8e2b52`, `#451638`) y texto oscuro sobre verde `#06281a` (por `#2b0e24`, `#2a0f24`, `#4a1226`).

Alternativa descartada: usar un único verde para todo. Habría hecho que error y éxito se vieran idénticos, lo que rompe la lectura de los avisos.

### El verde de alerta es un verde azulado (teal)

`--verde-alerta` usa un tono con más cian (`#0fae7c`) para separarse del verde de acento y del verde de éxito sin recurrir a un color no verde.

Contraste medido sobre `#170f24` (fondo de web_1): acento 9.3:1, alerta 6.5:1, éxito 10.9:1; texto oscuro `#06281a` sobre acento 7.9:1. Todos cumplen AA.

### Tokens renombrados, no solo recoloreados

Los tokens que nombraban un tono rojo se renombran a su tono real (`--coral` → `--verde-acento`, `--rojo` → `--verde-alerta`, `--verde` → `--verde-claro`). Un token que dice `--coral` con valor verde sería una deuda para quien lea el código. La clase `.ambient__glow--coral` pasa a `.ambient__glow--verde`, con su instancia actualizada en `index.html`.

### Reemplazo por búsqueda literal de valores

Cada valor rojo se sustituye en todas sus apariciones (degradados, `rgba(...)`, `stop-color`), manteniendo la estructura de la regla. No se reescriben reglas CSS ni se reorganiza la hoja.

### Prueba de regresión sobre el color

Se añade `tests/paleta.test.js`: recorre la hoja de estilos y los SVG en línea, convierte cada color a HSL y falla si aparece un tono de la familia roja (matiz ≤ 25° o ≥ 335°, con saturación ≥ 0.15 y luminosidad ≥ 0.15). La prueba también verifica que existan los tres verdes, que sean distintos entre sí y que su contraste contra el fondo alcance 4.5:1.

El rango de matiz deja fuera a los dorados y violetas de la marca (`#f5c77a` a 37°, `#3b174c` a 281°) y a los casi negros del texto (`#2b0e24` a 13° pero con luminosidad 11%), de modo que la prueba no produce falsos positivos.

### Documentación y lista de tareas

Se actualizan las referencias de paleta en `ANTEPROYECTO.md`, `PROPUESTA.md`, `DEFINICION.md` y `ESPECIFICACION.md` de `citas_web_1`, y se deja constancia del avance en `citas_web_1/TODOLIST.md`.

## Risks / Trade-offs

- [Un verde de alerta sobre verde de acento puede confundirse a baja saturación] → Se eligieron tonos separados en matiz y luminosidad, y cada estado mantiene texto, icono y forma además del color.
- [Los degradados con dos extremos de la misma familia pueden verse planos] → Se conservaron tres tonos por degradado (claro, acento y oscuro) como en la versión roja.
- [El test de color puede marcar falsos positivos con colores dorados o violetas] → Se ajustó el umbral de matiz y se comprobó con la hoja anterior que la prueba detecta los rojos originales y no marca los demás colores de la marca.
- [El script `test` de `citas_web_1` (`node --test tests`) no resolvía el directorio con Node 24 y dejaba la suite sin ejecutar] → Se cambia a `node --test "tests/**/*.test.js"`, que sí descubre los archivos de prueba.
- [No hay cobertura visual automatizada más allá del color] → La revisión visual se hizo con capturas de la SPA servida en local.
