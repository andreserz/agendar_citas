# BCK ADR-002 — Concurrencia con `AsientosFuncion` y actualización condicionada

- **Estado:** Aceptado (Propuesta §3.4, aprobada el 5 nov 2026)
- **Fecha:** 5 nov 2026
- **Responsables:** A (tabla), H (SP07 y SP13)

## Contexto

La garantía 1 del contrato pide que apartar varios asientos sea todo o nada, y que de dos peticiones simultáneas por el mismo asiento sólo una tenga éxito. Un índice único no basta para los apartados, porque un apartado vencido debe poder reutilizarse sin borrarlo.

## Decisión

Usar la tabla `AsientosFuncion`, con una fila por asiento y función (14,400 para web_1). `spReservas_Crear` hace, dentro de una transacción:

1. Una actualización condicionada: `UPDATE AsientosFuncion SET IdReservaActual, ExpiraEn WHERE IdFuncion = @IdFuncion AND IdAsiento IN (…) AND Vendido = 0 AND (ExpiraEn IS NULL OR ExpiraEn <= @Ahora)`.
2. Si `@@ROWCOUNT` es distinto del número de asientos solicitados: `ROLLBACK`, devuelve los asientos que fallaron y lanza `THROW 51001`.

`spOrdenes_Pagar` marca `Vendido = 1`. La restricción `UQ_Boletos_IdFuncion_IdAsiento` es una segunda defensa contra la doble venta.

## Alternativa descartada

Validar sobre `ReservasAsientos` con `UPDLOCK, HOLDLOCK`. Hay menos tablas, pero se bloquean rangos más amplios y las consultas son más complejas.

## Consecuencias

- La actualización bloquea sólo las filas de los asientos pedidos, así que dos reservas de asientos distintos no se estorban.
- `AsientosFuncion` debe llenarse cuando se crea una función (los datos iniciales lo hacen; para funciones nuevas se definirá en la Especificación).
- Hay que probar la concurrencia con dos sesiones simultáneas (`tests/`).
