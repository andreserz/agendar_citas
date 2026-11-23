# Tasks — cambio-paleta-verde

Marcar con `[x]` al terminar. Reportar el avance en `citas_web_1/TODOLIST.md`.

Alcance: sólo `citas_web_1` (issue #39). `citas_web_2` queda intacto.

## 1. Paleta de `citas_web_1`

- [x] 1.1 Renombrar y recolorear los tokens de `:root` (`--coral` → `--verde-acento`, `--coral-oscuro` → `--verde-oscuro`, `--verde` → `--verde-claro`, `--rojo` → `--verde-alerta`) y verificar que ningún token conserve el nombre de un tono rojo.
- [x] 1.2 Sustituir en `app/css/styles.css` todos los hexadecimales y `rgba(...)` de la familia roja por sus equivalentes verdes (degradados de botón, calendario, asiento seleccionado, temporizador urgente, cortina, avisos, contadores, progreso y anillos) y verificar que un barrido de la hoja no encuentre rojo.
- [x] 1.3 Sustituir en `app/js/ui.js` y `app/js/views/home.js` los `stop-color` rojos de los SVG por el verde de acento y su tono oscuro, renombrar `.ambient__glow--coral` a `.ambient__glow--verde` en la hoja y en `app/index.html`, y verificar que los degradados se sigan renderizando.

## 2. Pruebas

- [x] 2.1 Añadir en `citas_web_1/tests/paleta.test.js` una comprobación que falle si `app/css/styles.css` o los SVG de `app/js/` contienen un color de la familia roja, y verificar que la comprobación falla con la hoja anterior y pasa con la nueva.
- [x] 2.2 Verificar en la misma prueba que existan los verdes de acento, éxito y alerta, que sean distintos entre sí y que su contraste contra el fondo sea de al menos 4.5:1.
- [x] 2.3 Ejecutar `npm test` en `citas_web_1` y verificar que pasan las 14 pruebas; corregir el script `test` de `package.json` si el runner no descubre los archivos.

## 3. Documentación

- [x] 3.1 Actualizar `citas_web_1/docs/ANTEPROYECTO.md`, `docs/PROPUESTA.md`, `docs/DEFINICION.md` y `docs/ESPECIFICACION.md` con los tonos verdes vigentes y verificar que ninguna frase describa el acento como coral.
- [x] 3.2 Registrar el avance en `citas_web_1/TODOLIST.md` indicando los issues #37 y #39 y los archivos afectados.

## 4. Revisión visual

- [x] 4.1 Servir la SPA en local y revisar en navegador la portada, la cartelera y el selector de asientos con la paleta verde, y verificar que no queden restos de rojo ni textos ilegibles.
- [x] 4.2 Confirmar que `citas_web_2` no tiene cambios respecto de `main` (`git diff main -- citas_web_2` vacío).
