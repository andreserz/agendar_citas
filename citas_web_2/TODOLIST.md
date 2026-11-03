# Lista de tareas — citas_web_2

Negocio definido: cineclub con varias salas y butacas numeradas en una sola zona. Respuestas del cliente registradas en `docs/RESPUESTAS_CLIENTE.md`. Falta redactar la respuesta a P4 de `citas_service/docs/specs/ACUERDOS.md`.

## Etapas

- [ ] Anteproyecto: documentar contexto, negocio, alcance, objetivos y restricciones. **En curso: `docs/ANTEPROYECTO.md` actualizado con las respuestas del cliente; faltan datos de salas y precio. La política de butacas ocupadas ya quedó definida.**
- [ ] Propuesta: definir experiencia, identidad visual y dependencias conocidas. **Pendiente.**
- [ ] Definición: acordar requisitos y reglas de negocio. **Pendiente.**
- [ ] Especificación: detallar interfaz, integración y criterios de aceptación. **Pendiente.**
- [ ] Construcción: implementar la aplicación aprobada en `app/`. **Pendiente.**
- [ ] Pruebas: validar los criterios acordados en `tests/`. **Pendiente.**

## Detalle del anteproyecto

- [x] Revisar el contexto compartido (`citas_service`, `citas_web_1`, `citas_backend`) y las reglas heredadas de apartado, pago y boletos.
- [x] Proponer el negocio de este sitio (cineclub) y la distribución de la sala.
- [x] Documentar alcance, exclusiones, flujo, integración, restricciones y riesgos.
- [x] Registrar la dependencia de P4 y los pendientes que pasan a las siguientes etapas.
- [x] Redactar el cuestionario de negocio para el cliente en `docs/CUESTIONARIO_PARA_RESERVA.md` (5 preguntas de opción múltiple).
- [x] Aplicar el cuestionario al cliente y registrar sus respuestas en `docs/RESPUESTAS_CLIENTE.md` (3 nov 2026).
- [x] Actualizar el anteproyecto con el negocio confirmado: varias salas, una zona con precio único y compra sin cuenta.
- [x] Política de butacas ocupadas definida por el cliente (opción D): rechazar la selección completa, mostrar el mapa actualizado y pedir una nueva elección.
- [ ] Registrar esa política en `ACUERDOS.md` como respuesta a P9.
- [ ] Completar datos: número de salas, capacidad de cada una y precio único con moneda.
- [ ] Definir cómo se recupera un boleto sin cuenta (folio, código o correo).
- [x] Redactar la respuesta a P4 con el negocio y los datos del cineclub en `docs/RESPUESTA_P4.md`.
- [ ] Enviar la respuesta a P4 al equipo de servicio para que la registre en `ACUERDOS.md`.
- [ ] Confirmar con el servicio si puede crear órdenes sin cuenta de usuario y si expone el conteo diario de reservas.
- [ ] Validar el anteproyecto con el equipo y aprobar el negocio.
- [ ] Confirmar P4 con el equipo de servicio y recibir los datos del cineclub.
- [ ] Aprobar la identidad visual y la paleta en la etapa de Propuesta.
