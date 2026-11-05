# BCK ADR-004 — Códigos de error `THROW` por rangos y bitácora interna

- **Estado:** Aceptado (E12; lista ampliada en `BCK_DEFINICION.md` §5.6)
- **Fecha:** 5 nov 2026
- **Responsables:** H, S

## Contexto

`promt.md` pide usar `THROW` para abortar ante reglas incumplidas. El servicio necesita convertir esos errores en `409`, `410`, `422` o `404` (P12) sin interpretar textos.

## Decisión

| Rango | HTTP | Tipo |
| --- | --- | --- |
| 51000–51999 | 409 | No disponible o duplicado |
| 52000–52999 | 410 | Reserva vencida |
| 53000–53999 | 422 | Regla incumplida o parámetro inválido |
| 54000–54999 | 404 | No encontrado o inactivo |
| 50000 | 500 | Error interno |

Patrón de todos los SP:
- Las reglas de negocio se validan y se lanzan con `THROW <código>, <mensaje>, 1`.
- En el `CATCH`: si hay transacción abierta se hace `ROLLBACK`. Si el error está entre 51000 y 54999 se vuelve a lanzar (`THROW;`). Cualquier otro error se guarda en `BitacoraErrores` y se lanza `THROW 50000, 'Error interno', 1`.

## Consecuencias

- El servicio sólo necesita saber el rango para elegir el código HTTP.
- Los detalles técnicos de un error nunca llegan al cliente.
- Un código nuevo se agrega dentro del rango que le corresponde y se avisa en el chat.
