# BCK — Propuesta de respuesta a P15–P19 (web_2 y servicio)

| Campo | Valor |
| --- | --- |
| Proyecto | `citas_backend` |
| Tipo | Propuesta de respuesta a preguntas de otros equipos (no cambia todavía ningún documento aprobado) |
| Estado | **Aprobado** por la usuaria el 6 nov 2026 |
| Fecha | 6 de noviembre de 2026 |
| Fecha límite de las preguntas | sáb 7 nov 2026 |
| Fuentes | `citas_service/docs/specs/ACUERDOS.md` (P15–P19, D8, D13, D14), `citas_service/docs/specs/contrato-datos-backend.md`, `citas_service/docs/ESPECIFICACION.md` §1 y §3.7, `citas_web_2/docs/contexto_negocio/RESPUESTA_P4.md`, `docs/BCK_DEFINICION.md` §5–§7, `docs/BCK_PROPUESTA.md` §3.6 y §4 |

Cuando se apruebe, los cambios se aplican en `BCK_ESPECIFICACION.md` (etapa 4) y en los scripts de la etapa 5. Como los scripts `.sql` todavía no se han entregado, las columnas nuevas entran directamente en `02_tablas.sql` y no hace falta un script de cambio aparte. D8 aplica a partir de la primera entrega. En el diccionario se marcan como cambios posteriores a la Definición.

---

## 0. Resumen

| # | Pregunta | Respuesta propuesta | Cambio en la BD |
| --- | --- | --- | --- |
| P15 | Reserva u orden sin cuenta (web_2) | `IdComprador` **admite nulos** en `Reservas` y `Ordenes`. Cada sitio indica si exige comprador (`Sitios.RequiereComprador`). No se crea un comprador «invitado» ni se usa un folio del sitio. | 2 columnas cambian a nulas y 1 columna nueva. Se agrega el error 53005. |
| P16 | Sala, formato, idioma, clasificación y duración | **Se agregan.** La sala es una `Zona` y la función apunta a ella (`Funciones.IdZona`). Formato e idioma van en `Funciones`; clasificación y duración van en `Eventos`. Todas admiten nulos para no afectar a web_1. | 5 columnas nuevas y 1 restricción única ajustada |
| P17 | Recuperar el boleto sin cuenta | **Sí**, con el procedimiento nuevo SP18 `spOrdenes_ObtenerPorCodigo`, que busca por el **código del boleto**. Por el folio solo **no**, porque es consecutivo y fácil de adivinar. | 1 SP nuevo, sin índice nuevo |
| P18 | Conteo de reservas por día | **Procedimiento nuevo** SP19 `spReservas_ContarPorDia`. SP16 no sirve: sólo lista boletos pagados. | 1 SP nuevo y 1 índice. Se agrega el error 53007. |
| P19 | Últimos 4 dígitos de la tarjeta | **Sí.** `IntentosPago.UltimosDigitos CHAR(4)`, recibido en SP12 y SP13 y devuelto en SP14 y SP18. | 1 columna nueva. Se agrega el error 53006. |

---

## 1. P15 — Reservas y órdenes sin cuenta

### Opciones evaluadas

| Opción | Ventaja | Problema |
| --- | --- | --- |
| A. Comprador «invitado» por sitio | No cambia las FK | `Compradores` exige correo único y hash, así que habría que inventarlos. Además, **RN09 sumaría todas las compras de web_2 como si fueran de una sola persona** y bloquearía la función completa después de 10 asientos. |
| B. Folio generado por el sitio (propuesta de web_2) | El sitio controla su referencia | Duplica el `Folio` que ya genera la BD (RN19, `ORD-000123`). Tampoco resuelve la FK no nula. |
| **C. `IdComprador` admite nulos (recomendada)** | Es el modelo real: una compra de invitado no tiene comprador. No guarda datos personales inventados. | Hay que ajustar RN06 y RN09 para que se apliquen sólo cuando hay comprador. |

### Cambios propuestos

