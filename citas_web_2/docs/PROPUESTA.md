# Propuesta — identidad y experiencia de citas_web_2

**Estado:** propuesta para revisión del equipo.
**Etapa:** Propuesta.
**Producto:** compra de boletos para el cineclub.

## Experiencia

La experiencia tendrá una estética de cine contemporáneo: fondo azul noche, superficies translúcidas, reflejos cálidos y tipografía editorial para títulos. La cartelera será la entrada principal; desde cada función se podrá abrir el mapa, elegir butacas y completar el pago simulado sin crear una cuenta.

La interfaz mostrará primero la información necesaria para decidir (horario, sala, formato y precio), mantendrá visible el resumen durante la elección y comunicará de forma directa los conflictos, vencimientos y resultados del pago. La navegación incluirá cartelera, recuperación de boleto y reporte diario. El diseño será responsivo y usará HTML5, CSS3 y JavaScript vanilla.

## Identidad visual

| Token | Color | Uso |
| --- | --- | --- |
| Primario | `#18324A` | Navegación, superficies principales y encabezados. |
| Acento | `#E0A44B` | Acciones principales, selección y detalles cálidos. |
| Fondo | `#0B1220` | Fondo azul noche. |
| Texto principal | `#F7F4EF` | Texto sobre superficies oscuras. |
| Texto secundario | `#C8D0DC` | Ayudas, metadatos y descripciones. |
| Superficie glass | `rgba(24, 50, 74, 0.68)` | Paneles translúcidos con desenfoque y borde suave. |
| Estado disponible | `#7FD1AE` | Butaca disponible, acompañado de etiqueta/leyenda. |
| Estado apartada | `#E0A44B` | Butaca apartada, acompañado de etiqueta/leyenda. |
| Estado vendida | `#9AA6B5` | Butaca vendida, acompañado de etiqueta/leyenda. |
| Estado de error | `#FF8F86` | Conflictos y errores con texto explicativo. |

Los colores de estado no reemplazan etiquetas, iconos ni texto accesible. La selección de una butaca tendrá además un contorno visible.

## Tipografía

- Títulos: `Georgia`, con serif, para una voz editorial asociada al cine.
- Interfaz y lectura: `system-ui`, con fuentes del sistema como alternativa.
- Se evitarán fuentes remotas para mantener la aplicación autónoma y rápida.

## Componentes

- Tarjetas de funciones de vidrio esmerilado con metadatos y acción **Elegir asientos**.
- Mapa de butacas en cuadrícula, con leyenda persistente y foco de teclado visible.
- Panel de resumen con función, asientos, precio unitario y total.
- Indicador de tiempo restante en checkout, con aviso cuando la reserva está por vencer.
- Boleto con folio y código QR, conservando el código textual como alternativa legible.
- Formularios de recuperación y reporte con errores junto al campo correspondiente.

## Accesibilidad y contraste

La combinación de texto claro con fondo oscuro está pensada para superar WCAG AA. Los botones de acento usarán texto oscuro (`#17202B`) en lugar de texto claro. La interfaz mantendrá foco visible, etiquetas de formulario, anuncios de estado y estados de butaca que no dependan sólo del color.

Contrastes calculados según la fórmula de luminancia relativa WCAG:

| Combinación | Relación aproximada | Resultado AA |
| --- | ---: | --- |
| `#F7F4EF` sobre `#0B1220` | 17.1:1 | Sí |
| `#C8D0DC` sobre `#0B1220` | 12.1:1 | Sí |
| `#E0A44B` sobre `#0B1220` | 8.5:1 | Sí |
| `#17202B` sobre `#E0A44B` | 7.5:1 | Sí |
| `#18324A` sobre `#F7F4EF` | 12.0:1 | Sí |

Los contrastes se volverán a revisar con los fondos reales de las superficies glass al integrar la interfaz.

## Aplicación de marca

El nombre de navegación será **Cineclub** mientras el cliente no proporcione nombre o logotipo. No se inventará material promocional ni información de la película: la ficha se alimenta del catálogo y usa `Por confirmar` para idioma o clasificación cuando así lo entregue el servicio.
