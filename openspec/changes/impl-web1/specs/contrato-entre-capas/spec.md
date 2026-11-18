## ADDED Requirements

### Requirement: Topología y responsabilidades por capa
Las cuatro capas SHALL ejecutarse en una sola máquina local (D12). Cada capa tiene una única responsabilidad:

- `citas_backend` (SQL Server 2019 o superior, base de datos `CitasBD`): guarda datos y ejecuta reglas de concurrencia mediante procedimientos almacenados.
- `citas_service` (Node.js 20 + Express, `http://localhost:3000`): única puerta de entrada de los sitios; traduce HTTP a procedimientos almacenados y aplica la regla de 5 minutos.
- `citas_web_1` (`http://localhost:5501`) y `citas_web_2` (`http://localhost:5502`): interfaces HTTP estáticas que consumen únicamente la API del servicio.

Ninguna capa SHALL comunicarse con otra por un medio distinto de los descritos aquí. Los sitios NUNCA SHALL conectarse a la base de datos ni entre sí. El servicio NUNCA SHALL ejecutar `SELECT`, `INSERT`, `UPDATE` ni `DELETE` directos (D4).

#### Scenario: Un sitio necesita datos de una reserva
- **WHEN** `citas_web_1` necesita el estado de una reserva
- **THEN** llama a `GET /api/v1/reservas/{reservaId}` en `citas_service`, y ese servicio ejecuta `spReservas_Obtener` en la base de datos

#### Scenario: Consulta directa desde un sitio
- **WHEN** un sitio intenta conectarse a `CitasBD` o al puerto de SQL Server
- **THEN** la arquitectura lo considera incumplimiento de este contrato

### Requirement: Base de la API y versión del contrato
Todas las rutas de negocio SHALL estar bajo `http://localhost:3000/api/v1`. El contrato de este change se identifica como `1.0.0` y SHALL reflejarse en `info.version` de `openapi.yaml`. Un cambio incompatible SHALL publicarse como `/api/v2` o como un change nuevo que incremente la versión mayor; los consumidores no SHALL depender de campos no documentados.

#### Scenario: Ruta sin versión
- **WHEN** un cliente llama a `GET http://localhost:3000/eventos`
- **THEN** la respuesta es `404 NO_ENCONTRADO`

### Requirement: Puertos y orígenes permitidos
El servicio SHALL escuchar en `3000` (variable `PORT`) y aceptar CORS solo desde `http://localhost:5501`, `http://127.0.0.1:5501`, `http://localhost:5502` y `http://127.0.0.1:5502` (variable `CORS_ORIGINS`). Los sitios SHALL usar la URL base de la API desde su configuración local, nunca escrita en el código.

#### Scenario: Origen no listado
- **WHEN** una petición llega desde `http://localhost:8080`
- **THEN** la respuesta no incluye `Access-Control-Allow-Origin` para ese origen

### Requirement: Identificación del sitio en cada petición
Toda petición a `/api/v1` SHALL incluir el encabezado `X-Sitio` con uno de los valores `web_1` o `web_2`. El servicio SHALL usar ese valor para filtrar el catálogo, aplicar las reglas del sitio y registrar el origen de cada reserva y orden. Si falta o no es válido, la respuesta es `400 SOLICITUD_INVALIDA` con `detalles.campo = "X-Sitio"`.

#### Scenario: Catálogo filtrado por sitio
- **WHEN** `web_2` llama a `GET /api/v1/eventos` con `X-Sitio: web_2`
- **THEN** la respuesta solo incluye eventos con `sitio = "web_2"`

#### Scenario: Sitio desconocido
- **WHEN** la petición trae `X-Sitio: web_3`
- **THEN** la respuesta es `400` con `error.detalles.campo = "X-Sitio"`

### Requirement: Reglas de identidad por sitio
Cada sitio tiene una bandera `RequiereComprador` en la base de datos (P15):

- `web_1` tiene `RequiereComprador = 1`. Las operaciones de comprador (crear reserva, listar sus reservas, pagar, listar sus órdenes) SHALL exigir `Authorization: Bearer <token>`. Sin token válido, la respuesta es `401 NO_AUTENTICADO`.
- `web_2` tiene `RequiereComprador = 0`. Esas mismas operaciones SHALL aceptarse sin token. La reserva creada SHALL identificarse solo por su `id` (UUID v4, no adivinable), y las operaciones sobre una reserva existente (consultar, liberar, pagar) SHALL exigir que el `id` pertenezca al sitio de `X-Sitio`.

