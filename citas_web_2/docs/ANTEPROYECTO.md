# Anteproyecto — citas_web_2: Cineclub con reserva de lugares

Estado: negocio definido por el cliente el 3 de noviembre de 2026 a partir de las respuestas registradas en `RESPUESTAS_CLIENTE.md`. Quedan datos abiertos: capacidad de las salas y precio único. La identidad visual y la paleta siguen pendientes.

## Objetivo y contexto

Crear el sitio web de un cineclub donde una persona pueda consultar la cartelera, elegir una función, seleccionar butacas numeradas en el mapa de la sala, apartarlas durante cinco minutos, pagar de forma simulada y recibir su boleto con código QR.

El sistema compartido está formado por cuatro áreas a cargo de equipos distintos:

| Carpeta | Responsable | Relación con este sitio |
| --- | --- | --- |
| `citas_web_1` | Equipo web 1 (Teatro Aquí nadie actúa normal) | Otro frontend del mismo servicio; negocio distinto |
| `citas_web_2` | Este equipo | Frontend del cineclub |
| `citas_service` | Equipo de servicio | API REST con las reglas de apartado, pago y boletos |
| `citas_backend` | Equipo backend | Base de datos; motor y esquema aún no definidos |

Este anteproyecto corresponde únicamente a `citas_web_2`. La API, la base de datos y el sitio del teatro son responsabilidad de otros equipos y no se modifican desde aquí.

## Oferta y usuarios

- El cineclub tiene **varias salas en paralelo**, con películas distintas a la misma hora. Cada función pertenece a una sala y tiene película, fecha, horario, idioma y clasificación.
- Una persona puede consultar la cartelera y el mapa de butacas sin registrarse, y comprar sin crear cuenta: **no hay registro ni inicio de sesión**.
- El sistema no puede identificar a la misma persona entre compras distintas, por lo que **no se aplica el límite de diez butacas por persona y función**.
- El pago es **simulado**: no se integra una pasarela real.

## Flujo y reglas

1. La persona consulta la cartelera y elige función, sala y horario.
2. Consulta el mapa de butacas con su estado: disponible, apartada o vendida.
3. Selecciona sus butacas y confirma. En ese momento comienza el apartado y una cuenta regresiva de **cinco minutos**; mientras siga vigente, nadie más puede solicitar esas butacas.
4. Realiza el pago simulado, que puede resultar en éxito o rechazo. Si es rechazado, puede reintentarlo mientras el apartado siga vigente.
5. Si el apartado vence sin pago, las butacas se liberan automáticamente. La persona también puede abandonarlo y liberarlas antes del vencimiento.
6. Si al confirmar una selección alguna butaca ya no está disponible, el sistema **rechaza la selección completa**, muestra el mapa actualizado y pide una nueva elección; no aparta butacas parciales. Este caso sí puede ocurrir, porque el bloqueo empieza al confirmar y no al abrir el mapa.
7. Tras una compra exitosa se muestran la confirmación, el número de orden, el boleto y su código QR. Como no hay cuenta, el boleto debe poder recuperarse con un folio o código.
8. No existe pantalla de «mis compras» ni historial por persona.

## Salas, butacas y precios

- Cada sala tiene butacas numeradas en **una sola zona, con el mismo precio**.
- Se descarta la propuesta anterior de zonas VIP, general y frente.
- Pendiente de definir con el cliente: número de salas, capacidad de cada una y monto del precio único.

## Alcance

**Incluye**

- Cartelera y consulta de funciones por sala, fecha y horario.
- Mapa de butacas por función, con estado de cada butaca y precio único.
- Selección de butacas, apartado temporal y cuenta regresiva visible.
- Pago simulado con escenarios de éxito y rechazo, y reintento mientras el apartado siga vigente.
- Confirmación de compra con número de orden, boleto y código QR.
- Recuperación del boleto mediante folio o código.
- Conteo diario de reservas para el cineclub.
- Interfaz web responsiva con diseño glassmorphism, en HTML5, CSS3 y JavaScript vanilla.

**No incluye**

