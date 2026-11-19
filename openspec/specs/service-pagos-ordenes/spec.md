# service-pagos-ordenes

## Purpose

Pago simulado de una reserva, creación atómica de orden y boletos, y consulta de compras. Fuente: `citas_service/docs/ESPECIFICACION.md` §3.7 (CA-19 a CA-24, CA-27), `citas_service/docs/specs/ACUERDOS.md` (D14, PR7, P17, P19), `citas_backend/docs/BCK_ESPECIFICACION.md` §6.12–§6.14 y §6.18 (SP12, SP13, SP14, SP18) y el comportamiento de `citas_web_1`.

Estado general: implementado en el repositorio en memoria (`OrdenesRepo.pagar` y `ReservasRepo.registrarPagoRechazado`) y probado. **No hay rutas HTTP de pago ni de órdenes**. El pago SQL usa `spIntentosPago_Registrar` y `spOrdenes_Pagar` del backend, todavía sin scripts.

## Requirements

### Requirement: Tarjetas de prueba
El pago simulado SHALL aceptar solo dos números de tarjeta (D14):

- `4242 4242 4242 4242` → siempre **aprobado**.
- `4000 0000 0000 0002` → siempre **rechazado**.
- Cualquier otro número → `400 SOLICITUD_INVALIDA` con `detalles.campo = "numeroTarjeta"` y el mensaje «usa una tarjeta de prueba». No se registra intento.

El cuerpo SHALL contener `numeroTarjeta`, `titular`, `vencimiento` (`MM/AA`, no vencido) y `cvv` (3 dígitos). Si falta un campo o su formato es inválido, la respuesta es `400` (CA-27).

**Estado:** pendiente de implementar la validación en la API. `citas_web_1` aplica la misma regla en la interfaz.

#### Scenario: Número no válido para la demo
- **WHEN** se envía `numeroTarjeta = "5555 5555 5555 4444"`
- **THEN** la respuesta es `400` y no se crea intento de pago

#### Scenario: CVV con dos dígitos
- **WHEN** se envía `cvv = "12"`
- **THEN** la respuesta es `400` con `detalles.campo = "cvv"`

### Requirement: Pago aprobado
Un pago aprobado sobre una reserva `activa` y vigente SHALL, en una sola operación atómica (RN07):

1. registrar el intento con `resultado = aprobado`;
2. cambiar la reserva a `pagada`;
3. crear la orden con su folio;
4. crear un boleto por asiento con código único;
5. marcar los asientos como `comprado`.

La respuesta es `201` con `simulado: true`, `resultado: "aprobado"` y la orden con sus boletos (CA-19). Si falla cualquier paso, la reserva SHALL seguir `activa` y no debe quedar orden ni boleto parcial (CA-24).

**Estado:** implementado en `OrdenesRepo.pagar` y probado en memoria. Ruta `POST /reservas/{id}/pago` pendiente.

#### Scenario: Compra completa
- **WHEN** se paga una reserva activa de un asiento con la tarjeta aprobada
- **THEN** la reserva queda `pagada`, existe una orden con 1 boleto con código de 12 caracteres y el asiento queda `comprado`

#### Scenario: Falla a mitad del pago
- **WHEN** falla la creación de un boleto
- **THEN** no existe orden, la reserva sigue `activa` y el asiento sigue `apartado`

### Requirement: Pago rechazado
Un pago rechazado sobre una reserva vigente SHALL registrar el intento con `resultado = rechazado` y responder `201` con `resultado: "rechazado"`. La reserva SHALL seguir `activa` y `expiraEn` NO SHALL cambiar (RN06, CA-20). Tras el rechazo, el comprador puede reintentar mientras la reserva esté vigente (CA-21): el reintento aprobado crea una sola orden.

**Estado:** implementado en `ReservasRepo.registrarPagoRechazado` y probado.

#### Scenario: Reintento tras rechazo
- **WHEN** una reserva recibe un rechazo y luego un pago aprobado antes de vencer
- **THEN** la reserva queda `pagada` y existe una única orden (CA-21)

### Requirement: Pago sobre reserva no pagable
El pago SHALL responder sin cobrar cuando la reserva no esté `activa`:

- `vencida` → `410 RESERVA_VENCIDA`, sin orden, boleto ni registro de cobro (CA-22).
- `pagada` → `409 RESERVA_PAGADA`, sin una segunda orden (CA-23).
- `liberada` → `410 RESERVA_LIBERADA`.
- Inexistente → `404 NO_ENCONTRADO`.

**Estado:** implementado y probado en memoria.

#### Scenario: Pago doble
- **WHEN** se intenta pagar una reserva ya `pagada`
- **THEN** la respuesta es `409 RESERVA_PAGADA` y sigue existiendo una sola orden

### Requirement: Folio y código de boleto
La orden SHALL tener un folio visible con formato `ORD-` seguido de 6 dígitos (`ORD-000123`, QB4). Cada boleto SHALL tener un código de 12 caracteres del conjunto `[A-Z2-9]` (E16, PR7), único y difícil de adivinar (RN10). El código no lleva prefijo ni guiones.

**Estado:** implementado en memoria con ese formato. El `openapi.yaml` todavía muestra `ORD-2026-000123` y `BOL-7KQ2-M9XD-4TPA`, por corregir.

#### Scenario: Forma del folio
- **WHEN** se crea la orden número 123
- **THEN** el folio es `ORD-000123`

### Requirement: Consultar compras
El comprador SHALL poder listar sus órdenes, de la más antigua a la más reciente, y consultar una orden con sus boletos. Un comprador SHALL NOT ver órdenes de otro (RN09).

**Estado:** `listarDeComprador` y `obtener` implementados. Rutas `GET /ordenes` y `GET /ordenes/{id}` pendientes; dependen de P5.

#### Scenario: Orden de otro comprador
- **WHEN** un comprador pide la orden de otro
- **THEN** la respuesta es `404 NO_ENCONTRADO`

### Requirement: Recuperar boleto sin cuenta (web_2)
Para web_2, que no tiene cuentas (P15, P17), el servicio SHALL permitir consultar una orden por su folio (`Folio`) o por el código de un boleto (`Codigo`), sin autenticación. El procedimiento correspondiente es SP18 (`spOrdenes_ObtenerPorCodigo`), del que se espera el mismo manejo para folio.

**Estado:** pendiente. Propuesta a `citas_backend` (P17) sin respuesta registrada.

#### Scenario: Recuperación por folio
- **WHEN** web_2 consulta con el folio `ORD-000123` y el servicio lo encuentra
- **THEN** la respuesta contiene la orden y sus boletos

### Requirement: Registro del intento de pago
Cada intento SHALL guardar la fecha, el resultado y los últimos 4 dígitos de la tarjeta. El número completo y el CVV NUNCA SHALL guardarse ni aparecer en logs (D14, RNF09). Mientras la columna `UltimosDigitos` no exista (P19), los últimos 4 dígitos se conservan solo en memoria para construir la respuesta.

**Estado:** pendiente de confirmación de P19 por `citas_backend`.

#### Scenario: Datos sensibles
- **WHEN** se registra un pago
- **THEN** ni la base de datos ni el log contienen el número completo ni el CVV

## Discrepancias y pendientes

- `openapi.yaml` todavía tiene `resultadoSimulado`, que D14 reemplazó.
- La validación de tarjetas en la API no existe aún; hoy solo existe en la interfaz de web_1.