| Tabla | Columna | Cambio |
| --- | --- | --- |
| `Reservas` | `IdComprador` | `INT NOT NULL` → `INT NULL` (se conserva `FK_Reservas_Compradores`) |
| `Ordenes` | `IdComprador` | `INT NOT NULL` → `INT NULL` (se conserva `FK_Ordenes_Compradores`) |
| `Sitios` | `RequiereComprador` (**nueva**) | `BIT NOT NULL`, `DF_Sitios_RequiereComprador = 1`. Vale `1` en web_1 y `0` en web_2. |

### Reglas

| # | Regla | Error |
| --- | --- | --- |
| RN06 (ajuste) | Si `@IdComprador` no es nulo, el comprador debe existir y estar activo. | 54004 |
| RN09 (ajuste) | El límite de 10 asientos sólo se valida cuando hay comprador. En web_2 no aplica, como ya confirmaron web_2 y el servicio (PR4). | 53001 |
| RN28 (**nueva**) | Si el sitio tiene `RequiereComprador = 1` y `@IdComprador` llega nulo, SP07 rechaza la reserva. | **53005** |
| RN29 (**nueva**) | SP13 copia `IdComprador` de la reserva a la orden, aunque sea nulo. | — |

- **53005** («El sitio requiere un comprador»): el servicio sabe qué sitios exigen cuenta, así que este error indica un fallo del servicio. Sugerimos responder `500`, igual que 53004 (QB5).
- SP09, SP10 y SP15 reciben un comprador, así que **no aplican** a web_2.
- SP16 (consolidación) usa `LEFT JOIN` con `Compradores` y devuelve `Comprador = NULL` en las compras de invitado.
- No se guarda ningún dato de contacto del invitado, porque web_2 no lo pidió. Así se guardan menos datos personales.

## 2. P16 — Sala, formato, idioma, clasificación y duración

### Hallazgo que obliga a modelar la sala

`UQ_Funciones_IdEvento_FechaHoraInicio` impide que un mismo evento tenga dos funciones a la misma hora. web_2 tiene **una sola película en 10 salas**: las salas 1–5 empiezan a las 13:00 y las salas 6–10 a las 12:30. Con el esquema actual, **no se podrían cargar sus funciones**. Por eso la sala no se puede dejar fuera de la demo.

### Cambios propuestos

| Tabla | Columna nueva | Tipo | N | Restricción | Descripción |
| --- | --- | --- | --- | --- | --- |
| `Funciones` | `IdZona` | `INT` | Sí | `FK_Funciones_Zonas` | **Sala** de la función, para sitios con una sola zona por función (web_2). Es nula en web_1, cuyas funciones usan 3 zonas. |
| `Funciones` | `Formato` | `VARCHAR(2)` | Sí | `CK_Funciones_Formato` (`2D` o `3D`) | Formato de proyección |
| `Funciones` | `Idioma` | `NVARCHAR(30)` | Sí | — | Idioma de la función, por ejemplo «Español» o «Inglés subtitulado» |
| `Eventos` | `Clasificacion` | `VARCHAR(5)` | Sí | — | Clasificación (`AA`, `A`, `B`, `B15`, `C`, `D`) |
| `Eventos` | `DuracionMin` | `SMALLINT` | Sí | `CK_Eventos_DuracionMin` (> 0) | Duración en minutos |

| Restricción | Antes | Después |
| --- | --- | --- |
| Única de `Funciones` | `UQ_Funciones_IdEvento_FechaHoraInicio` | `UQ_Funciones_IdEvento_FechaHoraInicio_IdZona`. En SQL Server, una restricción `UNIQUE` trata los `NULL` como iguales, así que web_1 (con `IdZona` nula) mantiene la misma protección que hoy. |

### Cómo se representa la sala

- **Sala = `Zona`.** Por ejemplo, «Sala 1» es una zona de web_2 con sus 80 asientos. El **nombre** viene de `Zonas.Descripcion` y la **capacidad** se calcula como el número de asientos activos de la zona, así que no se guarda una columna de capacidad que pueda quedar desactualizada.
- **Precio por formato:** cada función de web_2 tiene una sola fila en `PreciosZonaFuncion` ($100 en 2D y $150 en 3D), sin cambios en esa tabla (P14).
- `AsientosFuncion` de una función de web_2 contiene sólo los asientos de su sala. RN04 (53003) ya rechaza asientos de otra sala.
- **RN30 (nueva):** si `Funciones.IdZona` no es nula, su precio y sus asientos deben ser de esa misma zona. Lo garantizan los datos iniciales, como RN26.

