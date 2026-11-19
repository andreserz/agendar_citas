# Design — impl-web2

## Contexto

La Definición de `web_2` (`citas_web_2/docs/DEFINICION.md`) ya fija los requisitos y reglas. El contrato fija cómo se llama a la API. Este documento decide la estructura de la SPA.

## Decisiones

**1. Misma estructura que web_1.** `app/` con `index.html`, `css/`, `js/` y `config.js`, para que el equipo reutilice el patrón de la SPA del teatro. No se comparte código entre sitios: cada uno es independiente (cada equipo puede avanzar sin tocar al otro).

**2. Estado de la reserva en la SPA.** La SPA guarda `reservaId` y `expiraEn` en `sessionStorage`. Sin cuenta, esa es la única forma de retomar un pago tras recargar.

**3. Mapa de 80 butacas por sala.** Filas A–H, números 1–10. El mapa se dibuja con el mismo componente para las 10 salas.

**4. Cartelera.** La página muestra la película vigente, sus 30 funciones diarias agrupadas por formato (2D salas 1–5, 3D salas 6–10) y el precio por formato.

**5. Idioma y clasificación.** Se muestran como «Por confirmar» mientras el cineclub no los entregue (contrato).

**6. Paleta y tipografías.** Las define este change en `citas_web_2/docs/PROPUESTA.md` y se validan en contraste WCAG AA antes de construir la interfaz. Hasta entonces, no se elige color final.

## Riesgos

- Si el cineclub cambia la lista de horarios, la semilla del servicio y la cartelera de la SPA deben cambiar juntas. El contrato es la fuente; la SPA solo lee lo que devuelve la API en modo `api`.
