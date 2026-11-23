# Tasks — impl-web2

Marcar con `[x]` al terminar. Reportar el avance en `citas_web_2/TODOLIST.md`.

## 1. Documentación previa
- [x] 1.1 Completar `docs/PROPUESTA.md`: experiencia, paleta primario y acento validados en contraste, tipografías.
- [x] 1.2 Cerrar `docs/DEFINICION.md`: corregir la tabla de horarios para mostrar las 30 funciones diarias y el texto «Por confirmar» de idioma y clasificación.
- [x] 1.3 Completar `docs/ESPECIFICACION.md` con pantallas y criterios de aceptación que cubran RF01 a RF11.

## 2. Configuración
- [ ] 2.1 `app/config.js` con los valores del requisito «Configuración del sitio» (Requirement: Configuración del sitio).
- [ ] 2.2 Servidor estático en el puerto `5502` (copiar el patrón de `citas_web_1/tools/serve.js`, sin dependencias).

## 3. Cliente de API
- [ ] 3.1 Cliente con `X-Sitio: web_2` y sin `Authorization` (Requirement: Identificación sin cuenta).
- [ ] 3.2 Funciones del cliente para las rutas listadas en el contrato (Requirement: Rutas usadas).
- [ ] 3.3 Normalización de errores con los códigos del contrato.

## 4. Pantallas
- [ ] 4.1 Cartelera con 30 funciones diarias, agrupadas por formato y con precio (RF01).
- [ ] 4.2 Mapa de 80 butacas con estados y mapeo de nombres (RF02, Requirement: Mapa de butacas y estados).
- [ ] 4.3 Resumen con butacas, precio y total (RF03).
- [ ] 4.4 Selección con rechazo completo y nueva elección (RF05, Requirement: Rechazo de selección completa).
- [ ] 4.5 Checkout con cuenta regresiva de 5 minutos y pago simulado con tarjetas de prueba (RF04, RF06).
- [ ] 4.6 Confirmación con folio, boleto y QR; si el QR no carga, mostrar código textual (RF08).
- [ ] 4.7 Recuperación de boleto por folio (RF09).
- [ ] 4.8 Vista del operador con conteo diario (RF10, Requirement: Rutas usadas).

## 5. Demo
- [ ] 5.1 Datos demo con la semilla del contrato para web_2 (Requirement: Modo demo).
- [ ] 5.2 Aviso visible de modo demo.

## 6. Pruebas
- [ ] 6.1 Pruebas de dominio en `tests/`: precio por formato, total, mapeo de estados, límite de selección.
- [ ] 6.2 Prueba de cliente contra mock del contrato: sin `Authorization`, con `X-Sitio`.
- [ ] 6.3 Recorrido en navegador: compra completa, rechazo por conflicto, vencimiento y recuperación por folio.
- [ ] 6.4 Revisión a 390 px sin desplazamiento horizontal.

## 7. Entrega
- [ ] 7.1 Actualizar `citas_web_2/TODOLIST.md` con el avance y corregir el texto que dice «cerró» la Definición.
