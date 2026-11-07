# Lista de tareas — citas_web_2

Negocio: cineclub con 10 salas de 80 butacas (800 en total), numeradas en una sola zona, con precio por formato (2D $100 / 3D $150 MXN), compra sin cuenta y conteo diario de reservas. Respuestas en `docs/RESPUESTAS_CLIENTE.md` y `docs/RESPUESTA_P4.md`.

## Etapas

- [x] Anteproyecto: documentar contexto, negocio, alcance, objetivos y restricciones. **Cerrado el 3 nov 2026. Los pendientes se trasladaron a las etapas siguientes.**
- [ ] Propuesta: definir experiencia, identidad visual y dependencias conocidas. **Pendiente.**
- [ ] Definición: acordar requisitos y reglas de negocio. **En curso desde el 6 nov 2026: `docs/DEFINICION.md` en borrador, cerró folio del boleto (RN05) y conteo diario (RN06); falta validación del equipo y del cliente.**
- [ ] Especificación: detallar interfaz, integración y criterios de aceptación. **Pendiente.**
- [ ] Construcción: implementar la aplicación aprobada en `app/`. **Pendiente.**
- [ ] Pruebas: validar los criterios acordados en `tests/`. **Pendiente.**

## Detalle del anteproyecto — cerrado el 3 de noviembre de 2026

- [x] Revisar el contexto compartido (`citas_service`, `citas_web_1`, `citas_backend`) y las reglas heredadas de apartado, pago y boletos.
- [x] Proponer el negocio de este sitio (cineclub) y la distribución de la sala.
- [x] Documentar alcance, exclusiones, flujo, integración, restricciones y riesgos.
- [x] Registrar la dependencia de P4 y los pendientes que pasan a las siguientes etapas.
- [x] Redactar el cuestionario de negocio para el cliente en `docs/CUESTIONARIO_PARA_RESERVA.md` (5 preguntas de opción múltiple).
- [x] Aplicar el cuestionario al cliente y registrar sus respuestas en `docs/RESPUESTAS_CLIENTE.md`.
- [x] Actualizar el anteproyecto con el negocio confirmado: 10 salas, una zona con precio por formato y compra sin cuenta.
- [x] Definir con el cliente la política de butacas ocupadas: rechazar la selección completa, mostrar el mapa actualizado y pedir una nueva elección.
- [x] Recibir los datos de salas y precios: 10 salas de 80 butacas (800 en total); $100 MXN en 2D y $150 MXN en 3D por boleto.
- [x] Confirmar la cartelera: por ahora *Spider-Man* es la única película.
- [x] Recibir los horarios: 30 funciones diarias de lunes a domingo, salas 1–5 en 2D y 6–10 en 3D, dos horas por función.
- [x] Redactar la respuesta a P4 con el negocio y los datos del cineclub en `docs/RESPUESTA_P4.md`.
- [x] Validar el anteproyecto con el equipo y aprobar el negocio. **Cerrado por el equipo el 3 nov 2026.**

## Definición — abierta el 6 de noviembre de 2026

- [x] Armar el `docs/DEFINICION.md` con objetivo, usuarios, oferta, RF, RN y estados, siguiendo el formato de `citas_web_1` y `citas_service`.
- [x] Decidir la recuperación del boleto sin cuenta: **folio de la orden** (RN05); correo descartado porque no hay cuentas ni envíos.
- [x] Definir el conteo diario (RN06): **reservas creadas por día calendario en `America/Mexico_City`, sin importar su estado final y sin desglose por sala**.
- [x] Mapear cada requisito y regla de web_2 contra el servicio, marcando lo condicional (folio de orden, conteo diario, P10).
- [ ] Validar la `DEFINICION.md` con el equipo y cerrarla.
- [ ] Confirmar con el cliente que el folio y el conteo diario quedan como acordados; registrar la confirmación.
- [ ] Confirmar con el servicio: consulta de orden por folio, órdenes sin comprador identificado y exposición del conteo diario (añadir a `ACUERDOS.md`).

## Pendientes trasladados

### Definición

- [x] Definir cómo se recupera un boleto sin cuenta: folio de la orden. **Decidido el 6 nov 2026 (RN05 de `DEFINICION.md`).**
- [x] Precisar el conteo diario: incluye reservas vencidas y liberadas (toda reserva creada del día), sin desglose por sala. **Decidido el 6 nov 2026 (RN06 de `DEFINICION.md`).**

### Coordinación con `citas_service`

- [ ] Enviar `docs/RESPUESTA_P4.md` al equipo de servicio para que la registre en `ACUERDOS.md`.
- [ ] Registrar P5 (compra sin cuentas) y P9 (rechazo de la reserva completa) en `ACUERDOS.md`.
- [ ] Confirmar si el servicio crea órdenes sin cuenta de usuario y si expone el conteo diario de reservas.
- [ ] Acordar la zona horaria (P8) y el resultado del pago simulado (P10).

### Propuesta

- [ ] Definir la identidad visual: paleta primario y acento, tipografías y marca.

### Especificación

- [ ] Definir el formato del código de boleto para el QR (PR7).
- [ ] Redactar los criterios de aceptación.
