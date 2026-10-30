# ADR-003 — Expiración de reservas calculada por el servicio

- **Estado:** Propuesta. Que la regla viva en el servicio y el reloj sea inyectable está en `../../../AGENTS.md`; la elección de expiración perezosa con barrido opcional es recomendación pendiente de revisar por R. La parte que toca al backend sigue como PR1.
- **Responsables:** R, L, D

## Contexto

Un asiento se aparta por 5 minutos y, si no se compra, debe volver a estar disponible para todos los sitios (RN01, RF07). Hay que decidir quién controla el vencimiento y cómo, de forma que sea correcta, simple y se pueda probar sin esperar 5 minutos.

Opciones consideradas:

| Opción | Ventaja | Desventaja |
| --- | --- | --- |
| Perezosa: calcular el estado al leer comparando `expiraEn` con la hora actual | Sin procesos en segundo plano; siempre correcta | Quedan reservas vencidas guardadas hasta limpiarlas |
| Barrido periódico que marca reservas vencidas | Datos ordenados | Ventana de inconsistencia entre barridos; otro proceso que operar |
| Temporizador por reserva | Liberación puntual | Se pierde al reiniciar; difícil de probar y de escalar |
| Expiración en la base de datos (TTL, eventos programados) | No requiere código en el servicio | Depende del motor, aún no definido (P2); no se puede probar con reloj simulado |

## Decisión

1. Cada reserva guarda `expiraEn = creadaEn + 5 min`.
2. **Expiración perezosa:** en cada lectura u operación, una reserva activa con `expiraEn <= ahora` se trata como vencida; sus asientos cuentan como disponibles y no cuentan para el límite de 10.
3. **Reloj inyectable:** la hora actual viene de un objeto reloj que en producción usa la hora del sistema y en pruebas se controla. Las operaciones de repositorio reciben `ahora` como parámetro.
4. **Barrido opcional** sólo para limpieza: puede marcar como vencidas las reservas viejas, pero ninguna regla depende de él.
5. Pagar una reserva vencida responde `410` (RN05); un rechazo de pago no extiende `expiraEn` (RN06).

## Consecuencias

- La regla es correcta aunque el servicio se reinicie o el barrido no corra.
- Las pruebas de expiración avanzan el reloj simulado en lugar de esperar.
- La base de datos sólo guarda `estado` y `expira_en`; la condición de vigencia se repite en las consultas de disponibilidad y de conteo, lo que el backend debe considerar en sus índices.
- La hora del servicio es la referencia. Si el adaptador real usara la hora del servidor de base de datos, una diferencia entre relojes podría liberar o retener asientos de más; por eso se pide recibir `ahora` como parámetro.
