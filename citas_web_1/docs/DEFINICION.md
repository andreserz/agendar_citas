# Definición — citas_web_1

Estado: en elaboración. Este documento registra lo acordado y señala los puntos que los integrantes responsables deben completar. No sustituye la especificación técnica ni el contrato de servicios.

## Objetivo y límites

El sitio del Teatro Aquí nadie actúa normal permitirá consultar la obra «¡Que no se entere la suegra!», seleccionar una función y asientos, reservar temporalmente, simular el pago y consultar reservas y compras. `citas_web_1` es el frontend del teatro; `citas_service`, `citas_backend` y `citas_web_2` son responsabilidad de otros equipos.

## Usuarios

- **Visitante:** consulta el teatro, la obra y sus horarios. Para comprar deberá crear una cuenta.
- **Comprador:** usuario con cuenta, registrada con nombre, correo y contraseña; puede comprar y consultar sus reservas y compras.
- **Equipo de gestión:** necesita consolidar quién compró qué asiento, cuándo y por qué monto en un backoffice. Su implementación y responsabilidades están pendientes de asignación.

## Oferta

Una obra durante octubre, noviembre y diciembre de 2026. Funciones los jueves, viernes y sábados a las 15:00, 19:00 y 21:00. Quedan por confirmar la zona horaria y las excepciones de calendario.

| Zona | Filas | Asientos por fila | Total | Precio por asiento y función |
| --- | --- | ---: | ---: | ---: |
| Preferente | A–C | 10 | 30 | $800 MXN |
| General | D–I | 10 | 60 | $500 MXN |
| Balcón | J–L | 10 | 30 | $300 MXN |

La distribución física de pasillos y espacios accesibles se detallará posteriormente.

## Requisitos funcionales

- **RF01:** Mostrar información del teatro, obra y funciones a visitantes y compradores.
- **RF02:** Permitir registrar una cuenta con nombre, correo y contraseña, e iniciar sesión para comprar.
- **RF03:** Permitir elegir una función y visualizar un mapa de asientos con su zona, precio y disponibilidad.
- **RF04:** Permitir seleccionar asientos y mostrar un resumen de selección y precio total.
- **RF05:** Limitar a diez los asientos comprados por una persona para la misma función, incluso si realiza más de una operación. Los servicios deberán proporcionar los datos y validaciones necesarios; su contrato queda pendiente.
- **RF06:** Al pasar a pagar, solicitar una reserva de los asientos seleccionados y mostrar una cuenta regresiva de hasta cinco minutos.
- **RF07:** Impedir que otros usuarios soliciten asientos reservados durante su vigencia y liberar los asientos si la compra no concluye dentro del plazo. La coordinación efectiva corresponde a los servicios y al backend.
- **RF08:** Simular el pago inspirado en Mercado Pago, con resultados exitoso y rechazado. Permitir reintentos tras un rechazo mientras siga vigente la reserva e identificar el pago como simulado.
- **RF09:** Presentar confirmación, número de orden, boleto y código QR al comprador después de una compra concluida.
- **RF10:** Permitir al comprador consultar sus lugares reservados y comprados desde su cuenta. El boleto se muestra en el sitio; no se requiere envío por correo.
- **RF11:** Preparar la configuración del proyecto para URL, contextos de servicios y referencia Swagger, una vez disponibles.

## Estados y comportamiento

Para la interfaz se identifican al menos los estados de asiento **disponible**, **seleccionado**, **reservado** y **comprado**. La selección es una acción del usuario; la reserva comienza al pasar a pagar. La clasificación detallada, su representación y el origen de cada estado se acordarán con el equipo de servicios. Las reservas vencidas devuelven los asientos a disponibilidad.

La interfaz deberá comunicar el tiempo restante, el rechazo del pago y el vencimiento. El tratamiento de conflictos de disponibilidad, fallos de red y respuestas que lleguen tras el vencimiento queda por acordar con los equipos responsables.

## Condiciones de diseño y tecnología

Interfaz responsiva con glassmorphism, HTML5, CSS3 y JavaScript vanilla; sin audio MP3 por el momento. Paleta aprobada: primario `#3B174C`, acento `#FF6B5E`, fondo `#170F24`, texto `#FFF8F2` y detalle `#F5C77A`. Se proponen componentes reutilizables y microinteracciones discretas inspiradas en shadcn/ui e interior.dev, con movimiento reducido y estados accesibles. Los detalles y su validación se definirán en etapas posteriores.

## Pendientes para los equipos responsables

1. Definir contrato de API, autenticación, URL, contextos y Swagger; responsabilidades y datos para usuarios, disponibilidad, reservas, expiración, pago simulado, órdenes, boletos y QR.
2. Acordar cómo aplicar de forma consistente el límite por persona y función, evitar reservas simultáneas del mismo asiento y resolver vencimientos, conflictos y respuestas tardías.
3. Precisar el alcance del backoffice y los datos de consolidación, incluyendo la fecha y el monto que se registrarán.
4. Definir espacios accesibles, pasillos, requisitos de accesibilidad, zona horaria y excepciones de funciones.
5. Completar criterios de aceptación, escenarios de error, pruebas e integración o simulación mientras los servicios no estén disponibles.
6. Determinar detalles de cuenta y recuperación, reglas de cancelación o modificación y cargos o descuentos, si se requieren; no están acordados en este documento.

## Referencias

Consultar `ANTEPROYECTO.md` y `PROPUESTA.md` en este mismo directorio para el contexto y las decisiones previas.
