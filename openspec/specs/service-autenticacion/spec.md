# service-autenticacion

## Purpose

Registro e inicio de sesión de compradores de `citas_service`. Fuente: `citas_service/docs/specs/ACUERDOS.md` (P5, E3 del backend), `citas_service/docs/specs/openapi.yaml` (tag Autenticación, `/auth/registro`, `/auth/login`), `citas_backend/docs/BCK_ANTEPROYECTO.md` (E3) y `citas_service/TODOLIST.md` (etapa 5).

**Estado general: pendiente en su totalidad.** No hay código de autenticación en `citas_service/app`, ni rutas `/auth/*`. La decisión P5 sigue abierta: falta la respuesta de `citas_web_1`. `citas_web_2` no usa cuentas.

## Requirements

### Requirement: Dueño de la autenticación
El servicio SHALL emitir y validar los tokens de los compradores. La base de datos SHALL guardar al comprador (nombre, correo único y hash de la contraseña), y el hash SHALL calcularlo el servicio, no la base de datos (propuesta E3 del backend).

**Estado:** pendiente de confirmar por `citas_web_1` (P5).

#### Scenario: Hash en el servicio
- **WHEN** se registra un comprador
- **THEN** la base de datos recibe el hash y nunca la contraseña en texto plano

### Requirement: Registro de comprador
El servicio SHALL crear un comprador en `POST /auth/registro`. Si el correo ya existe, la respuesta es `409 CORREO_REGISTRADO` (código 51002 del backend). Si faltan datos, la respuesta es `422` (error 53008 del backend, «Datos del comprador incompletos»; el código de API queda por confirmar).

**Estado:** pendiente.

#### Scenario: Correo repetido
- **WHEN** se registra un correo que ya existe
- **THEN** la respuesta es `409` con `error.codigo = "CORREO_REGISTRADO"`

### Requirement: Inicio de sesión
El servicio SHALL autenticar en `POST /auth/login` y devolver un token Bearer. Las rutas de comprador SHALL exigir ese token; si falta o no es válido, la respuesta es `401 NO_AUTENTICADO`.

**Estado:** pendiente.

#### Scenario: Ruta de comprador sin token
- **WHEN** se llama a `POST /reservas` sin `Authorization`
- **THEN** la respuesta es `401` con `error.codigo = "NO_AUTENTICADO"`

### Requirement: Sitios sin cuenta
El servicio SHALL permitir a `citas_web_2` comprar sin registro de comprador (P15). Para eso, las reservas y órdenes de un sitio sin cuenta usan un comprador «invitado» por sitio o se admiten nulos en el comprador (decisión pendiente de `citas_backend`). En ningún caso el sitio sin cuenta SHALL requerir login.

**Estado:** pendiente de decisión entre backend y web_2.

#### Scenario: Compra de web_2
- **WHEN** web_2 aparta y paga sin token
- **THEN** la operación se acepta y la orden queda asociada al sitio `web_2`

## Discrepancias

- `citas_web_1` tiene su propia autenticación simulada con datos locales (`localStorage`). Cuando el servicio tenga cuentas, esa lógica debe reemplazarse por el adaptador real, pero la cuenta de demostración debe seguir existiendo.
- El código `CORREO_REGISTRADO` no aparece en la tabla de errores de `ESPECIFICACION.md` §4; hay que agregarlo.