El límite de 10 asientos (RN04) y la regla de propiedad de la reserva (RN09) SHALL aplicar solo a sitios con `RequiereComprador = 1`.

#### Scenario: web_1 sin token
- **WHEN** `web_1` llama a `POST /api/v1/reservas` sin `Authorization`
- **THEN** la respuesta es `401` con `error.codigo = "NO_AUTENTICADO"`

#### Scenario: web_2 sin token
- **WHEN** `web_2` llama a `POST /api/v1/reservas` sin `Authorization`
- **THEN** la reserva se crea sin comprador identificado y la respuesta es `201`

#### Scenario: Reserva de web_2 consultada desde web_1
- **WHEN** `web_1` consulta el `id` de una reserva creada por `web_2`
- **THEN** la respuesta es `404 NO_ENCONTRADO`

### Requirement: Autenticación de compradores
El servicio SHALL emitir un token JWT firmado con HS256, con `sub` igual al `id` del comprador y expiración de 8 horas. El secreto SHALL venir de la variable `JWT_SECRET` y NUNCA SHALL estar en el código ni en el repositorio. La contraseña SHALL guardarse como hash calculado en el servicio con `crypto.scrypt` (sal aleatoria por comprador); la base de datos solo guarda el hash (E3).

Endpoints:

| Método | Ruta | Cuerpo | Respuesta |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/registro` | `{ nombre, correo, contrasena }` | `201` con `{ comprador: { id, nombre, correo }, token }` |
| POST | `/api/v1/auth/login` | `{ correo, contrasena }` | `200` con `{ comprador: { id, nombre, correo }, token }` |

Errores: correo ya registrado → `409 CORREO_REGISTRADO`; campos faltantes o inválidos → `400 SOLICITUD_INVALIDA`; correo o contraseña incorrectos → `401 NO_AUTENTICADO` (sin indicar cuál dato falló).

#### Scenario: Registro duplicado
- **WHEN** se registra un correo que ya existe
- **THEN** la respuesta es `409` con `error.codigo = "CORREO_REGISTRADO"`

#### Scenario: Credenciales incorrectas
- **WHEN** el correo existe pero la contraseña no coincide
- **THEN** la respuesta es `401 NO_AUTENTICADO` con el mismo mensaje que si el correo no existiera

### Requirement: Catálogo de rutas v1
El servicio SHALL exponer exactamente estas rutas. Cualquier otra ruta bajo `/api/v1` responde `404`.

| Método | Ruta | Comprador | Descripción |
| --- | --- | --- | --- |
| GET | `/api/v1/salud` | No | Estado del servicio y de la base de datos |
| GET | `/api/v1/eventos` | No | Eventos del sitio (`X-Sitio`) |
| GET | `/api/v1/eventos/{eventoId}` | No | Detalle de un evento |
| GET | `/api/v1/eventos/{eventoId}/funciones` | No | Funciones activas ordenadas por `inicio` |
| GET | `/api/v1/funciones/{funcionId}` | No | Función con sus zonas y precios |
| GET | `/api/v1/funciones/{funcionId}/asientos` | No | Asientos con `estado` calculado en el servidor |
| POST | `/api/v1/reservas` | Según sitio | Apartar asientos (5 minutos) |
| GET | `/api/v1/reservas/{reservaId}` | Según sitio | Consultar reserva |
| GET | `/api/v1/reservas` | Sí (web_1) | Reservas activas del comprador (`?estado=activa`) |
| DELETE | `/api/v1/reservas/{reservaId}` | Según sitio | Liberar reserva |
| POST | `/api/v1/reservas/{reservaId}/pago` | Según sitio | Pago simulado |
| GET | `/api/v1/ordenes` | Sí (web_1) | Órdenes del comprador |
| GET | `/api/v1/ordenes/{ordenId}` | Según sitio | Orden con boletos |
| GET | `/api/v1/ordenes/buscar?folio=ORD-000123` o `?codigo=ABC...` | No | Recuperar compra sin cuenta (P17) |
| GET | `/api/v1/reportes/reservas-por-dia?desde=AAAA-MM-DD&hasta=AAAA-MM-DD` | No | Conteo de reservas por día (P18) |
| POST | `/api/v1/auth/registro` | No | Alta de comprador |
| POST | `/api/v1/auth/login` | No | Inicio de sesión |

«Según sitio» significa obligatorio para `web_1` y no aplicable a `web_2`, de acuerdo con la regla de identidad por sitio.

#### Scenario: Ruta fuera del catálogo
- **WHEN** un sitio llama a `DELETE /api/v1/eventos/evt-suegra`
- **THEN** la respuesta es `404 NO_ENCONTRADO`

### Requirement: Formas de datos
Los cuerpos de respuesta SHALL usar estas formas. Los campos marcados `?` son opcionales y se omiten cuando no aplican; no se devuelven como `null`.

- **Evento**: `{ id, sitio, nombre, recinto?, descripcion? }`
- **Función**: `{ id, eventoId, inicio, formato?, idioma?, clasificacion?, duracionMinutos?, zonas: [{ id, nombre, precio, moneda }] }`
- **Asiento**: `{ id, zonaId, fila, numero, etiqueta, precio, estado }`, con `estado` ∈ `disponible`, `apartado`, `comprado`
- **Reserva**: `{ id, sitio, funcionId, estado, asientos: [{ asientoId, etiqueta, zonaId, precio }], total, moneda, creadaEn, expiraEn, segundosRestantes, ordenId? }`, con `estado` ∈ `activa`, `vencida`, `liberada`, `pagada`
- **Orden**: `{ id, folio, reservaId, sitio, fecha, total, moneda, boletos: [{ codigo, etiqueta, zonaId, precio, eventoNombre, inicio }] }`
- **Pago**: `{ resultado: "aprobado" | "rechazado", simulado: true, reserva, orden? }`

Las fechas SHALL enviarse en ISO 8601 con desplazamiento `-06:00` (ver Requirement de zona horaria).

#### Scenario: Pago aprobado
- **WHEN** el pago se aprueba
- **THEN** la respuesta incluye `orden` con `folio` y `boletos`, y `reserva.estado = "pagada"`

#### Scenario: Pago rechazado
- **WHEN** el pago se rechaza
- **THEN** la respuesta no incluye `orden` y `reserva.estado` sigue `"activa"`

### Requirement: Estado del asiento
El estado de cada asiento SHALL calcularse en la consulta con la hora del servidor, con esta regla y en este orden:

1. Si el asiento tiene boleto → `comprado`.
2. Si tiene una reserva `activa` con `expiraEn > ahora` → `apartado`.
3. En cualquier otro caso → `disponible`.

La comparación es estricta: en `ahora = expiraEn` el asiento está `disponible`. La respuesta NO SHALL revelar quién aparta o compra.

#### Scenario: Asiento en el instante de vencimiento
- **WHEN** una reserva tiene `expiraEn = T0 + 300 s` y se consulta en `T0 + 300 s`
- **THEN** el asiento aparece `disponible`

### Requirement: Reserva de asientos
`POST /api/v1/reservas` SHALL recibir `{ funcionId, asientoIds[] }` y seguir este orden:

1. Formato: entre 1 y 10 asientos sin repetidos → `400 SOLICITUD_INVALIDA`.
2. Identidad según sitio → `401 NO_AUTENTICADO` cuando aplique.
3. Existencia de función y asientos → `404 NO_ENCONTRADO`. Asientos de funciones distintas → `400 SOLICITUD_INVALIDA`.
4. Límite (solo `web_1`): asientos comprados + asientos en reservas vigentes + solicitados ≤ 10 → `422 LIMITE_EXCEDIDO` con `detalles: { maximo: 10, actuales, solicitados }`.
5. Disponibilidad → `409 ASIENTO_NO_DISPONIBLE` con `detalles.asientoIds` con todos los asientos en conflicto. Ninguno queda apartado (RF05 de web_2, P9).
6. Creación → `201` con `Location: /api/v1/reservas/{id}`.

`expiraEn = creadaEn + 300 s`, calculado por el servicio con su reloj. El precio de cada asiento se toma de la zona en la función al apartar y no cambia durante la vigencia. `total` es la suma de esos precios. La operación es atómica.

#### Scenario: Límite en web_1
- **WHEN** un comprador de `web_1` con 9 asientos en `F1` pide 2 más
- **THEN** la respuesta es `422` con `detalles.actuales = 9` y `detalles.solicitados = 2`

#### Scenario: Conflicto parcial
- **WHEN** `A7` está disponible y `A8` está apartado, y se piden ambos
- **THEN** la respuesta es `409` con `detalles.asientoIds = ["A8"]` y `A7` sigue `disponible`

### Requirement: Liberar reserva
`DELETE /api/v1/reservas/{reservaId}` SHALL aplicar estas reglas:

- Reserva `activa` y vigente → `204` sin cuerpo; sus asientos vuelven a `disponible`.
- Reserva `activa` con `expiraEn <= ahora` (vencida) → `410 RESERVA_VENCIDA`. **Decisión de este contrato:** no se libera; la regla de la especificación (CA-17) prevalece sobre la implementación en memoria, que debe corregirse.
- Reserva `pagada` → `409 RESERVA_PAGADA`.
- Reserva ya `liberada` → `410 RESERVA_LIBERADA`.
- Reserva inexistente o de otro sitio/comprador → `404 NO_ENCONTRADO`.

#### Scenario: Liberar una reserva vencida
- **WHEN** el comprador libera una reserva cuyo `expiraEn` ya pasó
- **THEN** la respuesta es `410 RESERVA_VENCIDA` y el estado de la reserva sigue siendo vencido

### Requirement: Pago simulado
`POST /api/v1/reservas/{reservaId}/pago` SHALL aceptar `{ numeroTarjeta, titular, vencimiento, cvv }` y solo dos números de prueba:

- `4242 4242 4242 4242` → aprobado.
- `4000 0000 0000 0002` → rechazado.
- Otro número → `400 SOLICITUD_INVALIDA` con `detalles.campo = "numeroTarjeta"`; no se registra intento.

Además: `titular` no vacío; `vencimiento` en formato `MM/AA` y no vencido; `cvv` de 3 dígitos. Un error de formato → `400` con `detalles.campo`; no se registra intento.

Resultados:

- Reserva `activa` y vigente + aprobada → `201`; en una sola operación atómica: intento aprobado, reserva `pagada`, orden con folio `ORD-` + 6 dígitos, boletos con código de 12 caracteres `[A-Z2-9]`, y asientos `comprado`.
- Reserva `activa` y vigente + rechazada → `201` con `resultado = "rechazado"`; se registra el intento; `expiraEn` NO cambia (RN06).
- Reserva vencida → `410 RESERVA_VENCIDA`, sin cobro ni orden.
- Reserva `pagada` → `409 RESERVA_PAGADA`.
- Reserva `liberada` → `410 RESERVA_LIBERADA`.

Sobre el almacenamiento: el servicio NUNCA SHALL guardar el número completo ni el CVV. El intento guarda solo los últimos 4 dígitos (`UltimosDigitos`, P19).

#### Scenario: Tarjeta de prueba inválida
- **WHEN** se envía `numeroTarjeta = "5555 5555 5555 4444"`
- **THEN** la respuesta es `400` con `detalles.campo = "numeroTarjeta"` y no existe intento registrado

#### Scenario: Pago doble
- **WHEN** se paga una reserva ya `pagada`
- **THEN** la respuesta es `409 RESERVA_PAGADA` y existe una sola orden

### Requirement: Recuperar compra sin cuenta
`GET /api/v1/ordenes/buscar` SHALL devolver la orden cuando se envía exactamente uno de `folio` o `codigo`, y SHALL filtrar por el sitio de `X-Sitio`. Si no se envía ninguno o se envían los dos → `400 SOLICITUD_INVALIDA`. Si no existe o pertenece a otro sitio → `404 NO_ENCONTRADO` (P17).

#### Scenario: Búsqueda por folio
- **WHEN** `web_2` busca `folio=ORD-000123` y la orden es suya
- **THEN** la respuesta es `200` con la orden y sus boletos

### Requirement: Conteo diario de reservas
`GET /api/v1/reportes/reservas-por-dia` SHALL devolver, por día calendario en `America/Mexico_City`, el número de reservas creadas en el rango, sin importar su estado final y sin desglose por sala. Solo se acepta `X-Sitio` que corresponda al sitio consultado. El rango máximo es de 92 días; más de eso → `400 SOLICITUD_INVALIDA` (P18).

#### Scenario: Día con reservas vencidas y liberadas
- **WHEN** un día tiene 5 reservas, de las cuales 2 vencieron y 1 se liberó
- **THEN** el conteo de ese día es 5

### Requirement: Mapeo de errores
Todo error SHALL usar el cuerpo `{ "error": { "codigo", "mensaje", "detalles"? } }`. El `mensaje` SHALL estar en español y no incluir datos de otro comprador ni trazas. El servicio SHALL traducir los `THROW` de la base de datos por rango (D10) con esta tabla exacta:

| Código de base de datos | HTTP | `codigo` de API |
| --- | --- | --- |
| 51001 | 409 | `ASIENTO_NO_DISPONIBLE` |
| 51002 | 409 | `CORREO_REGISTRADO` |
| 51003 | 409 | `RESERVA_PAGADA` |
| 52001 | 410 | `RESERVA_VENCIDA` |
| 52002 | 410 | `RESERVA_LIBERADA` |
| 53001 | 422 | `LIMITE_EXCEDIDO` |
| 53002, 53003, 53008 | 400 | `SOLICITUD_INVALIDA` |
| 53004 | 500 | `ERROR_INTERNO` |
| 53005, 53006, 53007 | 400 | `SOLICITUD_INVALIDA` |
| 54001–54005 | 404 | `NO_ENCONTRADO` |
| 50000 o no mapeado | 500 | `ERROR_INTERNO` |

Errores de validación del propio servicio (cuerpo, `X-Sitio`, JSON) usan `400 SOLICITUD_INVALIDA`. Las respuestas de `401` no revelan si el correo existe.

#### Scenario: Error no previsto
- **WHEN** falla la base de datos con un código no listado
- **THEN** la respuesta es `500 ERROR_INTERNO` sin detalles de la base de datos

### Requirement: Fechas y zona horaria
La base de datos SHALL guardar fechas en UTC. El servicio SHALL convertir horarios de funciones y vencimientos a `America/Mexico_City` (UTC−6 todo el año) y enviarlos con desplazamiento explícito, por ejemplo `2026-11-12T19:00:00-06:00` (D13). Los procedimientos reciben `@Ahora` y `@ExpiraEn` calculados por el servicio; la base de datos NO SHALL usar `SYSDATETIME()` para decidir vencimientos.

#### Scenario: Función de 19:00
- **WHEN** se consulta una función a las 19:00 de CDMX
- **THEN** `inicio` termina en `-06:00`

### Requirement: Semilla de datos acordada
La base de datos SHALL cargar estos datos iniciales. El servicio en memoria SHALL usar la misma semilla.

**Sitio `web_1`** (`RequiereComprador = 1`, `moneda = MXN`):

- 1 evento «¡Que no se entere la suegra!», recinto «Teatro Aquí nadie actúa normal».
- 3 zonas: Preferente (filas A–C, $800), General (filas D–I, $500), Balcón (filas J–L, $300).
- 120 asientos: filas A–L, números 1–10.
- 120 funciones: jueves, viernes y sábados del 1 de octubre al 31 de diciembre de 2026, a las 15:00, 19:00 y 21:00 hora de CDMX (40 días × 3 = 120).
- 360 precios: una fila por zona y función.

**Sitio `web_2`** (`RequiereComprador = 0`, `moneda = MXN`):

- 1 evento «Spider-Man».
- 10 zonas que representan las salas: «Sala 1» a «Sala 10», cada una con capacidad 80.
- 80 asientos por sala: filas A–H, números 1–10 (800 en total).
- Formato: salas 1–5 son 2D y salas 6–10 son 3D.
- Precio por butaca: 2D $100, 3D $150 (en cada función de esa sala).
- 30 funciones por día, para cada sala tres horarios en hora de CDMX: 2D 13:00, 16:00 y 20:00; 3D 12:30, 15:30 y 18:30.
- Horizonte de la semilla: del 19 de noviembre al 18 de diciembre de 2026 (30 días; 900 funciones). **Decisión de este contrato**: se puede ampliar sin cambiar el contrato.
- `idioma` y `clasificacion` se cargan con el texto `Por confirmar` hasta que el cineclub los entregue.

#### Scenario: Conteo de funciones de web_1
- **WHEN** termina la carga de datos iniciales
- **THEN** existen 120 funciones del evento de `web_1`

### Requirement: Cambios de este contrato
Cualquier cambio en rutas, formas de datos o códigos de error SHALL hacerse con un nuevo change de OpenSpec que actualice este requisito y que `openapi.yaml`. Los equipos NO SHALL acordar cambios por chat ni por archivos de otros equipos; las preguntas abiertas de `ACUERDOS.md` quedan resueltas por este contrato y se registran como tales.

#### Scenario: Equipo necesita un campo nuevo
- **WHEN** `citas_web_1` necesita un campo que no existe en la forma de Reserva
- **THEN** abre un change que modifica este requisito; no lo agrega en su código
