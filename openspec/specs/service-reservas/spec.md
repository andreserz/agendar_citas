# service-reservas

## Purpose

Apartado de asientos por 5 minutos, consulta, liberación y expiración de reservas, y límite de 10 asientos por comprador y función. Fuente: `citas_service/docs/ESPECIFICACION.md` §2–§3 y §5 (CA-01 a CA-18, CA-25), `citas_service/docs/ADR-003-expiracion.md`, `citas_service/docs/specs/ACUERDOS.md` (D6, D9–D11, PR1, PR4) y `citas_backend/docs/BCK_ESPECIFICACION.md` §6.7–§6.11 (SP07, SP08–SP11, SP17).

Estado general: el dominio está implementado en el repositorio en memoria (`ReservasRepo`) y probado (58 pruebas en `citas_service`, todas en verde). **No hay rutas HTTP de reservas montadas**. Pendientes: P5 (identificación del comprador, `401`) y P9 (confirmación de web_1).

## Requirements

### Requirement: Apartar asientos de una función
El servicio SHALL crear una reserva con `funcionId` y entre 1 y 10 `asientoIds` distintos. Todos los asientos SHALL pertenecer a la misma función. La reserva SHALL ser atómica: si cualquier paso falla, ningún asiento queda apartado.

El orden de validación SHALL ser determinista:

1. Formato: cuerpo válido, 1 a 10 asientos sin repetidos → `400 SOLICITUD_INVALIDA`.
2. Identidad del comprador → `401 NO_AUTENTICADO` (**pendiente P5**).
3. Existencia de la función y de los asientos → `404 NO_ENCONTRADO`. Asientos de funciones distintas → `400` (RN03).
4. Límite por comprador → `422 LIMITE_EXCEDIDO` (PR4).
5. Disponibilidad → `409 ASIENTO_NO_DISPONIBLE` con `detalles.asientoIds` de los que fallaron (RN11, P9).
6. Creación → `201` con `Location` apuntando a la reserva.

**Estado:** implementado en `ReservasRepo.crear` (pasos 3, 5 y 6 y el parámetro opcional `limitePorComprador` para el paso 4). Pasos 1 y 2 y la ruta `POST /reservas` pendientes.

#### Scenario: Apartado exitoso
- **WHEN** un comprador identificado pide `A7` y `A8` disponibles en `F1`
- **THEN** la respuesta es `201`, la reserva queda `activa`, `total = 1600` y `moneda = "MXN"` (CA-01)

#### Scenario: Asientos de dos funciones
- **WHEN** la petición incluye `A7` de `F1` y `D1` de `F2`
- **THEN** la respuesta es `400 SOLICITUD_INVALIDA` (CA-05)

#### Scenario: Rechazo total por un asiento ocupado
- **WHEN** `A7` está disponible y `A8` está apartado por otro comprador, y se piden ambos
- **THEN** la respuesta es `409` y `A7` no queda apartado (CA-04)

### Requirement: Vigencia de cinco minutos
El servicio SHALL calcular `expiraEn = creadaEn + 300 s` con su propio reloj, inyectable para pruebas. El sitio NO SHALL calcular ni extender la vigencia. La base de datos SHALL recibir `@Ahora` y `@ExpiraEn` y validar que `ExpiraEn > Ahora` (QB2, E15).

**Estado:** implementado en el repositorio en memoria (el repositorio recibe `expiraEn` ya calculado, ADR-002).

#### Scenario: Plazo exacto
- **WHEN** se crea una reserva con el reloj en `T0`
- **THEN** `expiraEn - creadaEn = 300 s` y `segundosRestantes = 300` (CA-02)

### Requirement: Precio congelado al apartar
El precio de cada asiento SHALL tomarse de la zona en la función al momento de apartar y SHALL no cambiar durante la vigencia (RN08).

#### Scenario: Cambio de precio posterior
- **WHEN** cambia el precio de la zona después de apartar `A7` a $800
- **THEN** la reserva sigue mostrando $800 y el total no cambia (CA-07)

### Requirement: Exclusividad bajo concurrencia
Un asiento SHALL estar en una sola reserva vigente o en un boleto (RN02). Con dos peticiones simultáneas por el mismo asiento, exactamente una SHALL responder `201` y la otra `409 ASIENTO_NO_DISPONIBLE` (CA-03, CA-25).

**Estado:** en memoria, la verificación y el apartado se hacen en una sola función síncrona (ADR-002 del servicio). En SQL Server: transacción con actualización condicionada y bloqueo (D6, `UQ_Funciones_IdEvento_FechaHoraInicio`). Esta última parte está pendiente.

#### Scenario: Doble apartado simultáneo
- **WHEN** dos comprados piden `A7` al mismo tiempo
- **THEN** uno obtiene `201` y el otro `409`

