# web1-compra-entradas

## Purpose

Sitio del Teatro «Aquí nadie actúa normal» (`citas_web_1`): cartelera, selección de asientos, reserva de 5 minutos, pago simulado, confirmación con boleto y cuenta del comprador. Fuente: `citas_web_1/docs/ESPECIFICACION.md`, `citas_web_1/docs/DEFINICION.md`, `citas_web_1/TODOLIST.md`, `citas_web_1/AGENTS.md` y el código de `citas_web_1/app/`.

**Estado general: implementado y validado en modo demo.** La SPA vanilla (HTML5, CSS3 y JavaScript sin dependencias) está completa en `app/`. El modo `api` existe, pero `citas_service` todavía no tiene las rutas que consume, así que en modo `auto` la app cae a demo. Los pendientes de terceros están en su `TODOLIST.md`.

## Requirements

### Requirement: Rutas de la SPA
La aplicación SHALL navegar con `location.hash` y exponer estas rutas:

| Ruta | Vista | Acceso |
| --- | --- | --- |
| `#/` | Inicio | Público |
| `#/cartelera` | Calendario, horarios y mapa | Público |
| `#/checkout/:reservaId` | Resumen, cuenta regresiva y pago | Requiere sesión |
| `#/orden/:ordenId` | Boletos y QR | Requiere sesión |
| `#/cuenta` | Reservas y compras | Requiere sesión |
| Otra | No encontrada, con salida a cartelera | Público |

**Estado:** implementado.

#### Scenario: Acceso sin sesión a checkout
- **WHEN** un visitante sin sesión abre `#/checkout/...`
- **THEN** se abre el diálogo de autenticación y, tras entrar, se retoma la acción

### Requirement: Calendario y horarios
La cartelera SHALL mostrar octubre, noviembre y diciembre de 2026, con funciones los jueves, viernes y sábados a las 15:00, 19:00 y 21:00 (hora de CDMX, `-06:00`, D13). Cada función SHALL mostrar sus asientos disponibles sobre 120 (filas A–L, 10 por fila).

**Estado:** implementado.

#### Scenario: Función de sábado
- **WHEN** el visitante abre un sábado
- **THEN** ve las funciones de 15:00, 19:00 y 21:00

### Requirement: Mapa de asientos y límite
El mapa SHALL mostrar los estados **disponible**, **seleccionado**, **apartado** y **comprado**, con color, borde y texto (no solo color). La selección SHALL limitarse a 10 asientos por persona y función, sumando reservas vigentes y boletos (RF11, RN04). El total SHALL calcularse por zona: Preferente $800, General $500, Balcón $300 MXN.

**Estado:** implementado. El límite se valida en la interfaz; el servicio lo volverá a validar (`422`).

#### Scenario: Límite de selección
- **WHEN** el visitante ya seleccionó 10 asientos y toca otro
- **THEN** la selección no crece y se muestra el aviso del límite

#### Scenario: Total
- **WHEN** se seleccionan `A1` y `A4`, ambos Preferente
- **THEN** el total es $1,600

### Requirement: Reserva de cinco minutos
Al continuar, la reserva SHALL durar 300 segundos. El checkout SHALL mostrar una cuenta regresiva anunciada por accesibilidad. Al vencer, los asientos vuelven a estar disponibles y el pago se bloquea con un mensaje claro (CA04).

Salir de la selección o cambiar de función descarta la selección local sin crear reserva.

**Estado:** implementado en modo demo. En modo `api` depende de `POST /reservas`, todavía no disponible en el servicio.

#### Scenario: Vencimiento en checkout
- **WHEN** la cuenta regresiva llega a cero
- **THEN** el botón de pago se deshabilita y se muestra el aviso de expiración

### Requirement: Pago simulado
El checkout SHALL capturar número de tarjeta, titular, vencimiento y CVV. Tarjeta `4242 4242 4242 4242` aprueba; `4000 0000 0000 0002` rechaza; cualquier otra se marca como inválida para la demo (D14). La interfaz SHALL indicar siempre que el pago es simulado y que no hay cargos reales.

Un rechazo NO SHALL consumir la reserva: el comprador puede reintentar mientras quede tiempo (CA05).

**Estado:** implementado en modo demo.

#### Scenario: Rechazo y reintento
- **WHEN** el comprador paga con `4000 0000 0000 0002` y luego con `4242 4242 4242 4242`
- **THEN** el primer intento se rechaza, el segundo se aprueba y se crea una sola orden

### Requirement: Confirmación de compra
Una compra aprobada SHALL mostrar el folio de la orden (`ORD-000001`, mínimo 6 dígitos) y un boleto por asiento. Cada boleto incluye código de 12 caracteres `[A-Z2-9]`, zona, fila, butaca, precio y QR (CA06). Si el QR no se puede dibujar, se muestra un respaldo visual y el código textual sigue disponible. La página permite imprimir, copiar códigos, ir a la cuenta o comprar otra función.

