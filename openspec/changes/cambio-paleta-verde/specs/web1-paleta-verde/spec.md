# Spec Delta — web1-paleta-verde

## Purpose

Define el color de marca, el de los estados y el contraste con el que se resuelve la interfaz de `citas_web_1`, de modo que la familia roja quede sustituida por la verde y los estados sigan siendo distinguibles entre sí.

## ADDED Requirements

### Requirement: Paleta verde sin colores rojos
La hoja de estilos de `citas_web_1` SHALL definir el color de acento y el color de alerta dentro de la familia verde, y no SHALL conservar ningún color de la familia roja (rojos, corals o rosas) en estilos, degradados, tintes `rgba(...)` o colores en línea dentro de `app/`. El nombre de cada token de color SHALL corresponder a su tono real.

**Estado:** pendiente de implementación.

#### Scenario: Búsqueda de rojos residuales
- **WHEN** se revisan `citas_web_1/app/css/styles.css` y los `stop-color` de los SVG de `app/js/`
- **THEN** no queda ninguno y el acento del sitio se ve en verde

#### Scenario: Token renombrado
- **WHEN** se inspecciona la sección `:root` de la hoja de estilos
- **THEN** los tokens se llaman `--verde-acento`, `--verde-oscuro`, `--verde-claro` y `--verde-alerta` y cada nombre describe el tono que representa

### Requirement: Estados distinguibles entre sí
El verde de acento, el verde de éxito y el verde de alerta SHALL ser tonos distintos, de modo que un usuario pueda diferenciar un botón primario de un aviso correcto y de un aviso de error sin depender únicamente del matiz. Todo estado visual SHALL seguir acompañado de texto, icono o forma que lo identifique.

**Estado:** pendiente de implementación.

#### Scenario: Botón primario frente a aviso de error
- **WHEN** se comparan el botón primario y el componente de error del sitio
- **THEN** se distinguen por tono y por su texto o icono, y no solo por el color

### Requirement: Contraste verificable
Todo texto visible sobre un fondo verde SHALL alcanzar una relación de contraste mínima de 4.5:1 (WCAG AA) y los bordes y textos de tamaño grande, 3:1. El fondo nocturno del sitio SHALL conservarse sin cambios.

**Estado:** pendiente de implementación.

#### Scenario: Texto sobre botón verde
- **WHEN** se mide el texto de un botón con fondo verde de acento
- **THEN** la relación de contraste es de al menos 4.5:1 y el texto es legible sin depender del peso de la fuente

### Requirement: Documentación coherente con la interfaz
La documentación de `citas_web_1` (`ANTEPROYECTO.md`, `PROPUESTA.md`, `DEFINICION.md`, `ESPECIFICACION.md` y `TODOLIST.md`) SHALL indicar los tonos verdes vigentes y no SHALL seguir citando los tonos rojos sustituidos.

**Estado:** pendiente de implementación.

#### Scenario: Paleta aprobada del teatro
- **WHEN** se lee `citas_web_1/docs/ANTEPROYECTO.md` o `citas_web_1/docs/DEFINICION.md`
- **THEN** el acento indicado es verde y coincide con el valor del token `--verde-acento`

### Requirement: Alcance limitado a `citas_web_1`
El cambio de color SHALL aplicarse solo a `citas_web_1`. `citas_web_2` SHALL conservar su paleta original, con su token de error en la familia roja.

**Estado:** pendiente de implementación.

#### Scenario: `citas_web_2` sin cambios
- **WHEN** se revisa `citas_web_2/app/css/styles.css`
- **THEN** mantiene el token `--red` con su valor original y no contiene ningún token `--green-alert`
