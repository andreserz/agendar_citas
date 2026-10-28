# Propuesta — citas_web_1

Estado: elaborada con la información disponible; las dependencias indicadas permanecen pendientes para los equipos responsables.

## Propósito

Ofrecer al público del Teatro Aquí nadie actúa normal una experiencia web responsiva para consultar la obra «¡Que no se entere la suegra!», elegir una función y sus asientos, y comprar boletos mediante un pago simulado. El sitio permitirá consultar las reservas y compras desde la cuenta del comprador.

## Alcance

- Consultar el teatro, la obra y los horarios sin iniciar sesión.
- Crear cuenta con nombre, correo y contraseña e iniciar sesión para comprar.
- Elegir una función y seleccionar hasta diez asientos por persona para esa función, consultando disponibilidad y precio.
- Reservar los asientos al pasar al pago, mostrar el tiempo restante y permitir un pago simulado exitoso o rechazado. Un rechazo permite reintentar mientras la reserva siga vigente.
- Mostrar confirmación, número de orden, boleto y código QR después de la compra; consultar reservas y compras desde la cuenta.
- Preparar la configuración de URL, contextos de servicios y referencia Swagger para la futura integración con la API REST.

La API REST, el backend y el otro frontend corresponden a otros equipos. La consolidación para backoffice debe permitir conocer comprador, asiento, fecha de compra y monto; el alcance y ubicación del backoffice quedan pendientes y no se asignan a este frontend.

## Oferta y reglas de negocio

La temporada comprende octubre, noviembre y diciembre de 2026. Cada jueves, viernes y sábado se ofrecen funciones a las 15:00, 19:00 y 21:00. El horario local y cualquier excepción al calendario están pendientes de definición.

Al pasar a pagar se solicita la reserva por hasta cinco minutos. Los asientos reservados no están disponibles para otros usuarios; si la compra no concluye a tiempo, vuelven a estar disponibles. La disponibilidad, expiración y compra requieren coordinación con los servicios y el backend para que todos los consumidores compartan el mismo estado. El contrato y el comportamiento ante conflictos o respuestas tardías se acordarán con el equipo responsable.

| Zona | Filas | Capacidad | Precio por asiento y función |
| --- | --- | ---: | ---: |
| Preferente | A–C | 30 | $800 MXN |
| General | D–I | 60 | $500 MXN |
| Balcón | J–L | 30 | $300 MXN |

Se contemplan diez asientos por fila y 120 en total. La ubicación de pasillos y espacios accesibles queda para una etapa posterior. Cargos y descuentos no se han definido.

## Experiencia propuesta

1. **Inicio y cartelera:** presentación del teatro y de la obra; acceso a fechas y horarios.
2. **Selección de función y asientos:** calendario y horarios, mapa con estados identificables, leyenda, precios y resumen del total.
3. **Cuenta:** registro e inicio de sesión requeridos para completar la compra; acceso a reservas y compras.
4. **Pago:** resumen, cuenta regresiva y simulación de éxito o rechazo inspirada en Mercado Pago. La interfaz debe identificar el carácter simulado del pago.
5. **Confirmación y consulta:** número de orden, boleto y código QR visibles para el comprador y consulta posterior desde su cuenta.

La navegación se adaptará a dispositivos móviles y escritorio. El diseño considerará teclado, foco visible, etiquetas, contraste y estados que no dependan exclusivamente del color; los detalles se acordarán y validarán en etapas posteriores.

## Identidad y componentes

La identidad aprobada combina humor teatral con glassmorphism: paneles translúcidos y legibles, fondo nocturno y detalles de iluminación. Paleta: ciruela `#3B174C` como primario, coral `#FF6B5E` como acento, fondo `#170F24`, texto `#FFF8F2` y dorado `#F5C77A` para detalles. La marca gráfica propuesta incluye un telón y una sonrisa.

Se plantea una colección propia de componentes reutilizables: botones, campos, tarjetas, diálogos, avisos, calendario, selector de horario, asiento, leyenda, resumen, temporizador y boleto. Se tomarán como referencia los patrones de composición de shadcn/ui y las microinteracciones de interior.dev, respetando el uso de HTML5, CSS3 y JavaScript vanilla. Las transiciones serán breves y admitirán movimiento reducido. No se contempla audio MP3.

## Dependencias y puntos por resolver

- El equipo de servicios y backend definirá contrato REST, autenticación, URL, contextos, referencia Swagger y mecanismos de reserva, pago simulado, usuarios, órdenes y boletos.
- Acordar responsabilidades y datos de consolidación para el backoffice, así como la generación y el uso del QR.
- Precisar accesibilidad y distribución del teatro, horario local, excepciones del calendario, estados de error y criterios de aceptación.
- Acordar cómo se probará el sitio mientras los servicios externos no estén disponibles. No se presupone que ya exista una API operativa.

## Resultado esperado

Un frontend que permita recorrer el proceso descrito y que pueda configurarse para integrarse con los servicios acordados. La implementación y su validación se realizarán en las etapas de Construcción y Pruebas, después de completar la Definición y la Especificación.
