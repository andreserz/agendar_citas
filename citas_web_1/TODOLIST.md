# Lista de tareas — citas_web_1

- [x] Anteproyecto: entrevistar y documentar contexto, alcance, objetivos y restricciones. **Cerrado: identidad visual aprobada y detalles pendientes asignados a etapas posteriores.**
- [x] Propuesta: documentar alcance, experiencia y dependencias conocidas. **Completada con pendientes trasladados a las siguientes etapas.**
- [x] Definición: acordar requisitos y reglas de negocio. **Cerrada con los acuerdos disponibles y supuestos documentados.**
- [x] Especificación: detallar interfaz, integración y criterios de aceptación. **Ver `docs/ESPECIFICACION.md`.**
- [x] Construcción: implementar la aplicación aprobada. **SPA vanilla completa en `app/`.**
- [x] Pruebas: validar los criterios acordados. **10 pruebas automáticas y recorrido completo en navegador (escritorio y móvil).**

## Detalle de Construcción

- [x] Estructura del SPA, rutas hash (`#/`, `#/cartelera`, `#/checkout/:id`, `#/orden/:id`, `#/cuenta`).
- [x] Diseño glassmorphism responsivo con la paleta aprobada, movimiento reducido, foco visible e impresión de boletos.
- [x] Inicio: presentación de la obra, zonas, precios y llamados a la acción.
- [x] Cartelera: calendario octubre–diciembre 2026, horarios 15:00/19:00/21:00, aforo y disponibilidad por función.
- [x] Mapa de 120 asientos (A–L, 10 por fila), estados disponible/seleccionado/apartado/comprado, límite de 10 y total por zona.
- [x] Autenticación simulada: registro, inicio y cierre de sesión; cuenta demo visible en el formulario.
- [x] Reserva de 5 minutos con cuenta regresiva, liberación de asientos al vencer o abandonar la selección.
- [x] Pago simulado con tarjeta aprobada y rechazada, reintento tras rechazo y mensajes de error/expiración.
- [x] Confirmación de compra con folio `ORD-000123`, boletos con código de 12 caracteres y QR.
- [x] Cuenta del comprador: reservas activas, historial de compras y acceso a boletos.
- [x] Fachada de datos con modos `auto`, `demo` y `api`, respaldo automático y diálogo de conexión.
- [x] Adaptador `/api/v1` con `X-Sitio`, Bearer, tiempo de espera y normalización de errores.
- [x] Configuración pública en `app/config.js` (URL de API, Swagger, sitio, tiempos y límites).
- [x] Servidor estático sin dependencias en `tools/serve.js` (puerto 5501).
- [x] Datos demo persistentes en `localStorage` con respaldo en memoria y opción de reinicio.

## Detalle de Pruebas

- [x] `npm test`: catálogo, ocupación, mapa de asientos, precios, vigencia de reservas, límite de 10, tarjetas, registro/login, folios/códigos y filtro de funciones.
- [x] Navegador: inicio, cartelera, selección de asientos, creación de reserva, rechazo y aprobación de pago.
- [x] Navegador: página de orden, QR, código de boleto, cuenta con historial y reinicio de demo.
- [x] Responsivo: vista móvil de 390 px sin desbordamiento horizontal y sin errores de consola.
- [x] Resiliencia: la app opera con `citas_service` apagado y avisa del modo demo.

## Pendientes de terceros (no bloquean la demo)

- [ ] Contrato definitivo de `citas_service` (autenticación, disponibilidad, reservas, pagos y QR).
- [ ] Confirmar zona horaria, excepciones de calendario, accesibilidad física y política de cancelación.
- [ ] Sustituir la demo por la API cuando el servicio esté operativo; basta cambiar `apiBaseUrl` y `modo` en `app/config.js`.