- Cuentas de usuario, registro, inicio de sesión e historial de compras por persona.
- Límite de butacas por persona, porque no hay identificación del comprador.
- Detalle de comprador, montos y exportación en la consolidación; el cliente sólo pidió el conteo diario.
- La API, sus reglas y su contrato: son de `citas_service`.
- La base de datos, su motor y su esquema: son de `citas_backend`.
- Pasarela de pago real; el pago es simulado.
- Envío de boletos por correo y capacidad de audio MP3.
- Servidor o dominio propios; el sitio se ejecuta de forma local.

## Integración con el servicio

- El sitio consume la API REST bajo `/api/v1`, documentada con Swagger. La URL de la API, los contextos y la referencia Swagger deben ser configurables.
- El contrato es genérico (evento, función, zona, asiento) y admite varias salas y una sola zona por función, sin cambios.
- El sitio se identifica ante el servicio en cada petición y opera con CORS desde su puerto local `5502`, según las propuestas PR5, PR8 y PR9, todavía pendientes de confirmación.
- No se requiere autenticación de usuario final; el servicio debe permitir comprar sin cuenta.
- **Dependencia crítica:** el servicio aún no carga los datos de `citas_web_2` porque P4 no está respondida. Con las respuestas del cliente ya se puede redactar esa respuesta.

## Condiciones del proyecto

- Interfaz web responsiva, con diseño glassmorphism.
- Sólo HTML5, CSS3 y JavaScript vanilla.
- Sin capacidad de audio MP3 por el momento.
- Paleta pendiente: `AGENTS.md` sólo define los marcadores de color primario y de acento. La propuesta de identidad visual se elaborará en la etapa de Propuesta y deberá validarse en contraste.
- El apartado de cinco minutos y el pago simulado son reglas del servicio; el sitio no las reimplementa.
- Ejecución local, sin servidor ni dominio. El calendario de entrega del ejercicio se confirma con el instructor.

## Riesgos identificados

| Riesgo | Efecto | Mitigación |
| --- | --- | --- |
| Dos personas confirman las mismas butacas casi al mismo tiempo | Sólo una conserva el apartado | El servicio responde con conflicto y el sitio aplica la regla acordada: rechazar la selección completa y pedir una nueva |
| Sin cuentas no hay forma de recuperar un boleto perdido | La persona pierde su compra | Entregar folio o código y permitir la consulta del boleto con ese dato |
| Sin cuentas no se puede aplicar el límite de diez butacas | Una persona podría acaparar butacas | Aceptar el riesgo con el cliente o limitar por transacción, no por persona |
| Faltan número de salas, capacidad y precio | No se puede cargar el catálogo ni calcular totales | Cerrar los datos antes de la etapa de Definición |
| P4 sin responder: no hay negocio ni datos de web_2 en el servicio | La demo no puede usar datos reales | Enviar la respuesta a P4 con estas definiciones y avanzar con datos de prueba |
| Paleta y marca sin definir | Decisiones visuales detenidas | Proponer opciones en la etapa de Propuesta |
| Poco tiempo y manejo desigual de git | Conflictos al integrar | Ramas por etapa y una sola persona que integra |

## Pendientes para etapas posteriores

1. Cerrar con el cliente: número de salas, capacidad de cada una y precio único con moneda.
2. Registrar en `ACUERDOS.md` la política de butacas ocupadas (rechazar la selección completa y pedir una nueva elección) como respuesta a P9.
3. Definir cómo se recupera un boleto sin cuenta (folio, código o correo).
4. Precisar el conteo diario de reservas: si incluye reservas vencidas y si se desglosa por sala o función.
5. Redactar la respuesta a P4 con el negocio y los datos del cineclub.
6. Definir la paleta primario y acento, las tipografías y la marca en la etapa de Propuesta.
7. Acordar la zona horaria de las funciones (P8) y el resultado del pago simulado (P10).
8. Definir el formato del código de boleto para dibujar el QR (PR7).
9. Redactar los criterios de aceptación en la etapa de Especificación.

## Referencias

- `../AGENTS.md` y `../TODOLIST.md` de este sitio.
- `RESPUESTAS_CLIENTE.md` y `CUESTIONARIO_PARA_RESERVA.md` en esta carpeta.
- `../../citas_service/docs/specs/ACUERDOS.md` para las preguntas P4, P5, P8, P9 y P10 y las propuestas PR4, PR5, PR7, PR8 y PR9.
- `../../citas_web_1/docs/ANTEPROYECTO.md` como referencia de formato y de negocio vecino.
