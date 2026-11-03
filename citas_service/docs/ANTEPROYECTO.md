# Anteproyecto — citas_service: API de reserva y compra de boletos

Estado: borrador para revisión del equipo. Lo que depende de otros equipos está marcado como pendiente y se registra en `specs/ACUERDOS.md`, que es la fuente oficial de acuerdos.

## Objetivo y contexto

`citas_service` es la API REST que permite a varios sitios web consultar funciones, apartar asientos durante un tiempo limitado y comprar boletos con un pago simulado. Concentra las reglas de negocio y publica el contrato (OpenAPI 3, Swagger UI en `/docs`) que consumen los sitios.

El sistema compartido está formado por cuatro áreas a cargo de equipos distintos:

| Carpeta | Responsable | Relación con este servicio |
| --- | --- | --- |
| `citas_web_1` | Equipo web 1 (Teatro Aquí nadie actúa normal) | Consumidor de la API |
| `citas_web_2` | Equipo web 2 | Consumidor de la API; su negocio y sus datos están por confirmar |
| `citas_backend` | Equipo backend | Base de datos; motor y esquema aún no definidos |
| `citas_service` | Este equipo | Reglas de negocio y contrato de la API |

## Alcance

**Incluye**
- Consulta de eventos, funciones y asientos con su disponibilidad.
- Apartado temporal de asientos, con liberación manual y automática.
- Pago simulado con resultado de éxito o rechazo, y reintento mientras el apartado siga vigente.
- Órdenes y un código de texto por boleto, para que cada sitio lo dibuje como QR (propuesta PR7, por confirmar).
- Consulta de las reservas vigentes y de las compras de un comprador.
- Límite de asientos por persona y función, sumando compras y reservas vigentes.
- Contrato OpenAPI versionado bajo `/api/v1` y documentación Swagger.
- Identificación del sitio consumidor en cada petición.

**No incluye**
- Interfaces de usuario: son responsabilidad de `citas_web_1` y `citas_web_2`.
- Diseño de la base de datos, motor, esquema e índices: los decide `citas_backend`.
- Pasarela de pago real; el pago es simulado.
- Backoffice de consolidación (quién compró qué asiento, cuándo y por qué monto): su alcance y responsable están pendientes de asignación. El servicio deberá poder exponer al menos comprador, asiento, fecha de compra y monto; el mecanismo se definirá después.
- Servidor o dominio propios: cada equipo corre los proyectos localmente.

## Consumidores

- **`citas_web_1`:** teatro con una obra, 120 asientos numerados (A–L) en tres zonas con precios distintos, y funciones jueves, viernes y sábados. Espera de este servicio la URL, la autenticación, la referencia Swagger y las reglas de reserva y expiración (ver `../../citas_web_1/docs/DEFINICION.md`).
- **`citas_web_2`:** negocio por confirmar. Por eso el contrato usará términos genéricos (evento, función, asiento, zona) y no exclusivos del teatro.

## Reglas de negocio conocidas

1. Un asiento se aparta por **5 minutos**. Si no se compra en ese plazo, se libera automáticamente.
2. Mientras está apartado, ningún otro sitio ni usuario puede apartarlo.
3. El pago es simulado y puede resultar en éxito o rechazo. Tras un rechazo se puede reintentar mientras el apartado siga vigente.
4. Máximo 10 asientos por persona y función (regla conocida por ahora sólo desde web_1). Se cuentan las compras y las reservas vigentes de esa persona en la función, aunque las haya hecho en varias operaciones.

## Flujo general

1. El sitio consulta eventos, funciones y asientos disponibles.
2. El sitio solicita apartar asientos; el servicio crea una reserva con vencimiento a 5 minutos.
3. El sitio solicita el pago simulado de la reserva.
4. Si el pago es exitoso, el servicio genera la orden y los boletos; si es rechazado, la reserva sigue vigente hasta su vencimiento.
5. Si la reserva vence o se libera, los asientos vuelven a estar disponibles.

## Restricciones y condiciones

- **Stack aprobado (D1):** Node.js 20 + Express, OpenAPI 3 (`swagger-ui-express`), Jest + Supertest.
- **Spec primero:** ningún endpoint se implementa sin existir antes en `docs/specs/openapi.yaml`.
- **Patrón repositorio:** mientras el backend no entregue la base de datos, se usan datos en memoria; el adaptador real se agrega después sin tocar la lógica ni las pruebas.
- **Reloj inyectable:** la expiración se prueba sin esperar cinco minutos.
- **Configuración sólo por variables de entorno;** sin secretos en el código ni en la documentación.
- **Ejecución local (D3):** sin servidor ni dominio.
- **Calendario:** entrega del ejercicio el lunes 2 de noviembre de 2026.

## Riesgos identificados

| Riesgo | Efecto | Mitigación |
| --- | --- | --- |
| El backend no define la base de datos a tiempo | No hay persistencia real | Repositorio en memoria y adaptador documentado como siguiente paso |
| No se decide quién maneja las cuentas de usuario | No se sabe cómo identificar a la "persona" para el límite de 10 | Diseñar el límite sobre un identificador de comprador genérico |
| El negocio de web_2 es distinto al teatro | El contrato podría no servirle | Modelo genérico: evento, función, zona y asiento |
| Dos sitios apartan el mismo asiento a la vez | Doble venta | Apartado atómico; propuesta PR2 por confirmar con backend |
| Poco tiempo y equipo con distinto manejo de git | Conflictos al integrar | Cada integrante trabaja sus propios archivos y una sola persona integra |

## Pendientes para etapas posteriores

Seguimiento en `specs/ACUERDOS.md` (preguntas P1–P7 y propuestas PR1–PR9):

1. Qué entrega el backend (base de datos, API propia o procedimientos), motor, forma de ejecutarla localmente, quién carga los datos iniciales y dónde se documenta el esquema (P1, P2, P3, P6).
2. Negocio y necesidades de datos de web_2 (P4).
3. Quién maneja registro e inicio de sesión, y cómo se identifica al comprador y a cada sitio (P5, PR5).
4. Formato de errores, códigos `409` y `410`, y código de boleto para QR (PR3, PR7).
5. Alcance y responsable del backoffice de consolidación, y cómo se expondrán sus datos.
6. Forma de la demo del lunes (P7).
7. Zona horaria en la que se expresan los horarios de las funciones.
8. Qué pasa si se piden varios asientos y alguno ya no está disponible: rechazar toda la reserva o apartar sólo los libres.
9. Cómo se elige el resultado del pago simulado (por ejemplo, datos de prueba o un campo en la petición).

## Referencias

- `../AGENTS.md`, `PLAN_TRABAJO.md` y `specs/ACUERDOS.md` en este servicio.
- `../../citas_web_1/docs/ANTEPROYECTO.md`, `PROPUESTA.md` y `DEFINICION.md` para las necesidades del primer consumidor.
