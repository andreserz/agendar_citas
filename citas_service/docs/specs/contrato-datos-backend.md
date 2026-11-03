# Contrato de datos — lo que citas_service necesita de citas_backend

Estado: borrador del equipo de servicio (D) para enviar al backend. Este documento dice **qué** datos y garantías necesitamos, no **cómo** construir la base de datos: el motor, el esquema, los nombres y los índices los decide el backend. Los nombres de campos son ilustrativos.

Reglas de negocio de referencia: `../DEFINICION.md`. Respuestas y acuerdos: `ACUERDOS.md`.

## Cómo responder

Contesten en el chat del grupo; el líder de contrato registrará las respuestas en `ACUERDOS.md`. Lo más urgente para nosotros, antes del **viernes 30 de octubre**:

1. **P1:** qué nos entregan: (A) la base de datos y nosotros escribimos las consultas, (B) una API propia que llamamos por HTTP, o (C) la base de datos con procedimientos almacenados.
2. **P2:** motor y forma de levantarla localmente (Docker Compose, scripts SQL o archivo SQLite) y un `.env.example` con host, puerto y nombre de la base, sin contraseñas reales.
3. **P3:** quién carga los datos iniciales.
4. **P6:** dónde documentan el esquema y cómo nos avisan de cambios.

Si no hay respuesta el viernes, el servicio entregará con datos en memoria y dejará el adaptador como siguiente paso.

## Entidades y datos mínimos

| Entidad | Datos que necesitamos |
| --- | --- |
| Sitio | identificador, nombre (`web_1`, `web_2`) |
| Comprador | identificador, nombre, correo único; contraseña con hash sólo si P5 asigna las cuentas al servicio |
| Evento | identificador, nombre, descripción, sitio al que pertenece |
| Función | identificador, evento, fecha y hora de inicio (zona horaria según P8) |
| Zona | identificador, nombre, precio por función, moneda |
| Asiento | identificador, zona, etiqueta visible (por ejemplo fila `A` y número `7`) |
| Reserva | identificador, comprador, sitio, función, estado (`activa`, `liberada`, `pagada`), `creada_en`, `expira_en`, total |
| Asiento de reserva | reserva, asiento, precio tomado al apartar |
| Intento de pago | identificador, reserva, resultado (`aprobado`, `rechazado`), fecha |
| Orden | identificador o número visible, reserva, comprador, sitio, total, fecha de compra |
| Boleto | identificador, orden, asiento, función, precio, código único |

Notas:
- El precio puede guardarse por zona y función o por zona si es igual en todas las funciones; lo importante es poder obtener el precio de un asiento en una función.
- El estado "vencida" **no** se guarda: el servicio lo calcula comparando `expira_en` con su propia hora (ver PR1 y ADR-003). Un barrido opcional podrá marcar reservas viejas sólo para limpieza.

## Garantías que necesitamos

1. **Apartado atómico (PR2).** Al crear una reserva con varios asientos, si algún asiento ya está comprado o en otra reserva activa con `expira_en` posterior a la hora indicada, la operación falla completa y nos dice cuáles asientos fallaron. Dos peticiones simultáneas por el mismo asiento: sólo una puede tener éxito.
2. **Pago exitoso atómico.** Marcar la reserva como pagada, crear la orden y crear sus boletos ocurre en una sola transacción, y sólo si la reserva sigue activa y no vencida en ese momento.
3. **La hora la manda el servicio.** Las operaciones que dependen del tiempo (apartar, pagar, contar reservas vigentes) reciben la hora actual como parámetro en lugar de usar la hora del servidor de base de datos. Así podemos probar la expiración con un reloj simulado.
4. **Unicidad.** Un asiento de una función no puede tener dos boletos. Los códigos de boleto y los correos de comprador son únicos.
5. **Persistencia.** Lo confirmado no se pierde al reiniciar.

Un patrón posible para la garantía 1, sólo como ejemplo: una actualización condicionada sobre los asientos de la función (`... WHERE estado = 'disponible' OR expira_en <= :ahora`) que verifique que el número de filas afectadas sea igual al de asientos solicitados, dentro de una transacción. El backend elige la técnica.

## Operaciones que el servicio necesita

Corresponden a las interfaces del servicio (ADR-002). Si la respuesta a P1 es (A) o (C), son consultas o procedimientos; si es (B), son endpoints de su API.

**Catálogo (`AsientosRepo`)**
- Listar eventos; listar funciones de un evento; obtener una función.
- Listar los asientos de una función con zona, precio y su estado (comprado, en reserva activa con `expira_en`, o libre).

**Reservas (`ReservasRepo`)**
- Crear una reserva con sus asientos y precios (garantía 1).
- Obtener una reserva con sus asientos.
- Listar las reservas activas de un comprador.
- Contar los asientos de un comprador en una función: en reservas activas no vencidas a la hora indicada y en boletos comprados (regla de máximo 10).
- Marcar una reserva como liberada.
- Registrar un intento de pago.

**Órdenes (`OrdenesRepo`)**
- Pagar una reserva: crear la orden y los boletos y marcar la reserva como pagada (garantía 2).
- Obtener una orden con sus boletos.
- Listar las órdenes de un comprador.
- Listar boletos con comprador, asiento, función, fecha de compra y monto, para consolidación (alcance del backoffice pendiente).

## Volumen esperado

Para el teatro de web_1: 120 funciones (40 días entre jueves, viernes y sábado, tres horarios, octubre a diciembre de 2026) con 120 asientos cada una, 14,400 asientos-función. Las consultas más frecuentes son "asientos de una función" y "asientos de un comprador en una función". Los datos de web_2 están pendientes (P4).

## Datos iniciales

Los del teatro de web_1: obra «¡Que no se entere la suegra!», funciones descritas arriba y zonas Preferente (A–C, 10 por fila, $800 MXN), General (D–I, $500 MXN) y Balcón (J–L, $300 MXN). Ver `../../../citas_web_1/docs/DEFINICION.md`.

## Calendario propuesto

| Fecha | Qué |
| --- | --- |
| Vie 30 oct | Respuestas a P1, P2, P3 y P6, y comentarios a este documento |
| Sáb 31 oct | Esquema o API disponible para correr localmente |
| Dom 1 nov | Prueba de integración con el adaptador del servicio |
| Lun 2 nov | Entrega; si no hubo integración, el servicio entrega con datos en memoria |
