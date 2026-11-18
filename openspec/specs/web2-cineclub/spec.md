# web2-cineclub

## Purpose

Sitio del cineclub (`citas_web_2`): cartelera de una película, selección de butacas en una sala de 80 numeradas, reserva de 5 minutos, pago simulado, boleto con QR, recuperación por folio y conteo diario de reservas. Fuente: `citas_web_2/docs/DEFINICION.md`, `citas_web_2/docs/ANTEPROYECTO.md`, `citas_web_2/docs/contexto_negocio/` y `citas_web_2/TODOLIST.md`.

**Estado general: solo la Definición en borrador.** `citas_web_2` no tiene carpeta `app/` ni `tests/`, ni Especificación. La Propuesta no está terminada. La Definición está pendiente de validación del equipo y del cliente.

## Requirements

### Requirement: Cartelera y funciones
El sitio SHALL mostrar la cartelera vigente (hoy, *Spider-Man*) con sus funciones por sala, fecha, horario, formato (2D o 3D), idioma, clasificación y precio (RF01). El cineclub opera de lunes a domingo con 10 salas de 80 butacas y 30 funciones diarias de dos horas.

**Estado:** requisito definido. Los campos de sala, formato, idioma, clasificación y duración no existen en el modelo de servicio (P16).

#### Scenario: Funciones del día
- **WHEN** el visitante consulta un día
- **THEN** ve las 30 funciones con su sala, formato, horario y precio

### Requirement: Mapa de butacas
Al elegir una función, el sitio SHALL dibujar las 80 butacas de la sala con su estado: disponible, apartada o vendida (RF02).

**Nota de nombres:** el servicio usa `apartado` y `comprado`. El sitio debe mapear `apartada` → `apartado` y `vendida` → `comprado`.

**Estado:** requisito definido.

#### Scenario: Estados de butaca
- **WHEN** una butaca tiene una reserva vigente de otro visitante
- **THEN** se muestra como apartada

### Requirement: Selección y total
El visitante SHALL poder seleccionar butacas y ver un resumen con las butacas, el precio por butaca y el total (RF03). El precio depende del formato: **2D $100 MXN** en salas 1–5 y **3D $150 MXN** en salas 6–10 (RN03). Todas las butacas de una función cuestan lo mismo.

**Estado:** requisito definido.

#### Scenario: Total en 3D
- **WHEN** se seleccionan 3 butacas en una función 3D
- **THEN** el total es $450 MXN

### Requirement: Rechazo de la selección completa
Si al confirmar alguna butaca ya no está disponible, el sitio SHALL rechazar **toda** la selección, mostrar el mapa actualizado, indicar las butacas en conflicto y pedir una nueva elección (RF05, RN02). No SHALL apartar butacas parciales. Esta política viene de la decisión del cliente y de P9 (`409` del servicio).

**Estado:** requisito definido; depende de P9 (web_1 aún no lo confirma).

#### Scenario: Conflicto al confirmar
- **WHEN** la butaca `F7` fue apartada por otro visitante antes de confirmar
- **THEN** no se aparta ninguna butaca, se muestra el mapa actualizado y se pide elegir de nuevo

### Requirement: Reserva de cinco minutos
Al pasar a pagar, el sitio SHALL solicitar la reserva al servicio, mostrar la cuenta regresiva de 5 minutos y bloquear el pago al vencer (RF04, RN01). El sitio NO SHALL reimplementar la regla: el `expiraEn` lo define el servicio (PR1).

**Estado:** requisito definido.

#### Scenario: Abandono
- **WHEN** el visitante deja la página antes de pagar
- **THEN** las butacas se liberan antes del vencimiento (RF07)

### Requirement: Pago simulado
El pago SHALL ofrecer un resultado exitoso y uno rechazado. Tras un rechazo, el visitante puede reintentar mientras la reserva esté vigente (RF06, RN05 del servicio). El sitio SHALL indicar que el pago es simulado.

