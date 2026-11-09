# citas_web_1 — Teatro “Aquí nadie actúa normal”

Frontend del sitio de boletos para la obra **¡Que no se entere la suegra!**. Es una SPA con HTML5, CSS3 y JavaScript vanilla (módulos ES) que funciona sin backend mediante datos de demostración y que puede apuntar a `citas_service` cuando esté disponible.

## Requisitos

- Node.js 20 o superior (sólo para el servidor estático y las pruebas).
- Ningún framework, empaquetador ni dependencia de producción.

## Ejecutar

```bash
cd citas_web_1
npm start
```

Abre http://127.0.0.1:5501. El servidor es `tools/serve.js` y sirve `app/` en el puerto 5501.

## Cuenta y pagos de prueba

| Dato | Valor |
| --- | --- |
| Correo | `demo@teatro.mx` |
| Contraseña | `Demo1234!` |
| Tarjeta aprobada | `4242 4242 4242 4242` |
| Tarjeta rechazada | `4000 0000 0000 0002` |

Para cualquier tarjeta usa un titular, una fecha de vencimiento futura (MM/AA) y un CVV de 3 o 4 dígitos. Todos los pagos y correos son simulados.

## Modos de datos

La configuración vive en `app/config.js` y puede sobrescribirse antes de cargar el script con `window.CITAS_CONFIG`.

```js
window.CITAS_CONFIG = {
  apiBaseUrl: 'http://localhost:3000/api/v1',
  swaggerUrl: 'http://localhost:3000/docs',
  sitio: 'web_1',
  modo: 'auto',            // 'auto' | 'demo' | 'api'
  tiempoEsperaMs: 2200,
  respaldoDemoAutomatico: true,
  maxAsientos: 10,
  duracionReservaSegundos: 300,
};
```

- **auto** (predeterminado): prueba `GET /eventos`; si la API no responde, usa la demo local y lo avisa.
- **demo**: siempre datos locales, útil sin backend.
- **api**: sólo API; si falla, muestra el error y permite cambiar a demo desde el indicador de conexión.

El estado de demostración se guarda en `localStorage` (con respaldo en memoria si el navegador lo bloquea). El enlace **Reiniciar demo** del pie borra cuentas, reservas y compras locales.

## Flujo principal

1. **Cartelera**: elige fecha y horario; el calendario muestra octubre–diciembre de 2026.
2. **Asientos**: selecciona hasta 10 butacas de las zonas Preferente ($800), General ($500) o Balcón ($300).
3. **Cuenta**: inicia sesión o regístrate para apartar.
4. **Pago**: la reserva dura 5 minutos; un rechazo permite reintentar mientras siga vigente.
5. **Confirmación**: folio `ORD-000123`, boletos con código de 12 caracteres y QR.
6. **Mis compras**: reservas activas e historial desde la cuenta.

## Pruebas

```bash
cd citas_web_1
npm test
```

Las pruebas usan `node --test` y cubren la lógica pura de `app/js/domain.js`: catálogo, ocupación, precios, vigencia, límite de asientos, tarjetas, registro/login y folios/códigos.

## Estructura

```
app/
  index.html          shell del SPA
  config.js           configuración pública
  css/styles.css      estilos glassmorphism, responsivos e impresión
  js/
    app.js            arranque, rutas y coordinación
    data-service.js   fachada demo/API con respaldo
    api-client.js     adaptador HTTP /api/v1
    demo-service.js   implementación local del contrato
    domain.js         reglas puras y catálogo
    layout.js         cabecera, pie y diálogo de conexión
    auth.js           registro e inicio de sesión
    seatmap.js        mapa de asientos
    views/            inicio, cartelera, checkout, orden y cuenta
    vendor/qrcode.js  generador de QR sin dependencias
tests/domain.test.js  pruebas automáticas
tools/serve.js        servidor estático
docs/                 anteproyecto, propuesta, definición, especificación y arquitectura
```

## Documentación

- `docs/ANTEPROYECTO.md`, `docs/PROPUESTA.md`, `docs/DEFINICION.md`
- `docs/ESPECIFICACION.md`: interfaz, integración y criterios de aceptación.
- `docs/architecture/ARQUITECTURA.md`: capas, decisiones y estrategia de resiliencia.