### Requirement: Límite de 10 asientos por comprador y función
El conteo SHALL sumar los boletos comprados, los asientos de reservas `activa` con `expiraEn > ahora` y los solicitados. El total NO SHALL superar 10 (RF11, RN04). El límite aplica a todos los sitios juntos (CA-11). Si se excede, la respuesta es `422 LIMITE_EXCEDIDO` con `detalles: { maximo: 10, actuales, solicitados }`.

**Estado:** `contarAsientosDeComprador` implementado y probado. La validación con el máximo ocurre en el repositorio solo si se pasa `limitePorComprador`; la capa de API debe pasarlo siempre.

#### Scenario: Límite alcanzado
- **WHEN** un comprador tiene 9 asientos contados en `F1` y pide 2 más
- **THEN** la respuesta es `422` con `actuales: 9` y `solicitados: 2` (CA-08)

#### Scenario: Reservas vencidas no cuentan
- **WHEN** un comprador tiene 10 asientos de una reserva ya vencida y pide 10 nuevos
- **THEN** la respuesta es `201` (CA-10)

### Requirement: Consultar reserva
El servicio SHALL devolver la reserva con `estado`, `expiraEn`, `segundosRestantes`, asientos, `total` y `moneda`.

- `segundosRestantes = max(0, expiraEn - ahora)` en segundos enteros **solo si** la reserva está `activa`; en otro caso vale `0`.
- `vencida` se calcula con `ahora >= expiraEn`; nunca se guarda (ADR-003, PR1).

**Estado:** implementado en `ReservasRepo.obtener` y probado. Ruta `GET /reservas/{id}` pendiente.

#### Scenario: Cuenta regresiva
- **WHEN** se consulta a los 120 s de creada la reserva
- **THEN** `estado = "activa"` y `segundosRestantes = 180` (CA-12)

#### Scenario: Vencida en lectura
- **WHEN** se consulta a los 300 s
- **THEN** `estado = "vencida"` y `segundosRestantes = 0` (CA-13)

### Requirement: Listar reservas activas del comprador
El servicio SHALL devolver solo las reservas `activa` y no vencidas del comprador autenticado.

**Estado:** repositorio implementado. Ruta `GET /reservas?estado=activa` pendiente (depende de P5).

### Requirement: Liberar reserva
El dueño de la reserva SHALL poder liberarla. Resultados:

- Reserva `activa` y vigente → `204` sin cuerpo; sus asientos quedan `disponible` (CA-16).
- Reserva vencida → `410 RESERVA_VENCIDA`; el estado sigue `vencida` (CA-17).
- Reserva pagada → `409 RESERVA_PAGADA` (CA-18).
- Segunda liberación → `410 RESERVA_LIBERADA`.
- Reserva de otro comprador → `404 NO_ENCONTRADO`, sin revelar que existe (RN09, CA-14, **pendiente P5**).

**Estado:** ver la discrepancia abajo. Ruta `DELETE /reservas/{id}` pendiente.

#### Scenario: Liberación exitosa
- **WHEN** el dueño libera una reserva activa con `A7`
- **THEN** la respuesta es `204` y `A7` vuelve a `disponible`

### Requirement: Expiración perezosa
Los asientos de una reserva vencida SHALL volver a `disponible` sin intervención del sitio ni de un proceso programado. El comprador SHALL recibir el asiento libre en la siguiente consulta (CA-15). Un barrido periódico (SP17) es opcional y solo limpia datos; ninguna regla depende de él.

**Estado:** implementado en el repositorio en memoria (el estado se calcula). SP17 está pendiente y es opcional.

#### Scenario: Liberación automática
- **WHEN** el reloj avanza 301 s desde la creación de la reserva con `A7`
- **THEN** `A7` aparece como `disponible` en la consulta de asientos

## Discrepancias abiertas

- **Liberar una reserva vencida.** La especificación (CA-17) y la propuesta del backend (A.4, punto 3) dicen que responde `410 RESERVA_VENCIDA` y no llama al procedimiento. **La implementación en memoria la libera** (`reservas-repo-memoria.js`, comentario «BCK RN12»), y así lo prueba el contrato de pruebas. Hay que decidir una sola regla, corregir la otra y registrarla en `ACUERDOS.md`.
- **Límite opcional en el repositorio.** `crear` valida el límite solo si recibe `limitePorComprador`. Si la capa de API lo olvida, el límite no se aplica. Conviene que el valor sea obligatorio en la API.
- **Identidad del comprador.** Todas las operaciones de esta capacidad dependen de P5 (cuentas) y de P15 (web_2 compra sin cuenta). Mientras no se resuelva, no hay forma de aplicar RN09.