**Estado:** implementado. El formato de folio y código coincide con la propuesta del backend (QB4).

#### Scenario: Respaldo del QR
- **WHEN** la librería del QR no carga
- **THEN** se muestra el respaldo visual y el código de 12 caracteres sigue visible

### Requirement: Cuenta del comprador
La cuenta SHALL mostrar nombre, correo, número de reservas activas, compras y boletos; las reservas activas con su tiempo restante y enlace al checkout; y las compras con folio, función, butacas, fecha, total y enlace a los boletos (CA07).

**Estado:** implementado en modo demo.

### Requirement: Autenticación
El sitio SHALL permitir registro, inicio y cierre de sesión. En demo, la autenticación es local; el modo API usa `POST /auth/registro` y `POST /auth/login` con Bearer.

**Estado:** demo implementada; modo API pendiente de las rutas de autenticación del servicio (P5, no respondido por web_1).

#### Scenario: Cuenta demo
- **WHEN** se abre el formulario de inicio de sesión
- **THEN** la cuenta demo visible permite entrar sin registrarse

### Requirement: Integración con la API
La configuración SHALL estar en `app/config.js` y poder sobrescribirse con `window.CITAS_CONFIG`:

| Clave | Valor por defecto |
| --- | --- |
| `apiBaseUrl` | `http://localhost:3000/api/v1` |
| `sitio` | `web_1` |
| `modo` | `auto` (`auto`, `demo` o `api`) |
| `tiempoEsperaMs` | `2200` |
| `respaldoDemoAutomatico` | `true` |
| `maxAsientos` | `10` |
| `duracionReservaSegundos` | `300` |

Cada petición SHALL enviar `Accept: application/json` y `X-Sitio`. Las rutas autenticadas SHALL enviar `Authorization: Bearer`. Los errores de red o de tiempo de espera SHALL mostrarse como avisos y, en modo `auto`, activar el respaldo demo.

**Estado:** implementado. Las rutas que consume (`/eventos`, `/funciones/{id}/asientos`, `/reservas`, `/reservas/{id}/pago`, `/ordenes`, `/auth/*`) aún no existen en el servicio.

#### Scenario: Servicio apagado
- **WHEN** `citas_service` no responde
- **THEN** la app sigue funcionando en modo demo y avisa de ello

### Requirement: Datos de demostración
Los datos demo SHALL persistir en `localStorage` bajo la clave `citas_web_1.demo.v1` (versión 2), con respaldo en memoria si el almacenamiento falla. Hay un botón **Reiniciar demo** que borra usuarios, reservas, pagos y compras locales.

**Estado:** implementado.

### Requirement: Accesibilidad y responsividad
La interfaz SHALL usar HTML semántico, salto al contenido, `aria-live`, foco visible, diálogos con atrapado de foco y cierre con `Escape`, y respetar `prefers-reduced-motion`. Debe ser usable desde 320 px y sin desplazamiento horizontal a 390 px (CA09).

**Estado:** implementado y revisado en escritorio y móvil según el `TODOLIST.md`.

## Criterios de aceptación

| ID | Criterio | Estado |
| --- | --- | --- |
| CA01 | La app carga y navega sin backend | Cumple |
| CA02 | Cartelera con fechas, horarios y aforo | Cumple |
| CA03 | Hasta 10 asientos y total visible | Cumple |
| CA04 | Reserva de 5 minutos que vence | Cumple en demo |
| CA05 | Un rechazo permite reintentar | Cumple en demo |
| CA06 | Aprobación genera orden, boletos y QR | Cumple en demo |
| CA07 | Cuenta con reservas y compras | Cumple en demo |
| CA08 | Modo API activable por configuración | Cumple; sin servicio operativo |
| CA09 | Responsiva y accesible | Cumple |
| CA10 | Datos demo respetan el contrato | Cumple |

## Pendientes y discrepancias

- La especificación de web_1 dice que la zona horaria es `-06:00` «a falta de confirmación». D13 ya la acordó: la sección 8 debe actualizarse.
- Pendientes de web_1 en `ACUERDOS.md`: P5 (cuentas), P9 (rechazo parcial), PR1, PR3, PR4, PR5, PR7, PR8 y PR9.
- `citas_web_1/AGENTS.md` tiene un encabezado heredado («Proyecto Conversaciones») que no corresponde a este sitio. Conviene corregirlo.
- Las pruebas automáticas (`npm test`, 10 pruebas en `tests/domain.test.js`) cubren la lógica de dominio. No hay pruebas de la integración con la API.
