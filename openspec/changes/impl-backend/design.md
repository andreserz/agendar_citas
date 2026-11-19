# Design — impl-backend

## Contexto

Las decisiones de base (SQL Server, solo procedimientos, UTC, errores por rango, transacciones) vienen de D4–D11 y de los ADR del backend. Este documento fija lo que el contrato compartido necesita de la base de datos. Todo lo que el servicio necesita está en `contrato-entre-capas`; este change no depende de ningún otro equipo.

## Decisiones

**1. Un sitio por fila, con bandera de comprador.** `Sitios.RequiereComprador` decide si una operación exige comprador. Así `web_2` no necesita código aparte (P15).

**2. Búsqueda única por folio o código.** `spOrdenes_Buscar` reemplaza `spOrdenes_ObtenerPorCodigo` (P17). Un solo procedimiento evita dos caminos de búsqueda con reglas distintas.

**3. Liberada separada de pagada.** El código `52002` nace porque el servicio necesita responder `410` para liberadas y `409` para pagadas. Mezclarlos en `51003` obligaría a leer el mensaje.

**4. Límite opcional, validado en la base de datos.** `@LimiteAsientos` se pasa solo desde el servicio cuando el sitio lo exige. La validación se repite en SP07 como defensa; el servicio la hace antes para responder con detalles.

**5. Zona de web_2 = sala.** Cada sala es una zona con capacidad 80. Eso permite reutilizar `PreciosZonaFuncion` sin tabla nueva.

**6. Conteo por día en CDMX.** SP19 agrupa por `CAST(DATEADD(HOUR, -6, CreadaEn) AS DATE)`, porque CDMX es UTC−6 fijo (E18).

## Riesgos

- El formato `Asientos no disponibles: 12,15` se parsea en el servicio. Si cambia, el servicio deja de reconocer los asientos. El contrato lo fija; cualquier cambio requiere un change nuevo.
- Los scripts se escriben una sola vez; la Etapa 6 debe probar la concurrencia en SQL Server real, no solo con el servicio en memoria.
