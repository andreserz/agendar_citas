# Lista de tareas — citas_web_2

Negocio: cineclub con 10 salas de 80 butacas (800 en total), numeradas en una sola zona, con precio por formato (2D $100 / 3D $150 MXN), compra sin cuenta y conteo diario de reservas. Respuestas en `docs/RESPUESTAS_CLIENTE.md` y `docs/RESPUESTA_P4.md`.

## Etapas

- [x] Anteproyecto: documentar contexto, negocio, alcance, objetivos y restricciones. **Cerrado el 3 nov 2026. Los pendientes se trasladaron a las etapas siguientes.**
- [ ] Propuesta: definir experiencia, identidad visual y dependencias conocidas. **Pendiente.**
- [ ] Definición: acordar requisitos y reglas de negocio. **Pendiente.**
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
- [x] Redactar la respuesta a P4 con el negocio y los datos del cineclub en `docs/RESPUESTA_P4.md`.
- [x] Validar el anteproyecto con el equipo y aprobar el negocio. **Cerrado por el equipo el 3 nov 2026.**

## Pendientes trasladados

### Definición

- [ ] Definir los horarios de las funciones.
- [ ] Definir cómo se recupera un boleto sin cuenta (folio, código o correo).
- [ ] Precisar el conteo diario: si incluye reservas vencidas y si se desglosa por sala o función.

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
