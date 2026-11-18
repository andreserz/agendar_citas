# Design — impl-web1

## Contexto

La SPA ya tiene fachada de datos (`data-service.js`) con modos `auto`, `demo` y `api`, y un adaptador HTTP (`api-client.js`). El cambio es de alineación: rutas, cabeceras, forma del pago y avisos. El diseño visual no cambia.

## Decisiones

**1. Un solo punto de verdad para rutas.** Las rutas viven en `api-client.js`. Ninguna vista construye URLs.

**2. Cabeceras por ruta.** `api-client.js` decide `Authorization` según una tabla de rutas que requieren comprador, tomada del contrato.

**3. Demo con la misma semilla.** `demo-service.js` genera 120 funciones (jueves, viernes y sábados, 15:00, 19:00 y 21:00 CDMX) y las zonas Preferente A–C, General D–I y Balcón J–L. Así una compra demo y una compra real muestran los mismos datos.

**4. Aviso visible de modo.** Un banner en el pie indica el modo activo y el motivo. Reemplaza el cambio silencioso.

**5. Tarjetas de prueba.** La validación en la interfaz refleja D14. El servicio también valida; la interfaz solo evita el viaje.

## Riesgos

- Si el servicio tarda más de `tiempoEsperaMs` por una consulta pesada, `auto` cambiará a demo. El aviso lo deja claro al usuario.
- Mientras `impl-service` no esté entregado, `api` no se puede probar de punta a punta; la prueba de integración se hace contra un mock que cumple el contrato.