### SP que cambian (se detalla en la Especificación)

| SP | Columnas que agrega al resultado |
| --- | --- |
| SP03 `spEventos_Listar` | `Clasificacion` y `DuracionMin` |
| SP04 `spFunciones_ListarPorEvento` y SP05 `spFunciones_Obtener` | `Formato`, `Idioma`, `IdZona`, `Sala` (nombre) y `Capacidad`. Las tres últimas son nulas en web_1. |

`IX_Funciones_Evento (IdEvento, FechaHoraInicio)` sigue sirviendo para SP04, porque sus columnas iniciales no cambian.

### Datos iniciales de web_2 (preguntas nuevas)

D7 sólo cubre web_1. Para cargar web_2 en `05_datos_iniciales.sql` necesitamos que web_2 confirme lo siguiente:

| # | Pregunta para web_2 | Propuesta del backend si no responden |
| --- | --- | --- |
| QB6 | ¿Qué periodo de funciones cargamos? 30 funciones diarias durante 3 meses son 2,760 funciones y 220,800 asientos-función, 15 veces el volumen de web_1. | **Del lun 9 al dom 15 nov 2026** (7 días): 210 funciones y 16,800 asientos-función, un volumen parecido al de web_1 (RNF-B08). |
| QB7 | ¿Cómo se acomodan las 80 butacas de cada sala? | **8 filas (A–H) de 10 butacas** |
| QB8 | Datos de la película *Spider-Man*: título exacto, sinopsis, clasificación, duración e idioma de cada función | Clasificación `B`, 120 minutos (las funciones duran 2 horas) e idioma «Español» en todas las funciones |

## 3. P17 — Recuperar la orden sin cuenta

**Respuesta: sí, buscando por el código del boleto.** No se busca sólo por el folio.

- El folio `ORD-000123` es **consecutivo** (RN19). Con el folio solo, cualquiera podría consultar las órdenes de otros probando `ORD-000124`, `ORD-000125` y así sucesivamente.
- El código del boleto tiene 12 caracteres aleatorios de un alfabeto de 32 símbolos, unos 1.15 × 10¹⁸ combinaciones (RN20). En la práctica no se puede adivinar.

| SP | Nombre | Parámetros | Resultado | Error |
| --- | --- | --- | --- | --- |
| **SP18** (nuevo) | `spOrdenes_ObtenerPorCodigo` | El sitio (mismo parámetro que SP03) y `@Codigo CHAR(12)` | Los mismos dos conjuntos de resultados que SP14: la orden (con `Folio` y `UltimosDigitos`, ver P19) y **todos** sus boletos | 54003 si el código no existe **o pertenece a otro sitio**. Así, web_2 no puede ver órdenes de web_1. |

- Usa el índice que ya crea `UQ_Boletos_Codigo`, así que no necesita uno nuevo.
- El sitio puede pedir **folio y código** en su pantalla si quiere. El servicio comprueba que el folio devuelto coincida con el que escribió el comprador; la BD sólo necesita el código.
- No se agrega un SP que busque sólo por folio.

## 4. P18 — Conteo de reservas por día

**Respuesta: procedimiento nuevo.** SP16 lista **boletos pagados** con datos del comprador. No incluye las reservas que no se pagaron y, en web_2, el comprador es nulo. Calcular el conteo a partir de SP16 daría un número distinto al que pide el cliente y traería más datos de los necesarios.

| SP | Nombre | Parámetros | Resultado |
| --- | --- | --- | --- |
| **SP19** (nuevo) | `spReservas_ContarPorDia` | El sitio, `@Desde DATE` y `@Hasta DATE`, ambos en **hora de la Ciudad de México** | Una fila por día con al menos una reserva: `Fecha` (CDMX), `ReservasCreadas` y `ReservasPagadas` |

