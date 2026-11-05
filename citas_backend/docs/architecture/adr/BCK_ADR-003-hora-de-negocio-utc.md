# BCK ADR-003 — Hora de negocio (`@Ahora`, `@ExpiraEn`) y fechas en UTC

- **Estado:** Aceptado (E6, E7, E15 y E18)
- **Fecha:** 5 nov 2026
- **Responsables:** S, H

## Contexto

El servicio es dueño de la regla de 5 minutos (PR1 y ADR-003 del servicio) y necesita probar el vencimiento con un reloj simulado (garantía 3). Los sitios muestran la hora de la Ciudad de México (P8).

## Decisión

1. Los SP que dependen del tiempo reciben `@Ahora DATETIME2(3)` en UTC y nunca usan la hora del servidor para decidir vencimientos.
2. `spReservas_Crear` recibe también `@ExpiraEn`, calculado por el servicio, y sólo valida que sea posterior a `@Ahora` (error 53004).
3. Todas las fechas se guardan en UTC. Las columnas de auditoría (`FechaRegistro`) usan `SYSUTCDATETIME()`.
4. Para los datos iniciales, la hora local de la Ciudad de México se convierte a UTC sumando **6 horas fijas**: México eliminó el horario de verano en 2022, así que la zona `America/Mexico_City` es UTC−6 todo el año. No se usa `AT TIME ZONE`, porque depende de que Windows tenga actualizada su tabla de zonas horarias.

## Consecuencias

- Si cambia la duración del apartado, sólo se cambia el servicio.
- Las pruebas T-SQL pueden simular cualquier hora pasando otro `@Ahora`.
- Si México volviera a tener horario de verano, habría que ajustar el script de datos iniciales.
