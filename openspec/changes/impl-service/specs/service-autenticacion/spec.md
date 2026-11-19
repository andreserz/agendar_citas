## MODIFIED Requirements

### Requirement: Dueño de la autenticación
El servicio SHALL emitir y validar los tokens JWT de los compradores (HS256, expiración de 8 horas, `sub` = id del comprador). El secreto SHALL venir de `JWT_SECRET`. La contraseña SHALL guardarse como hash `crypto.scrypt` con sal aleatoria por comprador; la base de datos solo recibe el hash (E3, P5).

#### Scenario: Hash en el servicio
- **WHEN** se registra un comprador
- **THEN** la base de datos recibe `HashContrasena` y nunca la contraseña en texto plano

### Requirement: Registro de comprador
`POST /api/v1/auth/registro` SHALL crear un comprador con `{ nombre, correo, contrasena }` y responder `201` con `{ comprador, token }`. Correo repetido → `409 CORREO_REGISTRADO`. Campos faltantes o inválidos → `400 SOLICITUD_INVALIDA`.

#### Scenario: Correo repetido
- **WHEN** se registra un correo ya existente
- **THEN** la respuesta es `409` con `error.codigo = "CORREO_REGISTRADO"`

### Requirement: Inicio de sesión
`POST /api/v1/auth/login` SHALL responder `200` con `{ comprador, token }` cuando el correo y la contraseña coinciden. Cualquier fallo responde `401 NO_AUTENTICADO` sin indicar qué dato falló.

#### Scenario: Ruta de comprador sin token
- **WHEN** se llama a `POST /reservas` sin `Authorization`
- **THEN** la respuesta es `401` con `error.codigo = "NO_AUTENTICADO"`

#### Scenario: Credenciales incorrectas
- **WHEN** el correo existe pero la contraseña no coincide
- **THEN** la respuesta es `401` con el mismo mensaje que si el correo no existiera

### Requirement: Sitios sin cuenta
Los sitios con `RequiereComprador = 0` (`web_2`) SHALL poder reservar, pagar y consultar sus reservas y órdenes sin token. Las reservas se identifican por su `id` UUID v4 y solo son accesibles desde el mismo sitio. El servicio NUNCA SHALL exigir login a `web_2` (P15).

#### Scenario: Compra de web_2
- **WHEN** `web_2` aparta y paga sin `Authorization`
- **THEN** la operación se acepta y la orden queda asociada al sitio `web_2`

#### Scenario: Compra de web_2 sin token
- **WHEN** `web_2` aparta y paga sin `Authorization`
- **THEN** la operación se acepta y la orden queda con `sitio = web_2` y sin comprador
