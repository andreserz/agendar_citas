# Especificación — citas_web_1

Estado: implementada y validada contra los acuerdos disponibles. Este documento describe la interfaz, la integración con `citas_service`, los datos de demostración y los criterios de aceptación usados en la etapa de Pruebas.

## 1. Alcance de la interfaz

SPA responsiva del Teatro “Aquí nadie actúa normal” para la obra **¡Que no se entere la suegra!**. Permite consultar la cartelera, elegir función y asientos, autenticarse, apartar butacas por 5 minutos, pagar de forma simulada y consultar boletos.

No incluye backoffice, cobros reales, envío de correos ni administración de la cartelera. Esos puntos dependen de otros equipos.

## 2. Rutas

| Ruta | Vista | Acceso |
| --- | --- | --- |
| `#/` | Inicio, sinopsis, zonas y accesos | Público |
| `#/cartelera` | Calendario, horarios y mapa de asientos | Público |
| `#/checkout/:reservaId` | Resumen, cuenta regresiva y pago | Requiere sesión |
| `#/orden/:ordenId` | Confirmación, boletos y QR | Requiere sesión |
| `#/cuenta` | Reservas activas e historial de compras | Requiere sesión |
| Cualquier otra | Página no encontrada con salida a cartelera | Público |

La navegación usa `location.hash`; no requiere reescritura del servidor.

## 3. Flujo y estados

### 3.1 Selección

- El calendario cubre octubre, noviembre y diciembre de 2026, con funciones jueves, viernes y sábado a las 15:00, 19:00 y 21:00 (hora de Ciudad de México, `-06:00`).
- Cada función muestra sus asientos disponibles sobre 120 (filas A–L, 10 por fila).
- Estados de asiento: **disponible**, **seleccionado**, **apartado** (reserva vigente de cualquier comprador) y **comprado**.
- La selección se limita a 10 asientos por persona y función, sumando reservas vigentes y boletos ya comprados.
- El total se calcula por zona: Preferente $800, General $500, Balcón $300 (MXN).

### 3.2 Reserva

- Al continuar se exige sesión; si no existe, se abre el diálogo de autenticación y se retoma la acción.
- La reserva dura 300 segundos y muestra una cuenta regresiva visible y anunciada por accesibilidad.
- Al vencer, los asientos vuelven a estar disponibles y el checkout bloquea el pago con un mensaje claro.
- Salir de la selección o cambiar de función descarta la selección local; no crea reserva.

### 3.3 Pago simulado

- Se captura número de tarjeta, titular, vencimiento y CVV.
- Tarjeta aprobada: `4242 4242 4242 4242`. Tarjeta rechazada: `4000 0000 0000 0002`.
- Cualquier otra tarjeta se considera inválida para la demo y se señala en el campo.
- Un rechazo no consume la reserva: se puede reintentar mientras quede tiempo.
- La interfaz identifica siempre el pago como simulado y aclara que no hay cargos reales.

### 3.4 Confirmación

- Una compra aprobada genera una orden con folio `ORD-000001` (mínimo 6 dígitos) y un boleto por asiento.
- Cada boleto incluye código de 12 caracteres `[A-Z2-9]{12}`, zona, fila, butaca, precio y QR.
- La página de orden permite imprimir, copiar códigos, ir a la cuenta o comprar otra función.
- Si el QR no puede dibujarse, se muestra un respaldo visual determinista y el código textual sigue disponible.

### 3.5 Cuenta

- Muestra nombre, correo, número de reservas activas, compras y boletos.
- Lista reservas activas con su tiempo restante y enlace al checkout.
- Lista compras con folio, función, butacas, fecha y total, con enlace a los boletos.

## 4. Integración con `citas_service`

La configuración está en `app/config.js` y se puede sobrescribir con `window.CITAS_CONFIG`.

| Clave | Predeterminado | Uso |
| --- | --- | --- |
| `apiBaseUrl` | `http://localhost:3000/api/v1` | Base del contrato REST |
| `swaggerUrl` | `http://localhost:3000/docs` | Enlace de documentación en el pie |
| `sitio` | `web_1` | Encabezado `X-Sitio` |
| `modo` | `auto` | `auto`, `demo` o `api` |
| `tiempoEsperaMs` | `2200` | Tiempo máximo por petición |
| `respaldoDemoAutomatico` | `true` | Permite caer a demo en modo `auto` |
| `maxAsientos` | `10` | Límite por persona y función |
| `duracionReservaSegundos` | `300` | Vigencia de la reserva |