- **Día local:** el procedimiento convierte el rango a UTC sumando 6 horas fijas (E18 y D13). Agrupa por `CAST(DATEADD(HOUR, -6, CreadaEn) AS DATE)`.
- **Qué se cuenta:** cada reserva cuenta en el día en que **se creó**. `ReservasPagadas` es el subconjunto de esas reservas que terminaron en estado `Pagada`. No se usa `@Ahora`, porque el conteo no depende de si una reserva vence. **web_2 debe confirmar si esta definición le sirve** (por ejemplo, si «reservas» significa apartados o compras).
- **Validación:** si `@Desde > @Hasta` o el rango pasa de **366 días**, lanza **53007** («Rango de fechas inválido», `422`).
- **Índice nuevo:** `IX_Reservas_IdSitio_CreadaEn` sobre `Reservas (IdSitio, CreadaEn)` INCLUDE (`IdEstadoReserva`).
- Sirve para cualquier sitio, no sólo para web_2.

## 5. P19 — Últimos 4 dígitos de la tarjeta

**Respuesta: sí.**

| Tabla | Columna nueva | Tipo | N | Restricción | Descripción |
| --- | --- | --- | --- | --- | --- |
| `IntentosPago` | `UltimosDigitos` | `CHAR(4)` | No | `CK_IntentosPago_UltimosDigitos` (`NOT LIKE '%[^0-9]%'`) | Últimos 4 dígitos de la tarjeta de prueba (D14) |

| SP | Cambio |
| --- | --- |
| SP12 `spIntentosPago_Registrar` | Recibe `@UltimosDigitos CHAR(4)` |
| SP13 `spOrdenes_Pagar` | Recibe `@UltimosDigitos CHAR(4)` y lo guarda en el intento aprobado |
| SP14 y SP18 | Devuelven `UltimosDigitos` del intento aprobado, para mostrar «Tarjeta •••• 4242» |

- **RN31 (nueva):** la BD **nunca** recibe el número completo ni el CVV. Sólo recibe los 4 dígitos que extrae el servicio (D14).
- Si el valor no tiene 4 dígitos, SP12 y SP13 lanzan **53006** («Últimos dígitos inválidos»). Como el servicio ya valida la tarjeta antes de llamar a la BD, este error indica un fallo del servicio y sugerimos responder `500`, igual que 53004.
- Es `NOT NULL` porque, desde D14, todo intento llega con tarjeta y la tabla todavía no tiene datos.

---

## 6. Errores nuevos (se agregan a `BCK_DEFINICION.md` §5.6 en la Especificación)

| Código | HTTP sugerido | Mensaje | Regla |
| --- | --- | --- | --- |
| 53005 | 500 (fallo del servicio, como 53004) | El sitio requiere un comprador | RN28 (P15) |
| 53006 | 500 (fallo del servicio, como 53004) | Últimos dígitos inválidos | P19 |
| 53007 | 422 | Rango de fechas inválido | SP19 (P18) |

## 7. Trazabilidad con el contrato de datos

| Punto del contrato | Efecto de esta propuesta |
| --- | --- |
| Entidad **Reserva** y **Orden**: «comprador» | **Cambia:** pasa a ser opcional para los sitios sin cuentas (P15). El servicio ya lo anticipa en `ESPECIFICACION.md` §1. Hay que registrarlo en `ACUERDOS.md`. |
| Entidad **Evento** | Se agregan clasificación y duración (P16), ambas opcionales |
| Entidad **Función** | Se agregan sala, formato e idioma (P16), todos opcionales |
| Entidad **Zona** | Sin cambios. En web_2 una zona representa una sala. |
| Entidad **Intento de pago** | Se agregan los últimos 4 dígitos (P19 y D14) |
| Garantía 1: apartado atómico | Sin cambios. El límite de 10 sólo se omite cuando no hay comprador. |
| Garantía 2: pago atómico | Sin cambios. SP13 recibe un parámetro más. |
| Garantía 3: la hora la manda el servicio | Sin cambios. SP19 no depende de `@Ahora`, y el día local usa el UTC−6 fijo de D13. |
| Garantía 4: unicidad | Sin cambios. `UQ_Boletos_Codigo` también da soporte a SP18. |
| Garantía 5: persistencia | Sin cambios |
| Operaciones de los repositorios | Se agregan «obtener una orden por código de boleto» (SP18) y «contar reservas por día» (SP19). Son nuevas, vienen de web_2 y el contrato no las tenía. |
| Volumen | Depende de QB6. Con la propuesta de 7 días, el total pasa de 14,400 a 31,200 asientos-función. |
| Datos iniciales | Se agrega web_2: 1 sitio, 10 zonas o salas, 800 asientos, 1 evento, sus funciones y sus precios (depende de QB6–QB8) |

