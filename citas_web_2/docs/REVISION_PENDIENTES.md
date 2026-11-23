# Revisión de pendientes — citas_web_2 (20 de noviembre de 2026)

Estado: revisión cerrada. Contrasta el `TODOLIST.md` de este sitio con el contrato de OpenSpec (`../../citas_service/docs/specs/ACUERDOS.md`, decisiones D13–D26) y con el estado de `app/` y `tests/`.

## Lo que quedó cerrado

| Tema | Antes | Ahora |
| --- | --- | --- |
| Coordinación con `citas_service` | Cuatro acuerdos abiertos (P4, P5, P8, P9, P10) | Cerrada por D13–D24 el 18 nov 2026; ya no se acuerda por chat (D25, D26) |
| Compra sin cuenta | Pendiente de confirmar al servicio | D18: `web_2` usa `RequiereComprador = 0` y no envía `Authorization` |
| Recuperación del boleto | Pendiente de consulta por folio | D20: `GET /ordenes/buscar?folio=` filtra por `X-Sitio` |
| Conteo diario | Pendiente de exposición | D21: `GET /reportes/reservas-por-dia?desde=&hasta=` |
| Formato del código de boleto (PR7) | Abierto en la Especificación | D24: 12 caracteres `[A-Z2-9]` y folio `ORD-` + 6 dígitos; el contrato no define el QR, lo dibuja el sitio |

## Lo que sigue pendiente

1. **Definición:** confirmación formal del cliente sobre el folio (RN05) y el conteo diario (RN06). Es el único punto para cerrar la etapa.
2. **Propuesta:** identidad visual. Paleta, contraste y tipografías quedan en `PROPUESTA.md`; falta la aprobación del equipo y del cliente, y el nombre comercial de la marca.
3. **Especificación:**
   - cómo se dibuja el QR en JavaScript vanilla y el respaldo textual si no carga;
   - criterios de aceptación de RF01 a RF11.
4. **Construcción y Pruebas:** el change `impl-web2` (`../../openspec/changes/impl-web2/tasks.md`) sigue completo en pendiente; `app/` y `tests/` aún no existen.

> Actualización del 23 nov 2026: la Propuesta y la Especificación ya están redactadas (`PROPUESTA.md` y `ESPECIFICACION.md`) y las tareas 1.1–1.3 de `impl-web2` están cerradas. Queda su validación con el equipo y el cliente, además de la confirmación del folio y el conteo diario.

## Correcciones registradas

- El resumen de la Definición decía que «cerró» el folio y el conteo diario. No está cerrada: falta el cliente. Se corrigió el texto del `TODOLIST.md` y de `DEFINICION.md`.
- PR7 ya no es una pregunta abierta del contrato: D24 fija el formato y deja el dibujo del QR en el sitio.
