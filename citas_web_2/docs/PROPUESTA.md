# Propuesta — citas_web_2

Estado: propuesta de experiencia e identidad visual. La paleta y las tipografías quedan listas para construir la interfaz; falta la aprobación del equipo y del cliente, y el nombre comercial de la marca. Los contrastes de la paleta están calculados según WCAG 2.1 AA.

## Propósito

Ofrecer al público del cineclub una experiencia web responsiva para consultar la cartelera de *Spider-Man*, elegir función y sala, seleccionar butacas numeradas, apartarlas cinco minutos, pagar de forma simulada y recibir el boleto con su código QR. La compra no requiere cuenta: el folio de la orden es la llave para recuperar el boleto.

## Alcance

- Consultar la cartelera con 30 funciones diarias, agrupadas por formato, con precio, idioma y clasificación.
- Elegir una función y ver el mapa de las 80 butacas de la sala con sus estados.
- Seleccionar butacas, ver el resumen con precio por butaca y total, y apartarlas al pasar a pagar.
- Mostrar la cuenta regresiva de cinco minutos, el pago simulado con resultado aprobado o rechazado, y los avisos de conflicto y vencimiento con texto claro.
- Mostrar la confirmación con número de orden, folio, boleto y QR, y permitir recuperar el boleto escribiendo el folio.
- Mostrar al operador el conteo diario de reservas creadas.
- Operar en modo `api` contra el servicio y en modo `demo` con la semilla del contrato, con aviso visible.
- Ejecutarse en el puerto local `5502`, sin registro, sin inicio de sesión y sin historial de compras (RN04).

Quedan fuera: cuentas de comprador, límite de butacas por persona, envío de correo, audio MP3, pagos reales y desglose del conteo por sala.

## Oferta y reglas de negocio

El cineclub abre de lunes a domingo con 10 salas de 80 butacas numeradas en una sola zona (filas A–H, números 1–10). Cada sala ofrece tres funciones diarias de dos horas.

| Salas | Formato | Precio por butaca | Funciones |
| --- | --- | ---: | --- |
| 1–5 | 2D | $100 MXN | 13:00, 16:00 y 20:00 |
| 6–10 | 3D | $150 MXN | 12:30, 15:30 y 18:30 |

Todas las butacas de una función cuestan lo mismo: el precio lo fija el formato, no la butaca. El idioma y la clasificación se muestran como «Por confirmar» mientras el cliente no los entregue.

Al confirmar, la reserva es todo o nada: si una butaca dejó de estar disponible, se rechaza la selección completa, se muestra el mapa actualizado con las butacas en conflicto y se pide elegir de nuevo. Los errores `409` y `410` se explican sin jerga técnica. El conteo diario suma las reservas creadas en `America/Mexico_City`, sin importar su estado final.

## Experiencia propuesta

1. **Cartelera:** encabezado con la película vigente, funciones de hoy agrupadas por formato y precio; el aviso de modo demo se muestra arriba si aplica.
2. **Mapa de butacas:** sala, fecha, horario y formato; mapa de 80 butacas con estados disponible, seleccionada, apartada y vendida; leyenda, precio y resumen que se actualiza al elegir.
3. **Resumen:** butacas elegidas, precio por butaca y total; acciones para volver al mapa o pasar a pagar.
4. **Pago:** resumen, cuenta regresiva visible y aviso de pago simulado con las dos tarjetas de prueba; un rechazo permite reintentar mientras la reserva siga activa.
5. **Confirmación:** número de orden, folio, boleto y QR; si el QR no se dibuja, se muestra el código textual de 12 caracteres.
6. **Recuperación:** campo de folio y consulta de la orden para volver a ver los boletos, sin cuenta.
7. **Operador:** rango de fechas y total de reservas creadas por día, con la misma fecha en `America/Mexico_City`.

La navegación es de una sola página con vistas intercambiables, pensada primero para 390 px y luego para escritorio. Los estados nunca dependen sólo del color: cada uno suma forma, borde o etiqueta.

## Identidad y componentes

### Concepto

«Sala a oscuras, pantalla encendida»: fondo azul noche, paneles de vidrio translúcido y un ámbar de proyector como única luz de acción. El vidrio se usa para agrupar información y dar profundidad, nunca para bajar el contraste del texto.

### Paleta y contraste

