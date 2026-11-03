# Anteproyecto — citas_web_2: Cineclub con reserva de lugares

Estado: borrador para revisión del equipo. El negocio se documenta como **propuesta** y está sujeto a confirmación con el equipo de servicio (pregunta **P4** de `citas_service/docs/specs/ACUERDOS.md`). La identidad visual y la paleta quedan pendientes.

## Objetivo y contexto

Crear el sitio web de un cineclub donde una persona pueda consultar la cartelera, elegir una función, seleccionar butacas numeradas en un mapa de la sala, apartarlas durante cinco minutos, pagar de forma simulada y recibir su boleto con código QR. Después podrá consultar sus apartados vigentes y sus compras.

El sistema compartido está formado por cuatro áreas a cargo de equipos distintos:

| Carpeta | Responsable | Relación con este sitio |
| --- | --- | --- |
| `citas_web_1` | Equipo web 1 (Teatro Aquí nadie actúa normal) | Otro frontend del mismo servicio; negocio distinto |
| `citas_web_2` | Este equipo | Frontend del cineclub |
| `citas_service` | Equipo de servicio | API REST con las reglas de apartado, pago y boletos |
| `citas_backend` | Equipo backend | Base de datos; motor y esquema aún no definidos |

Este anteproyecto corresponde únicamente a `citas_web_2`. La API, la base de datos y el sitio del teatro son responsabilidad de otros equipos y no se modifican desde aquí.

## Oferta y usuarios

- El cineclub programa funciones diarias en una sala con butacas numeradas. Cada función tiene película, fecha, horario, idioma y clasificación.
- Un invitado puede consultar la cartelera, las funciones, el mapa de butacas y los precios sin registrarse.
- Para comprar se requiere una cuenta. La forma de registro e inicio de sesión está pendiente (P5): todavía no se decide si la maneja el servicio o cada sitio.
- Una misma persona puede tener hasta **diez butacas por función**, contando sus compras y sus apartados vigentes, aunque los haya hecho en varias operaciones.
- El pago es **simulado**: no se integra una pasarela real.

## Flujo y reglas

1. La persona consulta la cartelera y elige una función.
2. Consulta el mapa de butacas con su estado: disponible, apartada o vendida.
3. Selecciona sus butacas y confirma. En ese momento comienza el apartado y una cuenta regresiva de **cinco minutos**; mientras siga vigente, nadie más puede solicitar esas butacas.
4. Realiza el pago simulado, que puede resultar en éxito o rechazo. Si es rechazado, puede reintentarlo mientras el apartado siga vigente.
5. Si el apartado vence sin pago, las butacas se liberan automáticamente y vuelven a estar disponibles. La persona también puede abandonar el apartado y liberarlas antes del vencimiento.
6. Si al confirmar una selección alguna butaca ya no está disponible, el servicio responde con conflicto y el sitio debe avisar cuáles fallaron y actualizar el mapa. Si el apartado ya expiró, se informa y se vuelve a la selección.
7. Tras una compra exitosa se muestran la confirmación, el número de orden, el boleto y su código QR. El boleto se consulta en el sitio; no se envía por correo.
8. Desde su cuenta, el comprador consulta sus apartados vigentes y sus compras anteriores.

## Mapa propuesto de la sala

Propuesta de distribución para una sala única con pantalla al frente y 90 butacas numeradas. Está sujeta a aprobación del equipo y a lo que se acuerde en P4.

| Zona | Filas | Butacas por fila | Total | Precio por butaca y función |
| --- | --- | ---: | ---: | ---: |
| VIP reclinable | A–B | 10 | 20 | $180 MXN |
| General | C–H | 10 | 60 | $120 MXN |
| Frente | I | 10 | 10 | $90 MXN |

La fila I es la más cercana a la pantalla; por eso su precio es menor. Quedan por definir los pasillos, los espacios para silla de ruedas y acompañante, y si existirán funciones con precio especial.

## Alcance

**Incluye**

- Cartelera y consulta de funciones con fecha, horario y disponibilidad.
- Mapa de butacas por función, con zonas, precios y leyenda.
- Selección de butacas, apartado temporal y cuenta regresiva visible.
- Pago simulado con escenarios de éxito y rechazo, y reintento mientras el apartado siga vigente.
- Confirmación de compra con número de orden, boleto y código QR.
- Cuenta del comprador con sus apartados vigentes y sus compras.
- Interfaz web responsiva con diseño glassmorphism, en HTML5, CSS3 y JavaScript vanilla.

**No incluye**

