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
- Resuelto: 10 salas de 80 butacas cada una; falta confirmar si todas tienen el mismo horario.

### 2. Lugares y precios — opción A

Butacas numeradas en **una sola zona**, con el mismo precio para todas.

- Se descarta la propuesta anterior de tres zonas.
- El servicio puede seguir recibiendo una zona por función; la zona es única.
- Resuelto después del cuestionario: $100 MXN por boleto en 2D y $150 MXN en 3D (ver «Datos complementarios»).

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

## Datos complementarios del cliente

Entregados el 3 de noviembre de 2026, después de aplicar el cuestionario.

| Dato | Valor |
| --- | --- |
| Salas | 10 |
| Precio en 2D | $100 MXN por boleto |
| Precio en 3D | $150 MXN por boleto |
| Película en cartelera | *Spider-Man*, por ahora la única |
| Capacidad por sala | 80 butacas numeradas (800 en total) |
| Butacas | Numeradas, una sola zona por función |

## Horarios por sala

También del 3 de noviembre de 2026. Cada sala ofrece tres funciones al día.

| Salas | Función 1 | Función 2 | Función 3 |
| --- | --- | --- | --- |
| 1–5 | 13:00–15:00 | 16:00–18:00 | 20:00–22:00 |
| 6–10 | 12:30–13:30 | 14:30–16:30 | 18:30–21:30 |

Total: **30 funciones diarias** y **2,400 butacas-día**.

Observaciones que requieren confirmación:

- Las duraciones no son uniformes: 2 horas en las salas 1–5, y de 1, 2 y 3 horas en las 6–10.
- No se indicó qué funciones son 2D y cuáles 3D.
- No se indicaron los días de operación.

El precio depende del **formato de la función**, no de la butaca. No contradice la respuesta 2: todas las butacas de una misma función cuestan lo mismo.

## Efecto sobre el anteproyecto

1. El negocio deja de ser una sala única con tres zonas: pasa a **10 salas** con una sola zona y precio según el formato de la función (2D o 3D).
2. La compra es como invitado; no hay cuentas de usuario.
3. La consolidación se reduce al conteo diario.
4. El manejo de butacas ocupadas queda definido: rechazar la selección completa, mostrar el mapa actualizado y pedir una nueva elección.

## Preguntas de seguimiento para el cliente

1. ¿Las horas indican inicio y fin de la función, y a qué se debe que las salas 6–10 tengan duraciones distintas?
2. ¿Qué funciones son 2D y cuáles 3D?
3. ¿Qué días de la semana opera el cineclub?
4. Sin cuentas, ¿cómo recupera una persona su boleto si cierra el navegador o cambia de dispositivo?
5. ¿El conteo diario incluye sólo compras pagadas o también reservas que vencieron?