| Token | Valor | Uso | Contraste medido |
| --- | --- | --- | --- |
| Color primario | `#1B4D6B` | Encabezados, superficies sólidas, boleto | Texto `#F2F6FF` sobre primario: **8.4:1** |
| Color de acento | `#F2B544` | Acción principal, foco, cuenta regresiva, precio | Tinta `#0A0F18` sobre acento: **10.5:1** |
| Fondo | `#0B1220` | Fondo de la página | Texto `#F2F6FF`: **17.3:1** |
| Fondo elevado | `#111B2E` | Vidrio base bajo los paneles | Texto `#F2F6FF`: **15.9:1** |
| Superficie de vidrio | `#242D3F` (equivalente sólido de `rgba(255,255,255,.08)` sobre `#111B2E`) | Tarjetas y paneles | Texto `#F2F6FF`: **12.8:1**; secundario `#B9C6DA`: **8.0:1** |
| Texto | `#F2F6FF` | Texto principal | — |
| Texto secundario | `#B9C6DA` | Ayudas, leyendas, metadatos | Sobre fondo: **10.8:1**; sobre vidrio: **8.0:1** |
| Primario claro | `#2A6F8F` | Trazos sobre el fondo de la página | Sobre fondo: **3.4:1** (mínimo 3:1 para componentes) |
| Borde interactivo | `#8FB3C9` | Contornos de controles sobre vidrio | Sobre vidrio: **6.2:1** |
| Tinta | `#0A0F18` | Texto sobre acento | Sobre acento: **10.5:1** |

Reglas de uso:

- El acento se reserva para una sola acción principal por pantalla, el anillo de foco y la cuenta regresiva; no se usa como fondo de textos largos.
- Los paneles usan `background: rgba(255,255,255,.08)`, borde `rgba(255,255,255,.18)` y desenfoque moderado; el contorno de los controles usa el borde interactivo, y sin desenfoque el texto sigue siendo legible.
- Los estados de butaca combinan color, borde y glifo: disponible (contorno), seleccionada (relleno acento), apartada (rayado) y vendida (relleno apagado con aspa).
- Todo par texto/fondo de la interfaz debe medir al menos 4.5:1; los componentes gráficos, 3:1.

### Tipografías

| Rol | Fuente | Detalle |
| --- | --- | --- |
| Títulos | `'Trebuchet MS', 'Segoe UI', system-ui, sans-serif` | Peso 700, caja alta en rótulos cortos, interletrado leve |
| Cuerpo | `system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif` | 16 px base, línea 1.5 |
| Cifras | `ui-monospace, 'Cascadia Mono', 'Consolas', 'Courier New', monospace` | Folio, código de boleto y cuenta regresiva con números tabulares |

No se descargan fuentes: el sitio funciona sin red y sin dependencias externas.

### Marca y componentes

El nombre comercial del cineclub aún no lo entrega el cliente; se usa «Cineclub» como rótulo provisional. La marca gráfica propuesta es un monograma de butaca con haz de proyector, en SVG en línea, sobre una tarjeta de vidrio; se reemplaza por el logotipo definitivo cuando exista.

Componentes propios: encabezado, aviso de modo, tarjeta de función, selector de formato, mapa de butacas, leyenda, resumen de compra, temporizador, campo de folio, tarjeta de boleto con QR, avisos de error y tabla de conteo diario.

### Movimiento y accesibilidad

Transiciones de 120 a 200 ms con `ease-out`; se desactivan con `prefers-reduced-motion`. Foco visible de 2 px en acento, objetivos táctiles de al menos 44 px, etiquetas asociadas a los campos, jerarquía de encabezados y textos alternativos en el QR. La revisión se hace a 390 px sin desplazamiento horizontal y con teclado.

## Dependencias y puntos por resolver

- Aprobación de esta propuesta y del nombre comercial por el equipo y el cliente.
- Confirmación del cliente sobre folio y conteo diario para cerrar la Definición.
- El QR se dibuja en el sitio con la librería vendorizada que usa `citas_web_1`; el contrato sólo entrega el código de 12 caracteres (D24).
- Los datos de idioma y clasificación dependen de lo que publique el servicio; mientras tanto, «Por confirmar».
- La cuenta regresiva depende de `expiraEn` del servicio; el sitio no recalcula la regla.

## Resultado esperado

Una interfaz de cineclub reconocible, legible y rápida, que permita recorrer la compra completa sin cuenta, recuperar el boleto por folio y consultar el conteo diario, con la identidad lista para validarse antes de construir `app/`.
