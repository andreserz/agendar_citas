# Arquitectura — citas_web_1

## 1. Resumen

`citas_web_1` es una SPA estática sin dependencias de producción. HTML5, CSS3 y módulos ES se cargan directamente en el navegador. La aplicación se organiza en capas para poder operar con datos locales de demostración y, sin cambios de interfaz, consumir `citas_service` cuando esté disponible.

```
┌──────────────────────────────────────────────────┐
│  index.html + css/styles.css                     │
│  shell, tema glassmorphism, estados y medios     │
└──────────────────────┬───────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────┐
│  app.js — rutas hash, sesión, catálogo, vistas   │
│  layout.js · auth.js · ui.js · seatmap.js        │
└──────────────────────┬───────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────┐
│  data-service.js — fachada y selección de modo   │
│  auto · demo · api, respaldo ante fallos         │
└──────────────┬───────────────────────┬───────────┘
               │                       │
┌──────────────▼──────────┐  ┌─────────▼───────────┐
│ api-client.js           │  │ demo-service.js     │
│ fetch /api/v1, Bearer,  │  │ contrato local,     │
│ X-Sitio, timeout        │  │ localStorage        │
└──────────────┬──────────┘  └─────────┬───────────┘
               │                       │
               │            ┌──────────▼───────────┐
               │            │ domain.js + utils.js │
               │            │ reglas puras         │
               │            └──────────────────────┘
               ▼
        citas_service (futuro)
```

## 2. Capas

### 2.1 Presentación

- `app/index.html`: contenedor, enlace de salto, carga de `config.js`, `qrcode.js` y `app.js`.
- `app/css/styles.css`: sistema visual, layout, componentes, responsive, impresión, movimiento reducido y foco.
- `app/js/views/*`: una función por ruta que devuelve `{ html, alMontar }`; la limpieza de temporizadores y listeners se devuelve como función.
- `layout.js`, `auth.js`, `ui.js` y `seatmap.js`: piezas reutilizables de cabecera, pie, diálogos, avisos, formularios y mapa de asientos.

`app.js` es el único orquestador: escucha `hashchange`, resuelve la vista, controla el token de render para descartar respuestas obsoletas, administra la sesión y mantiene las selecciones por función.

### 2.2 Aplicación

- `data-service.js` expone una fachada única (`datos`) con operaciones de catálogo, reservas, pagos, órdenes y cuenta.
- En el arranque ejecuta `GET /eventos` como prueba de conexión y decide el modo:
  - `demo`: datos locales.
  - `api`: sólo API.
  - `auto`: API si responde; demo si no.
- Si una petición falla por red en modo `auto`, cambia a demo y reintenta la operación.
- Emite `cw1:modo` para que la interfaz actualice el indicador de conexión.
- Al cambiar de modo cierra la sesión porque los tokens no son intercambiables entre orígenes.

### 2.3 Integración

- `api-client.js` implementa el contrato `/api/v1` con `fetch`, `AbortController`, `X-Sitio`, `Authorization: Bearer` y normalización de errores HTTP/JSON.
- La URL y el resto de parámetros son configurables en `app/config.js` o mediante `window.CITAS_CONFIG`.
- No hay credenciales ni secretos en el repositorio.

### 2.4 Dominio

- `domain.js` no toca DOM ni almacenamiento; contiene catálogo, generación de funciones y asientos, precios, ocupación, vigencia, límite de asientos, validación de tarjetas y de cuentas, folios y códigos.
- `utils.js` concentra formato de fechas/moneda, hash no criptográfico, normalización de correo y almacenamiento seguro.
- Esta separación permite probar las reglas con `node --test` sin navegador.

### 2.5 Persistencia demo

- `demo-service.js` implementa las mismas operaciones que el cliente API.
- Guarda usuarios, reservas, intentos de pago y órdenes en `localStorage` (`citas_web_1.demo.v1`), con memoria como respaldo.
- Los estados de reserva se recalculan con el reloj real en cada consulta: una reserva vencida libera sus asientos sin necesidad de un proceso en segundo plano.
- La contraseña demo se guarda con SHA-256 y sal; es una medida de simulación, no un esquema de producción.

## 3. Resiliencia

| Escenario | Comportamiento |
| --- | --- |
| API apagada al iniciar | `auto` cae a demo y muestra un aviso |
| API cae durante el uso | `auto` cambia a demo y repite la operación |
| Tiempo de espera | `AbortController` corta a los 2.2 s |
| Error HTTP del contrato | Se muestra el mensaje normalizado y se conserva el modo |
| Reserva vencida | El checkout bloquea el pago y ofrece volver a elegir |
| Pago rechazado | Se conserva la reserva y se permite reintentar |
| Almacenamiento bloqueado | Se usa memoria durante la sesión |
| Respuesta lenta tras navegar | El token de render descarta la vista obsoleta |
| QR no disponible | Respaldo visual determinista y código textual |

## 4. Decisiones

1. **Sin build**: módulos ES nativos y servidor estático mínimo; reduce herramientas y facilita la revisión académica.
2. **Fachada de datos**: una sola interfaz para demo y API evita condicionales en las vistas y permite intercambiar el origen en caliente.
3. **Demo como contrato**: la implementación local replica entidades, estados y errores del contrato para que la transición a la API sea directa.
4. **Dominio puro**: las reglas críticas se prueban sin navegador y sin red.
5. **Fallback visible**: el modo demo nunca se oculta; el indicador de conexión permite cambiarlo y reiniciar los datos.
6. **Accesibilidad desde el inicio**: foco, anuncios, teclado, contraste y movimiento reducido forman parte de los componentes, no un parche posterior.

## 5. Pruebas

- `tests/domain.test.js` con `node --test`: 10 pruebas de catálogo, ocupación, precios, vigencia, límite, tarjetas, cuentas y folios.
- Recorrido manual/asistido en navegador: inicio, cartelera, selección, reserva, rechazo, aprobación, orden, QR, cuenta y móvil.
- La demo se puede validar sin `citas_service`; cuando el servicio exista, se configura `modo: 'api'` y se repiten los criterios de aceptación de `docs/ESPECIFICACION.md`.

## 6. Riesgos y evolución

- El contrato definitivo puede cambiar nombres o estados; el adaptador `api-client.js` es el único punto a ajustar.
- La concurrencia real de asientos depende del backend; la demo sólo garantiza consistencia local.
- La autenticación demo no sustituye la seguridad del servicio real.
- Si se requiere historial completo, backoffice o cancelaciones, se deberán agregar endpoints y vistas sin alterar las capas actuales.
