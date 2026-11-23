# citas_web_2 — Cineclub

Frontend responsivo para consultar funciones, elegir butacas, realizar una compra simulada y recuperar boletos por folio.

## Ejecutar

Requiere Node.js 20 o superior. No necesita instalar dependencias.

```powershell
npm start
```

Abre `http://localhost:5502`. La aplicación inicia en modo `auto`: usa la API en `http://localhost:3000/api/v1` y cambia a datos demo cuando el servicio no responde. El banner indica cuándo la interfaz está en demo.

La configuración pública está en `app/config.js`. `modo` acepta `auto`, `demo` o `api`; `apiBaseUrl` cambia la URL del servicio.

## Pago de demostración

- Aprobado: `4242 4242 4242 4242`
- Rechazado: `4000 0000 0000 0002`

Usa cualquier titular de tres o más caracteres, vencimiento futuro en formato `MM/AA` y CVV de tres dígitos. No se realiza ningún cargo.

## Pruebas

```powershell
npm test
```

La suite usa el ejecutor integrado de Node y no requiere paquetes externos. El recorrido de navegador sin dependencias está en `tests/browser-smoke.mjs`; requiere la app en `5502` y Chromium con el protocolo de depuración remota en `9223`.
