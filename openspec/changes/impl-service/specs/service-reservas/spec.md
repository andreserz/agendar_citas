## MODIFIED Requirements

### Requirement: Liberar reserva
El dueño de la reserva SHALL poder liberarla con `DELETE /api/v1/reservas/{reservaId}`, con estas reglas:

- Reserva `activa` y vigente → `204` sin cuerpo; sus asientos vuelven a `disponible`.
- Reserva `activa` con `expiraEn <= ahora` (vencida) → `410 RESERVA_VENCIDA`. **No se libera**: el estado sigue siendo vencido.
- Reserva `pagada` → `409 RESERVA_PAGADA`.
- Reserva `liberada` → `410 RESERVA_LIBERADA`.
- Reserva inexistente o de otro sitio o comprador → `404 NO_ENCONTRADO`.

Esta regla reemplaza la implementación en memoria, que hoy libera también las vencidas.

#### Scenario: Liberación exitosa
- **WHEN** el dueño libera una reserva activa con `A7`
- **THEN** la respuesta es `204` y `A7` vuelve a `disponible`

#### Scenario: Liberar una reserva vencida
- **WHEN** el dueño libera una reserva cuyo `expiraEn` ya pasó
- **THEN** la respuesta es `410 RESERVA_VENCIDA` y la reserva sigue vencida

#### Scenario: Liberar dos veces
- **WHEN** el dueño libera una reserva ya liberada
- **THEN** la respuesta es `410 RESERVA_LIBERADA`

### Requirement: Límite de 10 asientos por comprador y función
El límite SHALL aplicarse a los sitios con `RequiereComprador = 1` (`web_1`). El conteo suma boletos comprados, asientos de reservas `activa` con `expiraEn > ahora` y los solicitados; el máximo es 10. El valor `limitePorComprador` SHALL ser obligatorio en la capa de API para esos sitios; el repositorio ya no lo omite. Para `web_2` el límite no aplica. Si se excede, `422 LIMITE_EXCEDIDO` con `detalles: { maximo: 10, actuales, solicitados }`.

#### Scenario: Límite en web_1
- **WHEN** un comprador de `web_1` con 9 asientos en `F1` pide 2 más
- **THEN** la respuesta es `422` con `actuales = 9` y `solicitados = 2`

#### Scenario: Límite alcanzado
- **WHEN** un comprador tiene 9 asientos contados en `F1` y pide 2 más
- **THEN** la respuesta es `422` con `actuales: 9` y `solicitados: 2`

#### Scenario: Reservas vencidas no cuentan
- **WHEN** un comprador tiene 10 asientos de una reserva vencida y pide 10 nuevos
- **THEN** la respuesta es `201`

#### Scenario: Sin límite en web_2
- **WHEN** `web_2` aparta 12 asientos en una función
- **THEN** no se aplica `LIMITE_EXCEDIDO`