## 8. Validación

- [x] Cada respuesta se revisó contra el diccionario (`BCK_DEFINICION.md` §6), las reglas RN01–RN27 y los SP01–SP17.
- [x] P15 no rompe web_1: con `RequiereComprador = 1`, las reglas RN06 y RN09 se aplican igual que hoy.
- [x] P16 no rompe web_1: las columnas nuevas admiten nulos, y la restricción única ajustada da la misma protección cuando `IdZona` es nula.
- [x] P17 no expone órdenes de otros: la búsqueda es por un código aleatorio y filtra por sitio.
- [x] P19 cumple D14: no se guarda el número completo ni el CVV.
- [x] Los errores nuevos respetan los rangos de D10 y del ADR-004.
- [x] Ningún dato sensible ni credencial en este documento.
- [x] Aprobación de la usuaria (6 nov 2026).

## 9. Mensaje propuesto para el chat

> **Backend → Servicio y web_2 (P15–P19):**
> **P15:** `IdComprador` admitirá nulos en `Reservas` y `Ordenes`, y cada sitio tendrá un indicador `RequiereComprador` (web_1 = 1, web_2 = 0). Si no hay comprador, no se valida el máximo de 10. No usaremos un comprador «invitado» porque juntaría todas las compras de web_2 bajo el límite de 10, ni un folio del sitio, porque la BD ya genera `ORD-000123`. Error nuevo 53005 si un sitio que exige cuenta no envía comprador (sugerimos `500`, igual que 53004).
> **P16:** sí las agregamos, todas opcionales. La sala será una zona y la función apuntará a ella (`Funciones.IdZona`). Formato (2D/3D) e idioma van en la función; clasificación y duración, en el evento. Es necesario porque hoy la BD no permite dos funciones del mismo evento a la misma hora, y web_2 tiene Spider-Man en 5 salas a las 13:00.
> **P17:** nuevo `spOrdenes_ObtenerPorCodigo`: busca por el **código del boleto** (12 caracteres aleatorios), filtrado por sitio, y devuelve la orden con todos sus boletos. Por folio solo no, porque es consecutivo y se puede adivinar.
> **P18:** nuevo `spReservas_ContarPorDia(sitio, desde, hasta)` con fechas en hora de CDMX. Devuelve por día las reservas creadas y cuántas se pagaron. web_2: ¿les sirve esa definición? Error 53007 si el rango es inválido.
> **P19:** sí. `IntentosPago.UltimosDigitos CHAR(4)`, que reciben SP12 y SP13 y devuelven las consultas de orden. Error 53006 si no son 4 dígitos (sugerimos `500`).
> **Preguntas para web_2:** QB6: ¿qué periodo de funciones cargamos? Proponemos del 9 al 15 nov. QB7: ¿cómo se acomodan las 80 butacas? Proponemos 8 filas de 10. QB8: datos de Spider-Man (sinopsis, clasificación, duración e idioma). Si no responden, cargamos B, 120 min y español.
> Detalle en `citas_backend/docs/BCK_RESPUESTAS_P15_P19.md`.

## 10. Aviso para web_2: restricción única de funciones

Se pidió el 6 nov 2026 para que web_2 conozca el impacto en su modelo de datos.

