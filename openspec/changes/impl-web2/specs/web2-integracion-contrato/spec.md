## ADDED Requirements

### Requirement: Configuración del sitio
La SPA SHALL tener `app/config.js` con `apiBaseUrl = "http://localhost:3000/api/v1"`, `sitio = "web_2"`, `modo` (`auto`, `demo` o `api`), `tiempoEsperaMs = 2200` y `duracionReservaSegundos = 300`. Se ejecuta en `http://localhost:5502`, puerto aceptado por CORS.

#### Scenario: Origen permitido
- **WHEN** la SPA se abre en `http://localhost:5502`
- **THEN** sus peticiones a `localhost:3000` no son bloqueadas por CORS

### Requirement: Identificación sin cuenta
Toda petición SHALL enviar `X-Sitio: web_2`. La SPA NO SHALL enviar `Authorization` ni mostrar registro, inicio de sesión ni historial de compras (RN04). Las reservas se identifican por su `id`, que la SPA guarda para el comprador mientras dura la reserva.

#### Scenario: Compra sin cuenta
- **WHEN** el visitante aparta butacas y paga
- **THEN** las peticiones no llevan `Authorization` y la SPA no muestra ninguna pantalla de cuenta

### Requirement: Rutas usadas
La SPA SHALL usar estas rutas del contrato: `GET /eventos`, `GET /eventos/{id}/funciones`, `GET /funciones/{id}/asientos`, `POST /reservas`, `GET /reservas/{id}`, `DELETE /reservas/{id}`, `POST /reservas/{id}/pago`, `GET /ordenes/{id}`, `GET /ordenes/buscar?folio=` y `GET /reportes/reservas-por-dia`.

#### Scenario: Recuperación de boleto
- **WHEN** el visitante escribe el folio `ORD-000123`
- **THEN** la SPA llama a `GET /ordenes/buscar?folio=ORD-000123` y muestra los boletos

#### Scenario: Conteo diario
- **WHEN** el operador consulta un rango de fechas
- **THEN** la SPA llama a `GET /reportes/reservas-por-dia` con `desde` y `hasta` en formato `AAAA-MM-DD`

### Requirement: Mapa de butacas y estados
La SPA SHALL dibujar las 80 butacas de la sala con los estados `disponible`, `apartada` y `vendida`, mapeando desde los estados del servicio `disponible`, `apartado` y `comprado` (nombres distintos, mismo significado). El precio por butaca SHALL venir de la función (`zonas[0].precio`).

#### Scenario: Butaca vendida
- **WHEN** el servicio devuelve `estado = "comprado"` para una butaca
- **THEN** la SPA la muestra como vendida

### Requirement: Rechazo de selección completa
Si `POST /reservas` responde `409 ASIENTO_NO_DISPONIBLE`, la SPA SHALL no guardar ninguna butaca de la selección, volver a pedir el mapa, marcar en conflicto las butacas de `detalles.asientoIds` y pedir una nueva elección (RF05).

#### Scenario: Conflicto
- **WHEN** la respuesta trae `detalles.asientoIds = ["F7"]`
- **THEN** la SPA muestra `F7` en conflicto y no conserva ninguna butaca apartada

### Requirement: Mensajes de vencimiento y reintento
Si el servicio responde `410 RESERVA_VENCIDA` o `410 RESERVA_LIBERADA`, la SPA SHALL mostrar un mensaje claro sin jerga técnica y ofrecer volver a elegir. Un pago `rechazado` SHALL permitir reintentar mientras la reserva esté `activa` (RF06).

#### Scenario: Reserva vencida al pagar
- **WHEN** el pago responde `410 RESERVA_VENCIDA`
- **THEN** la SPA informa que el apartado venció y ofrece elegir butacas de nuevo

### Requirement: Modo demo
Si `modo` es `auto` y el servicio no responde, la SPA SHALL usar datos demo con la misma semilla del contrato para web_2 (10 salas, 800 butacas, 3 horarios por sala) y mostrar el aviso de modo demo.

#### Scenario: Servicio apagado
- **WHEN** el servicio no responde en modo `auto`
- **THEN** la SPA muestra la cartelera demo con el aviso visible
