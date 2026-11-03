# Respuesta a P4 — negocio y datos de citas_web_2

Documento de trabajo del equipo web 2. Su destino es `citas_service/docs/specs/ACUERDOS.md`, que lo registra el líder de contrato del servicio. Fecha: 3 de noviembre de 2026.

## 1. Respuesta a la pregunta P4

**P4 — ¿Qué negocio es web_2 y qué datos necesita (asientos numerados, zonas, cupo general)?**

> **Negocio:** cineclub con **10 salas en paralelo**, con películas distintas a la misma hora. Cada función pertenece a una sala y tiene película, fecha, horario, formato (2D o 3D), idioma y clasificación.
>
> **Butacas:** numeradas por fila y número, en **una sola zona por función**. No hay precios diferenciados por butaca ni acceso general sin butaca asignada.
>
> **Precio:** lo determina el **formato de la función**: **$100 MXN en 2D y $150 MXN en 3D**. Todas las butacas de una misma función cuestan lo mismo.
>
> **Cupo:** 10 salas de 80 butacas cada una; 800 butacas en total.
>
> **Cuentas:** web_2 **no requiere registro ni inicio de sesión**. La compra es como invitado y el sitio se identifica ante el servicio en cada petición; no se identifica a la persona.
>
> **Consolidación:** el cliente pide por ahora sólo el conteo de reservas por día. No requiere detalle de comprador, montos ni exportación.
>
> **Moneda:** pesos mexicanos (MXN).

## 2. Datos que web_2 necesita del servicio

| Entidad | Campos necesarios | Para qué |
| --- | --- | --- |
| Evento (película) | `id`, título, sinopsis, clasificación, duración, idioma | Cartelera y ficha de la película |
| Sala | `id`, nombre, capacidad | Mostrar a qué sala pertenece la función |
| Función | `id`, evento, sala, fecha y hora, formato, precio | Elegir función y calcular el total |
| Asiento | `id`, fila, número, zona, estado | Dibujar el mapa de butacas |
| Reserva | `id`, butacas apartadas, `expiraEn` | Cuenta regresiva de cinco minutos |
| Boleto | código de texto por boleto | Dibujar el QR en el sitio |
| Conteo diario | número de reservas por día | Consolidación mínima pedida por el cliente |

El contrato actual (evento, función, zona, asiento) cubre estos datos sin cambios. La única diferencia con el teatro es que la zona es una sola por función y el precio se repite para todas sus butacas, aunque cambie entre funciones según el formato.

## 3. Reglas que web_2 confirma

| Pregunta o propuesta | Postura de web_2 |
| --- | --- |
| PR1 — apartado de 5 minutos | De acuerdo; lo controla el servicio |
| PR3 — `409` conflicto y `410` expirado | De acuerdo; el sitio los muestra con un mensaje claro |
| PR4 — máximo 10 butacas por persona | **No aplica a web_2**: sin cuentas no hay forma de identificar a la persona |
| PR5 — `/api/v1`, Swagger e identificación del sitio | De acuerdo; la identificación del sitio sí, la del usuario final no |
| PR7 — código de texto por boleto para QR | De acuerdo; web_2 lo dibuja |
| PR8 — puertos locales (`5502` para web_2) | De acuerdo |
| PR9 — CORS desde el navegador | De acuerdo, desde `http://localhost:5502` |
| P5 — quién maneja las cuentas | web_2 no usa cuentas; que el servicio no las exija para comprar |
| P8 — zona horaria | De acuerdo con `America/Mexico_City` si es lo que propone el servicio |
| P9 — butacas ocupadas | **Rechazar la reserva completa** con `409` e indicar las butacas en conflicto; no apartar parciales |
| P10 — resultado del pago simulado | Pendiente de acordar; web_2 puede enviar el resultado esperado en la petición para la demo |

## 4. Consecuencias que el servicio debe conocer

1. **Órdenes sin cuenta:** si el servicio exige un comprador para crear la orden, web_2 necesita saber qué identificador enviar. Propuesta: un folio generado por el sitio.
2. **Límite de butacas:** al no haber identificación, el servicio no puede aplicar el máximo de diez por persona para este sitio.
3. **Recuperación del boleto:** sin cuenta, el comprador sólo puede volver a ver su boleto con el folio o el código. El servicio debe permitir consultar la orden por ese dato.
4. **Conteo diario:** hace falta saber si el servicio expone el conteo de reservas por día o si web_2 debe calcularlo con los datos disponibles.
5. **Precio por formato:** el servicio debe entregar el precio de cada función (2D o 3D); web_2 no lo calcula, sólo lo muestra y lo suma.

## 5. Texto listo para el chat del grupo

> Hola. Respondemos P4 de web_2. El negocio es un **cineclub con 10 salas en paralelo de 80 butacas cada una** (800 en total): cada función tiene película, sala, fecha, horario y formato, con **butacas numeradas en una sola zona**. El precio depende del formato: **$100 MXN en 2D y $150 MXN en 3D** por boleto. No usamos cuentas de usuario: la compra es como invitado, así que el límite de 10 butacas por persona no aplica para nosotros. De consolidación, el cliente sólo pide el **conteo de reservas por día**. Sobre P9, confirmamos **rechazar la reserva completa** si alguna butaca ya no está disponible. Sólo falta confirmar la cartelera y los horarios. ¿Nos confirman si el servicio puede crear órdenes sin cuenta de usuario y si expone el conteo diario?

## 6. Pendiente del lado de web_2

- Confirmar si la cartelera rota o se limita a *Spider-Man*, y los horarios.
- Cómo se recupera un boleto sin cuenta: folio, código o correo.
- Enviar esta respuesta al equipo de servicio para que la registre en `ACUERDOS.md`.
