---
name: update-checklist
description: Mantiene actualizado el estatus con emojis de un checklist/todolist en Markdown (pendiente, en progreso, hecho, bloqueado, omitido). Úsalo al iniciar, avanzar o terminar tareas cuando exista un archivo como todolist.md, o cuando el usuario pida actualizar el avance.
argument-hint: "[ruta del checklist] (opcional; por defecto todolist.md)"
---

Actualiza el checklist `$ARGUMENTS` (si está vacío, busca `todolist.md` en la raíz; si no existe, `TODO.md`, `checklist.md` o `docs/**/todolist*.md`). Si no hay ninguno, dilo y no crees uno sin petición explícita.

## Leyenda canónica

| Emoji | Significado | Checkbox equivalente |
|---|---|---|
| ⬜ | pendiente | `- [ ]` |
| 🔄 | en progreso | `- [ ]` + 🔄 |
| ✅ | hecho | `- [x]` |
| 🚧 | bloqueado (indicar causa) | `- [ ]` + 🚧 |
| ⏭️ | omitido / fuera de alcance | `- [ ]` + ⏭️ |

Si el archivo ya define su propia leyenda (línea “Leyenda de estatus”), **respétala** y no la cambies. Si no tiene, agrégala bajo el título.

## Procedimiento

1. Lee el archivo y detecta el formato: tablas con columna `Estatus`, checkboxes `- [ ]`, o ambos.
2. Contrasta con el trabajo real de la sesión (archivos modificados, pruebas ejecutadas). Solo marca ✅ lo **verificado** (prueba o typecheck pasando); lo implementado sin verificar queda 🔄.
3. Aplica los cambios con `Edit` (no reescribas el archivo):
   - al empezar una tarea → 🔄 (una o pocas en progreso a la vez);
   - al terminarla y verificarla → ✅, y completa la columna de archivos si existe;
   - si falta una dependencia/decisión → 🚧 con una nota breve de la causa;
   - si se descarta → ⏭️ con el motivo.
4. Recalcula los agregados:
   - contador `n/total` por fase (cuenta solo ✅; ⏭️ no cuenta en el total);
   - estatus de la fase: ⬜ si ninguna iniciada, 🔄 si hay alguna en progreso o parcial, ✅ si todas hechas, 🚧 si alguna bloqueada y ninguna en progreso.
5. Si existe bitácora/tabla de pruebas (antes/después), agrega la fila con fecha y resultado real.
6. Reporta al usuario un resumen corto: tareas que cambiaron de estatus y avance total.

## Reglas

- No marques ✅ por suposición ni por “casi listo”.
- No cambies texto, numeración ni orden de tareas; solo estatus, contadores y notas.
- No agregues tareas nuevas salvo que el usuario lo pida o surjan del alcance explícito; si surgen, añádelas como ⬜ y avísalo.
- Escribe en español; mantén en inglés rutas e identificadores.
- Sin commit ni push salvo petición explícita.