**Estado:** requisito definido. Los números de tarjeta de prueba quedan sujetos a D14 (`4242 4242 4242 4242` y `4000 0000 0000 0002`).

### Requirement: Confirmación y boleto con QR
Tras una compra exitosa, el sitio SHALL mostrar el número de orden, el folio y el boleto con su código QR (RF08). El código de boleto lo genera el servicio (RN08, PR7) y el sitio solo lo convierte en QR.

**Estado:** requisito definido.

#### Scenario: Confirmación
- **WHEN** el pago se aprueba
- **THEN** la pantalla muestra el folio `ORD-…` y el QR del boleto

### Requirement: Recuperar boleto sin cuenta
El visitante SHALL poder recuperar su boleto ingresando el folio de la orden (RF09, RN05). El sitio no tiene cuentas, así que el folio es la única forma de volver a ver el boleto.

**Estado:** requisito definido; **depende de P17** (consulta de orden por folio, que el servicio no tiene aún).

#### Scenario: Recuperación por folio
- **WHEN** el visitante ingresa su folio
- **THEN** el sitio consulta la orden y muestra sus boletos

### Requirement: Conteo diario de reservas
El sitio SHALL mostrar al operador del cineclub el conteo de reservas creadas por día calendario en `America/Mexico_City`, sin importar su estado final y sin desglose por sala (RF10, RN06). Esta cifra mide la demanda, no las ventas.

**Estado:** requisito definido; **depende de P18** (procedimiento SP19 del backend o cálculo a partir de SP16 del servicio).

#### Scenario: Conteo del día
- **WHEN** el operador consulta el día
- **THEN** ve el número total de reservas creadas ese día, incluidas las vencidas y las liberadas

### Requirement: Integración y CORS
El sitio SHALL poder configurar la URL de la API, los contextos y la referencia Swagger. Debe ejecutarse en el puerto local `5502`, que el servicio acepta en CORS (RF11, PR8, PR9).

**Estado:** requisito definido.

### Requirement: Compra sin cuenta
El sitio SHALL permitir comprar sin registro, login ni historial, y no tendrá límite de 10 butacas por persona (RN04). El servicio identificará al sitio, no al comprador (PR5, PR4 no aplica).

**Estado:** aceptado con el cliente y documentado en el anteproyecto. Pendiente de confirmación del servicio (P5, P15).

#### Scenario: Compra de invitado
- **WHEN** el visitante paga sin cuenta
- **THEN** la orden queda asociada al sitio `web_2` sin comprador identificado

## Pendientes

| Tema | Referencia | Estado |
| --- | --- | --- |
| Validar la Definición con el equipo y el cliente | `TODOLIST.md` | Pendiente |
| Consulta de orden por folio sin comprador | P17 | Sin respuesta del backend |
| Conteo diario de reservas | P18 | Sin respuesta del backend |
| Columnas de sala, formato, idioma, clasificación y duración | P16 | Sin respuesta del backend |
| Compra sin cuenta en `RequiereComprador` | P15 | Aprobado en el backend; falta confirmar al servicio |
| Confirmar que el servicio acepta órdenes sin comprador | RN05 y RF09 | Pendiente |
| Paleta de marca (primario y acento), tipografías y logotipo | Propuesta | Pendiente |
| Formato del código de boleto | PR7 | Acordado en el servicio (12 caracteres) |
| Propuesta, Especificación, Construcción y Pruebas | `TODOLIST.md` | Pendientes |

## Discrepancias

- El sitio dice que el cineclub tiene 30 funciones diarias, pero la tabla de horarios de `DEFINICION.md` solo lista 3 por formato. Hay que completar la tabla o aclarar que es un resumen.
- El `TODOLIST.md` marca «Definición cerrada», pero la validación del cliente sigue sin confirmar. Está correctamente sin marcar en la lista de tareas; la sección de resumen debe dejar de decir «cerró».