> **Backend → web_2 (aviso sobre funciones y salas):**
> Al revisar su respuesta a P4, encontramos que nuestro esquema tiene la restricción `UQ_Funciones_IdEvento_FechaHoraInicio`: **un mismo evento no puede tener dos funciones a la misma fecha y hora**. Funciona para el teatro de web_1, que tiene una sola sala, pero no para ustedes: Spider-Man se proyecta en las salas 1–5 a las 13:00, 16:00 y 20:00, y en las salas 6–10 a las 12:30, 15:30 y 18:30. Con el esquema actual sólo se podría cargar una de las 5 funciones de cada horario.
> **Solución (P16):** cada función apunta a su sala con `Funciones.IdZona` (la sala es una zona con sus 80 butacas) y la restricción pasa a ser `UQ_Funciones_IdEvento_FechaHoraInicio_IdZona`. Así pueden tener la misma película a la misma hora en salas distintas, pero nunca dos funciones iguales en la misma sala. web_1 no cambia.
> **Qué significa para ustedes:**
> 1. Cada función tiene su propio `id`. Dos funciones a las 13:00 en salas distintas son funciones diferentes, con su propio mapa de butacas y su propio precio.
> 2. La cartelera recibe por función la `sala` (nombre), su `capacidad`, el `formato` (2D/3D) y el `idioma`, y por película la `clasificacion` y la `duracion`. El servicio les confirmará los nombres exactos en la API.
> 3. Para cargar sus datos necesitamos QB6 (periodo; proponemos del 9 al 15 nov), QB7 (acomodo de las 80 butacas; proponemos 8 filas de 10) y QB8 (datos de Spider-Man), antes del **sáb 7 nov**.
> Detalle en `citas_backend/docs/BCK_RESPUESTAS_P15_P19.md` §2.

## 11. Ajuste tras la Definición de web_2 (PR #13, 6 nov 2026)

`citas_web_2/docs/DEFINICION.md` se fusionó después de esta propuesta. Comparación:

| Tema | web_2 | Decisión del backend (6 nov 2026) |
| --- | --- | --- |
| Conteo diario (RN06 de web_2) | Reservas creadas por día en `America/Mexico_City`, sin importar su estado final y sin desglose por sala | **Coincide** con `ReservasCreadas` de SP19. Responde la pregunta de P18. `ReservasPagadas` se conserva como dato adicional. |
| Recuperación del boleto (RN05 de web_2) | Sólo con el folio de la orden | **Opción 1, aprobada por la usuaria:** el comprador escribe **folio y código del boleto**. El servicio llama a SP18 con el código y comprueba que el `Folio` devuelto coincida con el escrito; si no coincide, responde `404`. SP18 no cambia. |
| Orden sin cuenta (RN05 de web_2) | «Comprador anónimo» por orden | Equivale a `IdComprador` nulo (P15). No se crea ningún comprador. |

Mensaje para web_2:

> **Backend → web_2 (sobre su Definición, PR #13):**
> Gracias por la Definición. Dos ajustes con lo que propusimos en P15–P19 (PR #12):
> **1. Conteo diario (RN06):** coincide con nuestro `spReservas_ContarPorDia`, que cuenta las reservas creadas por día en hora de CDMX, sin importar su estado. Con eso queda respondida P18. También devolvemos cuántas se pagaron, por si les sirve después.
> **2. Recuperar el boleto (RN05):** les pedimos que el comprador escriba **el folio y el código del boleto** (el código de 12 caracteres que va bajo el QR), no sólo el folio. El folio es consecutivo (`ORD-000123`, `ORD-000124`, …): con el folio solo, cualquiera podría ver los boletos de otra persona cambiando un número. El código es aleatorio y no se puede adivinar. El servicio busca la orden por el código y comprueba que el folio coincida. En la confirmación de compra conviene mostrar los dos datos juntos y sugerir guardarlos o tomar captura.
> **3. Comprador anónimo:** no hace falta crear uno; la orden se guarda sin comprador (`IdComprador` nulo) y para ustedes funciona igual.
> **Recordatorio:** para cargar sus datos seguimos necesitando QB6 (periodo; proponemos del 9 al 15 nov), QB7 (acomodo de las 80 butacas; proponemos 8 filas de 10) y QB8 (sinopsis, clasificación, duración e idioma de Spider-Man), antes del **sáb 7 nov**. Y revisen el aviso sobre `UQ_Funciones_IdEvento_FechaHoraInicio`: cada función queda ligada a su sala.
> Detalle en `citas_backend/docs/BCK_RESPUESTAS_P15_P19.md` §11.
