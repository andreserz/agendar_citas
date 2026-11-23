# Lista de tareas — citas_web_2

Negocio: cineclub con 10 salas de 80 butacas (800 en total), numeradas en una sola zona, con precio por formato (2D $100 / 3D $150 MXN), compra sin cuenta y conteo diario de reservas. Respuestas en `docs/RESPUESTAS_CLIENTE.md` y `docs/RESPUESTA_P4.md`.

## Etapas

- [x] Anteproyecto: documentar contexto, negocio, alcance, objetivos y restricciones. **Cerrado el 3 nov 2026. Los pendientes se trasladaron a las etapas siguientes.**
- [ ] Propuesta: definir experiencia, identidad visual y dependencias conocidas. **En curso desde el 23 nov 2026: `docs/PROPUESTA.md` con experiencia, paleta y tipografías validadas en contraste (WCAG AA); falta la aprobación del equipo y del cliente.**
- [ ] Definición: acordar requisitos y reglas de negocio. **En curso desde el 6 nov 2026: `docs/DEFINICION.md` acordada por el equipo (RN05 folio y RN06 conteo diario). Falta sólo la confirmación formal del cliente para cerrar la etapa; los pendientes de servicio quedaron cerrados por el contrato (D13–D24).**
- [ ] Especificación: detallar interfaz, integración y criterios de aceptación. **Documentada el 23 nov 2026 en `docs/ESPECIFICACION.md` (RF01–RF11 y CA01–CA16); falta validación del equipo.**
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
- [x] Validar la `DEFINICION.md` con el equipo: confirmadas el 6 nov 2026 las decisiones de RN05 (folio) y RN06 (conteo diario).
- [ ] Confirmar con el cliente que el folio y el conteo diario quedan como acordados; registrar la confirmación. **Único pendiente para cerrar la Definición.**
- [x] Confirmar con el servicio la consulta de orden por folio, las órdenes sin comprador y la exposición del conteo diario. **Cerrado el 18 nov 2026 por el contrato: D18, D20 y D21; registrado en `ACUERDOS.md`.**

## Pendientes trasladados

### Definición

- [x] Definir cómo se recupera un boleto sin cuenta: folio de la orden. **Decidido el 6 nov 2026 (RN05 de `DEFINICION.md`).**
- [x] Precisar el conteo diario: incluye reservas vencidas y liberadas (toda reserva creada del día), sin desglose por sala. **Decidido el 6 nov 2026 (RN06 de `DEFINICION.md`).**

### Coordinación con `citas_service` — cerrada el 18 nov 2026

El contrato de OpenSpec resolvió las preguntas y propuestas abiertas; no hubo que acordar nada por chat (D25 y D26).

- [x] Enviar `docs/RESPUESTA_P4.md` al equipo de servicio para que la registre en `ACUERDOS.md`. **Registrada como D15 el 18 nov 2026.**
- [x] Registrar P5 (compra sin cuentas) y P9 (rechazo de la reserva completa) en `ACUERDOS.md`. **D16/D18 y D17.**
- [x] Confirmar si el servicio crea órdenes sin cuenta de usuario y si expone el conteo diario de reservas. **Sí: D18 (`RequiereComprador = 0`) y D21 (`/reportes/reservas-por-dia`).**
- [x] Acordar la zona horaria (P8) y el resultado del pago simulado (P10). **D13 (6 nov) y D14 (6 nov).**

### Propuesta

- [x] Definir la identidad visual: paleta primario y acento, tipografías y marca. **Propuesta el 23 nov 2026 en `docs/PROPUESTA.md`: primario `#1B4D6B` (8.4:1 con texto) y acento `#F2B544` (10.5:1 con tinta); tipografías del sistema. El monograma es provisional hasta que el cliente entregue el nombre comercial.**

### Especificación

- [x] Definir el formato del código de boleto para el QR (PR7). **Resuelto por D24: 12 caracteres `[A-Z2-9]`; el sitio dibuja el QR.**
- [x] Fijar cómo se dibuja el QR en JS vanilla y el respaldo textual. **Especificado el 23 nov 2026: librería vendorizada de `citas_web_1`, 200 px, corrección M y respaldo con el código textual si no se dibuja.**
- [x] Redactar los criterios de aceptación. **CA01–CA16 en `docs/ESPECIFICACION.md`.**

## Revisión de pendientes — 20 nov 2026

El detalle está en `docs/REVISION_PENDIENTES.md`. La coordinación con otros equipos está cerrada; sólo quedan la confirmación del cliente, la Propuesta y la Especificación.

---

## Plan de implementación — change `impl-web2` (actualizado 18 nov 2026)

Fuente: `openspec/changes/impl-web2/` (`tasks.md` tiene el detalle). El contrato entre capas es `openspec/changes/impl-web2/specs/contrato-entre-capas/spec.md`. No hace falta acordar nada con otros equipos: la API, los códigos y la semilla vienen del contrato.

- [x] 1. Documentación previa: Propuesta (paleta y tipografías), Definición (horarios de 30 funciones, «Por confirmar») y Especificación (tareas 1.1–1.3). **Completadas el 23 nov 2026.**
- [ ] 2. Configuración y servidor estático en `5502` (tareas 2.1–2.2)
- [ ] 3. Cliente de API con `X-Sitio: web_2` y sin `Authorization` (tareas 3.1–3.3)
- [ ] 4. Pantallas RF01 a RF11: cartelera, mapa, resumen, rechazo completo, checkout, confirmación, folio y conteo diario (tareas 4.1–4.8)
- [ ] 5. Demo con la semilla de web_2 y aviso de modo (tareas 5.1–5.2)
- [ ] 6. Pruebas de dominio, cliente, recorrido en navegador y 390 px (tareas 6.1–6.4)
- [ ] 7. Entrega: avance registrado aquí y corrección del texto que dice «cerró» la Definición (tarea 7.1)
