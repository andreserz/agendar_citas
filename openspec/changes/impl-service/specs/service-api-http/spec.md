## ADDED Requirements

### Requirement: Rutas montadas según el contrato
El servicio SHALL montar en `app/` exactamente las rutas de la tabla «Catálogo de rutas v1» del contrato compartido, bajo el router `/api/v1`. Las rutas SHALL implementarse después de existir en `openapi.yaml` (AGENTS.md del servicio, §2).

#### Scenario: Ruta documentada
- **WHEN** se ejecuta `GET /api/v1/funciones/{funcionId}/asientos`
- **THEN** la respuesta sigue la forma de «Asiento» del contrato

### Requirement: Validación de X-Sitio
Un middleware SHALL validar el encabezado `X-Sitio` antes de cualquier ruta de `/api/v1`, excepto `GET /api/v1/salud`. Si falta o no está en {`web_1`, `web_2`}, responde `400 SOLICITUD_INVALIDA` con `detalles.campo = "X-Sitio"`. El valor validado SHALL quedar disponible para los controladores.

#### Scenario: Salud sin sitio
- **WHEN** se llama a `GET /api/v1/salud` sin `X-Sitio`
- **THEN** la respuesta es `200` con `{ "estado": "ok", "repositorio": "memoria" | "sql" }`

### Requirement: Validación de cuerpos
Cada ruta con cuerpo SHALL validar sus campos antes de llamar al repositorio. Un campo faltante o con tipo incorrecto responde `400 SOLICITUD_INVALIDA` con `detalles.campo`. El JSON mal formado responde `400` sin trazas.

#### Scenario: Asiento repetido
- **WHEN** el cuerpo de `POST /api/v1/reservas` trae `asientoIds: ["A7", "A7"]`
- **THEN** la respuesta es `400` con `detalles.campo = "asientoIds"`

### Requirement: Tiempo inyectable
Todas las operaciones que dependen del tiempo SHALL recibir `ahora` desde un reloj inyectable (`crearReloj(config)`). Las pruebas SHALL usar un reloj fijo; ninguna prueba espera tiempo real (RNF06).

#### Scenario: Prueba de vencimiento
- **WHEN** una prueba avanza el reloj 301 segundos
- **THEN** una reserva creada antes aparece `vencida` sin llamar a ningún temporizador

### Requirement: Traducción de errores al formato del contrato
El manejador de errores SHALL convertir cualquier `ErrorRepositorio` en la respuesta de la tabla de mapeo del contrato. Un código de base de datos no listado responde `500 ERROR_INTERNO` y se registra en log sin datos sensibles.

#### Scenario: Código no mapeado
- **WHEN** el adaptador recibe el código `53999`
- **THEN** la respuesta es `500 ERROR_INTERNO`

### Requirement: Adaptador SQL Server
El servicio SHALL incluir un adaptador `app/repos/sql/` que implemente `AsientosRepo`, `ReservasRepo` y `OrdenesRepo` llamando solo a procedimientos almacenados (D4), mediante el paquete `mssql`. Se selecciona con `REPOSITORIO=sql`; el valor por defecto sigue siendo `memoria`. Las cadenas de conexión SHALL venir de variables de entorno (`SQL_SERVER`, `SQL_DATABASE`, `SQL_USER`, `SQL_PASSWORD`), nunca del código.

#### Scenario: Consulta de asientos
- **WHEN** el adaptador SQL atiende `listarAsientos`
- **THEN** ejecuta `spAsientos_ListarPorFuncion` con `@Ahora` y mapea `Estado` a `disponible`, `apartado` o `comprado`

### Requirement: Espejo en memoria
El repositorio en memoria SHALL implementar las mismas reglas que el adaptador SQL, incluidas las de `RequiereComprador` y la liberación de vencidas, de modo que ambas pasen las mismas pruebas de contrato (`tests/repos/contrato-repos.js`).

#### Scenario: Mismas pruebas en ambos repositorios
- **WHEN** se ejecuta la suite de contrato contra el adaptador SQL y el de memoria
- **THEN** ambas pasan sin cambios en la suite

### Requirement: OpenAPI 1.0.0
`openapi.yaml` SHALL publicarse con `info.version = 1.0.0`, las rutas de la tabla del contrato, el esquema `Error` del contrato, los ejemplos `ORD-000123` y boletos de 12 caracteres, y sin `resultadoSimulado`. `redocly lint` SHALL pasar sin errores.

#### Scenario: Ejemplo de orden
- **WHEN** se revisa el ejemplo de `Orden` en la spec
- **THEN** `folio` tiene el formato `ORD-` + 6 dígitos y los códigos tienen 12 caracteres

### Requirement: Pruebas de contrato
Debe existir una prueba por ruta del contrato que verifique código HTTP, forma de respuesta y `error.codigo` en cada caso de error listado. Las pruebas usan Supertest contra `crearApp`.

#### Scenario: Ruta fuera del contrato
- **WHEN** la prueba llama a una ruta que no existe
- **THEN** la respuesta es `404 NO_ENCONTRADO`
