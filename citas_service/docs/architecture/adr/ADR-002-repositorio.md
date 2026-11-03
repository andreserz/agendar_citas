# ADR-002 — Patrón repositorio con implementación en memoria

- **Estado:** Aceptada por el equipo de servicio (regla de diseño en `../../../AGENTS.md`). Que los sitios usen la versión en memoria mientras no exista la BD sigue como propuesta PR6.
- **Responsables:** D, L

## Contexto

El equipo de backend aún no define qué entrega (base de datos, API propia o procedimientos almacenados, P1), ni el motor ni el esquema (P2, P6). La entrega es el lunes 2 de noviembre y el servicio no puede esperar a esas respuestas para construir y probar las reglas de negocio.

## Decisión

La lógica de negocio depende de tres interfaces y nunca de una base de datos concreta:

- `AsientosRepo`: eventos, funciones, zonas y asientos con su estado.
- `ReservasRepo`: crear, consultar, listar, liberar y contar reservas; registrar intentos de pago.
- `OrdenesRepo`: pagar una reserva generando orden y boletos; consultar y listar órdenes.

Hay dos implementaciones previstas:

1. **En memoria** (ahora): carga los datos del teatro de web_1 al arrancar. Como Node.js ejecuta el código de forma secuencial, verificar y apartar dentro de una misma función síncrona basta para cumplir la exclusividad (RN02).
2. **Adaptador real** (cuando responda el backend): SQL, cliente HTTP o procedimientos, según P1, con las garantías pedidas en `../../specs/contrato-datos-backend.md`.

La implementación se elige por variable de entorno. Las operaciones que dependen del tiempo reciben la hora actual como parámetro (ver ADR-003).

## Consecuencias

- El servicio y sus pruebas funcionan desde el primer día sin base de datos, y los sitios pueden levantar la API con `npm install` y `npm start`.
- Cambiar a la base de datos real no toca la lógica ni las pruebas de negocio; el adaptador necesita sus propias pruebas de integración.
- Riesgo: la versión en memoria no reproduce problemas de concurrencia reales entre procesos. Las garantías de atomicidad del adaptador real deben probarse aparte.
- Los datos en memoria se pierden al reiniciar; es aceptable para desarrollo y demo, no para producción.
