# Tasks — impl-web1

Marcar con `[x]` al terminar. Reportar el avance en `citas_web_1/TODOLIST.md`.

## 1. Configuración
- [ ] 1.1 Revisar `app/config.js` contra los valores del requisito «Integración con la API».
- [ ] 1.2 Quitar cualquier dependencia de `resultadoSimulado`.

## 2. Cliente de API
- [ ] 2.1 Tabla de rutas de `api-client.js` con las rutas del contrato (Requirement: Integración con la API).
- [ ] 2.2 `X-Sitio: web_1` en todas las peticiones.
- [ ] 2.3 `Authorization: Bearer` solo en las rutas de comprador.
- [ ] 2.4 Normalizar errores con los códigos del contrato, incluido `RESERVA_LIBERADA` (`410`).

## 3. Fachada de datos
- [ ] 3.1 `auto`: detectar servicio con `GET /salud` antes de cambiar de modo.
- [ ] 3.2 Modo `api` sin respaldo automático: mostrar error y no cambiar a demo.
- [ ] 3.3 Aviso visible de modo demo en el pie (escenarios del requisito).
- [ ] 3.4 Leer el pago con `{ resultado, simulado, reserva, orden? }`.

## 4. Demo
- [ ] 4.1 `demo-service.js` con 120 funciones y la semilla de zonas del contrato.
- [ ] 4.2 Verificar que las funciones de la demo coinciden en fecha y hora con las del servicio.
- [ ] 4.3 Mantener la cuenta demo y el botón de reinicio.

## 5. Documentación
- [ ] 5.1 Actualizar `docs/ESPECIFICACION.md` §4 (rutas) y §8 (zona horaria ya acordada en D13).
- [ ] 5.2 Corregir el encabezado de `AGENTS.md` («Proyecto Conversaciones» → teatro).

## 6. Pruebas
- [ ] 6.1 Mantener las 10 pruebas de `tests/domain.test.js` en verde.
- [ ] 6.2 Prueba de cliente contra mock que cumple el contrato: rutas, cabeceras y forma de pago.
- [ ] 6.3 Prueba de modo: `auto` con servicio caído cae a demo con aviso; `api` no cae.
- [ ] 6.4 Recorrido en navegador en escritorio y 390 px con modo `api` cuando el servicio esté entregado.

## 7. Entrega
- [ ] 7.1 Actualizar `citas_web_1/TODOLIST.md` con el avance.
