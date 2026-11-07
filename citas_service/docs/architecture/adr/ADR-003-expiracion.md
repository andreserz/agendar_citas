# ADR-003 — Expiración de reservas calculada por el servicio

- **Estado:** Aceptada por R el 6 nov 2026 (ver *Revisión de R* al final). Que la regla viva en el servicio y el reloj sea inyectable está en `../../../AGENTS.md`; la expiración perezosa queda aceptada y el barrido periódico **no** es obligatorio. La parte que toca al backend sigue como PR1.
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

## Revisión de R — 6 nov 2026

Revisado por R (dominio de reservas) junto con `../../ESPECIFICACION.md`. Se aceptan las cinco decisiones; se agregan estas precisiones para que la regla sea verificable:

1. **Borde del vencimiento.** La comparación es `ahora >= expiraEn` (no `>`): en el segundo exacto de `expiraEn` la reserva ya está vencida y el asiento está disponible. Es la semántica que usan los criterios CA-13 y CA-15.
2. **Cálculo expuesto al sitio.** `segundosRestantes = max(0, expiraEn - ahora)` lo calcula el servicio y se devuelve en el objeto `Reserva`; el navegador no debe calcularlo con su propio reloj. Vale `0` en cuanto la reserva deja de estar `activa` (`vencida`, `liberada` o `pagada`), aunque `expiraEn` siga en el futuro.
3. **Conteo del límite de 10.** Las reservas vencidas no cuentan (CA-10), así que la operación de conteo por comprador y función también recibe `ahora`. Contar con la hora de la BD daría un resultado distinto al de la lógica del servicio.
4. **El barrido es opcional en la entrega.** Para el 9 nov puede omitirse: no aporta corrección y agrega un proceso que operar. Si se implementa, sólo marca reservas viejas como limpieza y ninguna lectura depende de él.
5. **Índices para el adaptador real.** La condición de vigencia se repite en la consulta de disponibilidad y en la de conteo; conviene que el backend cubra al menos `(funcion, asiento, estado, expira_en)` y `(comprador, funcion, expira_en)`. Es una petición que se tramita con P11–P13, no una decisión de este ADR.
6. **Riesgo aceptado y acotado.** La implementación en memoria no reproduce concurrencia entre procesos (ADR-002). Se cubre con el criterio CA-25 (dos apartados simultáneos) y se documenta como límite de la entrega local; la garantía real es de la BD (D6, PR2).

No se cambia ninguna decisión del ADR; sólo se precisa su verificación en `../../ESPECIFICACION.md`.