- La API, sus reglas y su contrato: son de `citas_service`.
- La base de datos, su motor y su esquema: son de `citas_backend`.
- Pasarela de pago real; el pago es simulado.
- Backoffice de consolidación (quién compró qué butaca, cuándo y por qué monto): su alcance y responsable están sin asignar.
- Envío de boletos por correo y capacidad de audio MP3.
- Servidor o dominio propios; el sitio se ejecuta de forma local.

## Integración con el servicio

- El sitio consume la API REST bajo `/api/v1`, documentada con Swagger. La URL de la API, los contextos y la referencia Swagger deben ser configurables para adaptarse cuando el servicio los publique.
- El contrato es genérico (evento, función, zona, asiento), lo que permite representar la cartelera y las butacas del cineclub sin pedir cambios específicos.
- El sitio se identifica ante el servicio en cada petición y opera con CORS desde su puerto local `5502`, según las propuestas PR5, PR8 y PR9, todavía pendientes de confirmación.
- **Dependencia crítica:** el servicio aún no carga los datos de `citas_web_2` porque P4 no está respondida. Mientras se resuelve, el sitio trabajará con datos de prueba locales o con un mock generado del contrato.

## Condiciones del proyecto

- Interfaz web responsiva, con diseño glassmorphism.
- Sólo HTML5, CSS3 y JavaScript vanilla.
- Sin capacidad de audio MP3 por el momento.
- Paleta pendiente: `AGENTS.md` sólo define los marcadores de color primario y de acento. La propuesta de identidad visual se elaborará en la etapa de Propuesta y deberá validarse en contraste.
- El apartado de cinco minutos y el pago simulado son reglas del servicio; el sitio no las reimplementa, sólo las muestra y reacciona a sus respuestas.
- Ejecución local, sin servidor ni dominio. El calendario de entrega del ejercicio se confirma con el instructor: la referencia del plan del servicio era el lunes 2 de noviembre de 2026.

## Riesgos identificados

| Riesgo | Efecto | Mitigación |
| --- | --- | --- |
| P4 sin responder: no hay negocio ni datos de web_2 en el servicio | La demo no puede usar datos reales | Cerrar P4 con el equipo de servicio y avanzar con datos de prueba y mock del contrato |
| El negocio cambia después de este documento | Retrabajo en documentos y pantallas | Modelo genérico del servicio y documento dividido por secciones fáciles de sustituir |
| Paleta y marca sin definir | Decisiones visuales detenidas | Proponer opciones en la etapa de Propuesta y aprobarlas antes de la Construcción |
| Nadie es dueño de las cuentas de usuario (P5) | No se sabe cómo identificar a la persona para el límite de diez butacas | Diseñar el límite sobre un identificador genérico de comprador |
| Dos personas apartan la misma butaca | Doble venta | Confiar en el apartado atómico del servicio y manejar el conflicto con un mensaje claro |
| Poco tiempo y manejo desigual de git | Conflictos al integrar | Ramas por etapa y una sola persona que integra |
| El QR depende del formato del código de boleto (PR7) | El boleto no se puede dibujar | Acordar el formato antes de la Especificación |

## Pendientes para etapas posteriores

1. Confirmar el negocio, el nombre comercial y los datos del cineclub con el equipo de servicio (P4). Todo lo específico del negocio en este documento es una propuesta.
2. Definir la paleta primario y acento, las tipografías y la marca.
3. Acordar quién maneja el registro e inicio de sesión, y cómo se identifican el comprador y el sitio (P5).
4. Acordar el formato de errores de conflicto y de apartado expirado, y si una selección con butacas ocupadas se rechaza completa o sólo se apartan las libres (P9).
5. Acordar cómo se elige el resultado del pago simulado (P10) y la zona horaria de las funciones (P8).
6. Acordar la moneda y los precios definitivos de web_2.
7. Definir el formato del código de boleto para dibujar el QR (PR7).
8. Determinar el alcance y el responsable del backoffice de consolidación.
9. Redactar los criterios de aceptación en la etapa de Especificación.

## Referencias

- `../AGENTS.md` y `../TODOLIST.md` de este sitio.
- `../../citas_service/docs/ANTEPROYECTO.md` y `../../citas_service/docs/DEFINICION.md` para las reglas de apartado, pago y boletos.
- `../../citas_service/docs/specs/ACUERDOS.md` para las preguntas P4, P5, P8, P9 y P10 y las propuestas PR4, PR5, PR7, PR8 y PR9.
- `../../citas_web_1/docs/ANTEPROYECTO.md` como referencia de formato y de negocio vecino.
