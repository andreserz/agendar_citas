# Lista de tareas — citas_web_2

Negocio: cineclub con 10 salas de 80 butacas (800 en total), numeradas en una sola zona, con precio por formato (2D $100 / 3D $150 MXN), compra sin cuenta y conteo diario de reservas. Respuestas en `docs/RESPUESTAS_CLIENTE.md` y `docs/RESPUESTA_P4.md`.

## Etapas

- [x] Anteproyecto: documentar contexto, negocio, alcance, objetivos y restricciones. **Cerrado el 3 nov 2026. Los pendientes se trasladaron a las etapas siguientes.**
- [ ] Propuesta: definir experiencia, identidad visual y dependencias conocidas. **En revisión desde el 23 nov 2026: `docs/PROPUESTA.md` define experiencia, paleta, tipografías y contraste; pendiente aprobación del equipo.**
- [ ] Definición: acordar requisitos y reglas de negocio. **En curso desde el 6 nov 2026: `docs/DEFINICION.md` registra los acuerdos de folio (RN05) y conteo diario (RN06); la validación formal del cliente sigue pendiente.**
- [ ] Especificación: detallar interfaz, integración y criterios de aceptación. **Borrador completo desde el 23 nov 2026 en `docs/ESPECIFICACION.md` (RF01–RF11); pendiente revisión del equipo.**
- [x] Construcción: implementar la aplicación aprobada en `app/`. **Implementación funcional lista el 23 nov 2026; integración con servicio y demo local incluidas.**
- [x] Pruebas: validar los criterios acordados en `tests/`. **13 pruebas automatizadas, recorrido Chromium y revisión a 390 px completados el 23 nov 2026.**

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

- [x] Preparar la identidad visual en `docs/PROPUESTA.md`: paleta primario y acento, tipografías y uso de marca. **Pendiente de aprobación del equipo.**

### Especificación

- [x] Definir el formato del código de boleto para el QR (PR7): 12 caracteres `[A-Z2-9]`, generado por el servicio y presentado como QR por web_2, según el contrato `impl-web2`.
- [x] Redactar el borrador de pantallas, integración y criterios de aceptación RF01–RF11 en `docs/ESPECIFICACION.md`.
- [ ] Revisar y aprobar `docs/ESPECIFICACION.md` y `docs/PROPUESTA.md` con el equipo antes de cerrar las etapas.

---

## Plan de implementación — change `impl-web2` (actualizado 23 nov 2026)

Fuente: `openspec/changes/impl-web2/` (`tasks.md` tiene el detalle). El contrato entre capas es `openspec/changes/impl-web2/specs/contrato-entre-capas/spec.md`. No hace falta acordar nada con otros equipos: la API, los códigos y la semilla vienen del contrato.

- [x] 1. Documentación previa: Propuesta, Definición (30 funciones, idioma/clasificación por confirmar) y Especificación.
- [x] 2. Configuración y servidor estático en `5502`.
- [x] 3. Cliente de API con `X-Sitio: web_2`, sin `Authorization` y errores normalizados.
- [x] 4. Pantallas RF01–RF11: cartelera, mapa, resumen, conflicto, checkout, confirmación, folio y conteo diario.
- [x] 5. Demo con la semilla de web_2 y aviso de modo.
- [x] 6. Pruebas de dominio y cliente; compra, rechazo, conflicto, vencimiento, recuperación y ancho 390 px.
- [x] 7. Registrar avance en este archivo y aclarar el estado de la Definición.
