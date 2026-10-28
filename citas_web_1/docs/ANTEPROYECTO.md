# Anteproyecto — citas_web_1: Teatro Aquí nadie actúa normal

Estado: Anteproyecto cerrado. La identidad visual fue aprobada; los detalles pendientes se atenderán en las etapas posteriores por los integrantes responsables.

## Objetivo y contexto

Crear un sitio web para el Teatro Aquí nadie actúa normal, donde se pueda consultar una obra de teatro, elegir asientos en un mapa, reservarlos temporalmente, simular su pago y consultar los lugares reservados y comprados.

El sistema compartido comprende dos frontends de negocios distintos (`citas_web_1` y `citas_web_2`), `citas_service` y `citas_backend`. El segundo sitio, los servicios REST y el backend están a cargo de otros equipos. Este anteproyecto corresponde al frontend de teatro `citas_web_1`.

## Oferta y usuarios

- La obra **¡Que no se entere la suegra!** durante octubre, noviembre y diciembre de 2026, con funciones los jueves, viernes y sábados a las 15:00, 19:00 y 21:00 horas.
- Un invitado puede consultar el teatro, la obra y sus horarios.
- Para comprar se requiere crear una cuenta con nombre, correo electrónico y contraseña. Cada persona puede comprar hasta diez asientos para una misma función.

## Flujo y reglas

1. El usuario elige la función y consulta el mapa de asientos.
2. Selecciona sus asientos y pasa a pagar. En ese momento comienza la reserva y una cuenta regresiva de hasta cinco minutos; durante la reserva otros usuarios no pueden solicitar esos asientos.
3. El usuario realiza un pago simulado inspirado en Mercado Pago, con escenarios de éxito y rechazo.
4. Si la compra no concluye antes del vencimiento, los asientos vuelven a estar disponibles. Si el pago es rechazado, el usuario puede reintentarlo mientras la reserva siga vigente.
5. El comprador puede consultar sus lugares reservados y comprados. Tras la compra se presentarán confirmación, número de orden, boleto y código QR. El boleto se mostrará al comprador; no se requiere envío por correo.

## Mapa propuesto

Distribución aprobada para una sala con escenario al frente y 120 asientos numerados:

| Zona | Filas | Asientos por fila | Total | Precio por asiento y función |
| --- | --- | ---: | ---: | ---: |
| Preferente | A–C | 10 | 30 | $800 MXN |
| General | D–I | 10 | 60 | $500 MXN |
| Balcón | J–L | 10 | 30 | $300 MXN |

La distribución, las zonas y los precios fueron aprobados. Quedan por definir los detalles de accesibilidad, pasillos y disponibilidad especial.

## Integración y consolidación

La API REST y el backend serán desarrollados por otros equipos. El proyecto deberá permitir configurar la URL, los contextos de los servicios y la referencia Swagger para adaptar la integración cuando estén disponibles. El contrato, autenticación y datos concretos de configuración están pendientes.

La consolidación deberá presentarse en un backoffice para saber quién compró cada asiento, cuándo y por qué monto. El alcance de ese backoffice y su relación con este frontend están pendientes; no se atribuye su construcción a `citas_web_1`.

## Condiciones del proyecto

- Interfaz web responsiva, con diseño glassmorphism.
- HTML5, CSS3 y JavaScript vanilla.
- Sin capacidad de audio MP3 por el momento.
- Colores primario y de acento aprobados: ciruela oscuro y coral, respectivamente.
- Pago simulado; no se ha definido una integración real con Mercado Pago.

## Pendientes para etapas posteriores

Los integrantes responsables definirán los detalles de accesibilidad y pasillos, el contrato y la configuración concreta de los servicios, y los criterios de aceptación en las etapas posteriores. También queda por determinar el alcance y la ubicación del backoffice.




## Identidad visual y diseño — aprobada

**Concepto:** una noche de teatro cómico con un aire moderno y cálido. La personalidad de «Aquí nadie actúa normal» combina humor cercano con una experiencia clara para elegir y comprar boletos. La obra destacada es «¡Que no se entere la suegra!».

**Paleta aprobada:** primario ciruela oscuro `#3B174C`, acento coral `#FF6B5E`, fondo nocturno `#170F24`, texto claro `#FFF8F2` y dorado suave `#F5C77A` para detalles teatrales. Verificar contraste en cada combinación durante el diseño; no depender únicamente del color para comunicar estados.

**Estilo:** glassmorphism con paneles translúcidos, bordes luminosos discretos y desenfoque sobre fondos oscuros de iluminación teatral. Usar superficies suficientemente opacas para conservar legibilidad y una alternativa sólida si el desenfoque no está disponible. Títulos expresivos y texto sencillo; tipografías y logotipo por definir. Propuesta de marca: un telón estilizado y un gesto de sonrisa, sin perder legibilidad en tamaños pequeños.

**Experiencia:** portada con obra, sinopsis y llamada a consultar funciones; selección de fecha y horario; mapa de asientos con leyenda y resumen de selección; registro e inicio de sesión; pago simulado con tiempo restante; confirmación con orden, boleto y QR; y cuenta para consultar reservas y compras. Adaptar la navegación y el mapa a pantallas pequeñas.

**Componentes reutilizables:** botones, tarjetas, campos, avisos, diálogo, selectores de fecha y horario, asiento, leyenda, resumen de compra, temporizador y boleto. Definir sus estados de reposo, foco, deshabilitado, carga y error cuando correspondan. Se propone tomar como referencia la composición y personalización de [shadcn/ui](https://ui.shadcn.com/docs/components), implementando los componentes con HTML5, CSS3 y JavaScript vanilla conforme a las restricciones del proyecto.

**Microinteracciones:** transiciones breves al seleccionar un asiento y actualizar el resumen, respuesta visual al elegir horario, confirmación de acciones y aviso claro al aproximarse el vencimiento. Inspiración: [interior.dev](https://www.interior.dev/). Evitar que el movimiento bloquee tareas y ofrecer una versión reducida mediante `prefers-reduced-motion`.

**Accesibilidad propuesta:** navegación por teclado, foco visible, etiquetas y mensajes claros, estados de asiento expresados con texto además de color, y anuncios apropiados de cambios relevantes. El tiempo restante debe ser legible sin avisos intrusivos continuos. Validar contraste, lector de pantalla y uso móvil durante las etapas correspondientes.

