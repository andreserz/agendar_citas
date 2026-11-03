# Respuestas del cliente — cuestionario de reserva

Registro de las respuestas al cuestionario `CUESTIONARIO_PARA_RESERVA.md`. Fecha de registro: 3 de noviembre de 2026.

## Resumen

| # | Tema | Respuesta | Efecto en el anteproyecto |
| --- | --- | --- | --- |
| 1 | Oferta de funciones | **C)** Varias salas en paralelo, con películas distintas a la misma hora | Cambia el modelo: ya no es una sala única |
| 2 | Lugares y precios | **A)** Butacas numeradas, una sola zona, mismo precio | Se descartan las zonas VIP, general y frente |
| 3 | Cuentas | **E)** Sin cuenta: «no es necesario la cuenta, simplemente que compre sus boletos» | Desaparecen registro, inicio de sesión e historial personal |
| 4 | Butacas ocupadas | **D)** Mostrar el mapa actualizado y pedir una nueva elección, sin apartar nada | Coincide con P9: deja el caso resuelto |
| 5 | Consolidación | **E)** «Por ahora sólo el historial de reservación, cuántas fueron al día» | Consolidación mínima: conteo diario |

## Detalle

### 1. Oferta de funciones — opción C

El cineclub opera **varias salas en paralelo**, con películas distintas a la misma hora.

- Implica que cada función pertenece a una sala concreta y que el mapa de butacas es por función y sala.
- El servicio ya modela evento, función y asiento, así que no requiere cambios de contrato.
- Pendiente: cuántas salas hay, capacidad de cada una y si todas tienen el mismo horario.

### 2. Lugares y precios — opción A

Butacas numeradas en **una sola zona**, con el mismo precio para todas.

- Se descarta la propuesta anterior de tres zonas.
- El servicio puede seguir recibiendo una zona por función; la zona es única.
- Pendiente: monto del precio único y moneda.

### 3. Cuentas — opción E

El cliente no quiere cuentas: la persona compra sus boletos directamente.

- Responde **P5** para `citas_web_2`: no se requiere registro ni inicio de sesión.
- Desaparecen las pantallas de registro, inicio de sesión y «mis compras».
- Consecuencia: el **límite de diez butacas por persona y función no se puede aplicar**, porque no hay forma de identificar a la persona entre compras.
- Consecuencia: el boleto debe entregarse al terminar la compra y poder recuperarse con un folio o código, porque no habrá cuenta donde consultarlo.

### 4. Butacas ocupadas — opción D

Si alguna butaca ya no está disponible al confirmar, el sistema **muestra el mapa actualizado y pide una nueva selección**, sin apartar nada.

- Coincide con la propuesta **P9** del servicio: se rechaza la selección completa y no se apartan butacas parciales.
- El mapa debe señalar cuáles butacas dejaron de estar disponibles, para que la persona entienda por qué falló.
- Este caso sí puede presentarse: el bloqueo de cinco minutos empieza al confirmar la reserva, no al abrir el mapa. La respuesta elegida es la que lo resuelve.

### 5. Consolidación — opción E

El cliente pide, por ahora, sólo el **conteo de reservas por día**.

- No solicita detalle de comprador, montos ni exportación.
- Pendiente: si el conteo incluye sólo compras pagadas o también reservas que no se pagaron, y si se desglosa por sala o función.

## Efecto sobre el anteproyecto

1. El negocio deja de ser una sala única con tres zonas: pasa a varias salas con una sola zona y precio único.
2. La compra es como invitado; no hay cuentas de usuario.
3. La consolidación se reduce al conteo diario.
4. El manejo de butacas ocupadas queda definido: rechazar la selección completa, mostrar el mapa actualizado y pedir una nueva elección.

## Preguntas de seguimiento para el cliente

1. ¿Cuántas salas tiene el cineclub y cuántas butacas tiene cada una?
2. ¿Cuál es el precio único por butaca y en qué moneda?
3. Sin cuentas, ¿cómo recupera una persona su boleto si cierra el navegador o cambia de dispositivo?
4. ¿El conteo diario incluye sólo compras pagadas o también reservas que vencieron?