### 4.1 Endpoints consumidos

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/eventos` | Catálogo y prueba de conexión |
| GET | `/eventos/:id` | Detalle del evento |
| GET | `/eventos/:id/funciones` | Funciones del evento |
| GET | `/funciones/:id` | Detalle de función |
| GET | `/funciones/:id/asientos` | Mapa de asientos |
| POST | `/auth/registro` | Alta de comprador |
| POST | `/auth/login` | Inicio de sesión |
| POST | `/reservas` | Crear reserva autenticada |
| GET | `/reservas/:id` | Consultar reserva |
| GET | `/reservas?estado=activa` | Reservas activas |
| DELETE | `/reservas/:id` | Liberar reserva |
| POST | `/reservas/:id/pago` | Pago simulado |
| GET | `/ordenes` | Compras del comprador |
| GET | `/ordenes/:id` | Detalle de compra |

Todas las peticiones envían `Accept: application/json` y `X-Sitio`. Las rutas autenticadas envían `Authorization: Bearer <token>`. El cliente usa `AbortController` para el tiempo de espera y normaliza errores del contrato.

### 4.2 Forma de los datos

La demo respeta las entidades acordadas:

```jsonc
// Evento
{ "id": "evt-suegra", "sitio": "web_1", "nombre": "¡Que no se entere la suegra!", "recinto": "..." }

// Función
{ "id": "fun-2026-11-12-1900", "eventoId": "evt-suegra", "inicio": "2026-11-12T19:00:00-06:00", "activa": true, "asientosDisponibles": 97 }

// Asiento
{ "id": "A1", "zonaId": "preferente", "fila": "A", "numero": 1, "etiqueta": "A1", "precio": 800, "estado": "disponible" }

// Reserva
{ "id": "res-...", "estado": "activa", "expiraEn": "...", "total": 1600, "moneda": "MXN", "asientos": [{ "asientoId": "A1", "precio": 800 }] }

// Pago aprobado
{ "resultado": "aprobado", "simulado": true, "orden": { "numero": "ORD-000001", "boletos": [{ "codigo": "H32G3S9X2QB9" }] } }
```

Estados de reserva: `activa`, `pagada`, `liberada`, `vencida`. Un pago rechazado devuelve `resultado: "rechazado"` y la reserva serializada.

### 4.3 Errores

El cliente reconoce códigos como `NO_AUTENTICADO`, `NO_ENCONTRADO`, `SOLICITUD_INVALIDA`, `ASIENTO_NO_DISPONIBLE`, `LIMITE_EXCEDIDO`, `RESERVA_VENCIDA`, `RESERVA_PAGADA` y `RESERVA_LIBERADA`. Los errores de red o tiempo de espera se muestran como avisos y, en modo `auto`, activan el respaldo local.

## 5. Datos de demostración

- Persisten en `localStorage` bajo `citas_web_1.demo.v1` con versión 2; si el almacenamiento falla se usa memoria.
- La cuenta demo es `demo@teatro.mx` / `Demo1234!` y se recrea si se borra.
- Los asientos “vendidos” de la semilla son deterministas y dejan libres butacas de prueba (por ejemplo A1).
- Los folios son consecutivos; los códigos de boleto se generan aleatoriamente sin caracteres ambiguos.
- **Reiniciar demo** en el pie elimina usuarios, reservas, pagos y compras locales.

## 6. Accesibilidad y respuesta

- HTML semántico, salto al contenido, `aria-live` para avisos, foco visible y foco programático en el título de cada vista.
- Los estados de asiento combinan color, borde y texto/leyenda; no dependen sólo del color.
- Diálogos con atrapar foco, cierre con `Escape` y retorno de foco.
- `prefers-reduced-motion` desactiva animaciones; existe hoja de impresión para boletos.
- Diseño fluido desde 320 px; sin desplazamiento horizontal en 390 px.

## 7. Criterios de aceptación

| ID | Criterio | Evidencia |
| --- | --- | --- |
| CA01 | La app carga y navega sin backend | Recorrido con `citas_service` apagado |
| CA02 | La cartelera respeta fechas, horarios y aforo | Pruebas de dominio y revisión en navegador |
| CA03 | Se pueden seleccionar hasta 10 asientos y ver el total | Prueba de límite y flujo con A1/A4 ($1,600) |
| CA04 | La reserva dura 5 minutos y vence | Prueba de vigencia; cuenta regresiva en checkout |
| CA05 | Un pago rechazado permite reintentar | Flujo con `4000...0002` y luego `4242...4242` |
| CA06 | Un pago aprobado genera orden, boletos y QR | Orden `ORD-000001`, código de 12 caracteres y QR |
| CA07 | La cuenta muestra reservas y compras | Revisión en escritorio y móvil |
| CA08 | El modo API puede activarse por configuración | Fachada `auto`/`demo`/`api` y diálogo de conexión |
| CA09 | La interfaz es responsiva y accesible | Revisión a 390 px, foco, teclado y movimiento reducido |
| CA10 | Los datos demo respetan el contrato | `npm test` y revisión de estructuras |

## 8. Fuera de alcance y supuestos

- La zona horaria se fija en `-06:00` (CDMX) a falta de confirmación.
- No se implementan cancelaciones, reembolsos, descuentos ni recuperación de contraseña.
- El pago es una simulación local; no se integra una pasarela real.
- La autenticación demo usa tokens locales; el backend real deberá validar credenciales y sesiones.
