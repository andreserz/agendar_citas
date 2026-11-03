# Cuestionario para reserva — cineclub

Estado: aplicado al cliente el 3 de noviembre de 2026. Las opciones marcadas son las que eligió; el análisis de cada respuesta y sus consecuencias están en `RESPUESTAS_CLIENTE.md`.

Cinco preguntas de opción múltiple, ninguna de sí o no. Cada pregunta indica qué decisión del sistema desbloquea.

---

## 1. ¿Cómo se organiza hoy la oferta de funciones del cineclub?

**Desbloquea:** el modelo de cartelera, el volumen de funciones y los datos que debe entregar la API.

- [ ] **A)** Una sala con una película por horario y tres funciones al día.
- [ ] **B)** Una sala con varias películas alternadas durante el día.
- [x] **C)** Varias salas en paralelo, con películas distintas a la misma hora.
- [ ] **D)** Ciclos o temporadas (por ejemplo, cine de autor los martes) además de la cartelera habitual.
- [ ] **E)** Otra: ______________

## 2. ¿Cómo se eligen y se cobran los lugares dentro de la sala?

**Desbloquea:** el mapa de butacas, las zonas y la tabla de precios.

- [x] **A)** Butacas numeradas en una sola zona, con el mismo precio para todas.
- [ ] **B)** Butacas numeradas en zonas con precio distinto (por ejemplo, VIP, general y frente).
- [ ] **C)** Butacas numeradas, más lugares reservados para personas con discapacidad y su acompañante.
- [ ] **D)** Acceso general sin butaca asignada, con cupo por función.
- [ ] **E)** Otra: ______________

## 3. ¿Cómo identifica el sistema a la persona que reserva y compra?

**Desbloquea:** el manejo de cuentas, la identificación del comprador y el límite de butacas por persona y función.

- [ ] **A)** Cuenta obligatoria con correo electrónico y contraseña, creada en el sitio.
- [ ] **B)** Compra como invitado con sólo el correo electrónico; la cuenta se crea después de comprar.
- [ ] **C)** Cuenta obligatoria creada con un proveedor externo (por ejemplo, Google o Facebook).
- [ ] **D)** Cuenta creada en el cineclub y también en taquilla, para que el historial sea el mismo en los dos canales.
- [x] **E)** Otra: «no es necesario la cuenta, simplemente que compre sus boletos»

## 4. Si alguien elige cinco butacas y, al confirmar, dos ya fueron tomadas por otra persona, ¿qué debe hacer el sistema?

**Desbloquea:** la política ante butacas ocupadas y el mensaje que ve el usuario.

- [ ] **A)** Rechazar las cinco butacas y pedir que se elija de nuevo.
- [ ] **B)** Apartar sólo las tres libres y avisar cuáles no se pudieron conseguir.
- [ ] **C)** Apartar las tres libres y ofrecer automáticamente butacas cercanas para completar la selección.
- [x] **D)** Mostrar el mapa actualizado y dejar que la persona vuelva a elegir desde cero, sin apartar nada todavía.
- [ ] **E)** Otra: ______________

## 5. ¿Qué necesita consultar y exportar el cineclub de las reservas y compras ya registradas?

**Desbloquea:** el alcance de la consolidación de horarios, lugar y fecha, y si se requiere un reporte para el negocio.

*Se puede marcar más de una opción.*

- [ ] **A)** Listado por función con comprador, butaca, fecha y monto pagado.
- [ ] **B)** Totales por día y por función, para el corte de caja.
- [ ] **C)** Ocupación por película y horario, para decidir qué funciones mantener.
- [ ] **D)** Exportación a archivo (CSV o Excel) para contabilidad.
- [x] **E)** Otra: «por ahora sólo el historial de reservación, cuántas fueron al día»

---

## Resumen de respuestas

| # | Tema | Respuesta del cliente |
| --- | --- | --- |
| 1 | Oferta de funciones | C — varias salas en paralelo |
| 2 | Lugares y precios | A — una sola zona, mismo precio |
| 3 | Identificación | E — sin cuentas, compra directa |
| 4 | Butacas ocupadas | D — rechazar la selección y pedir nueva |
| 5 | Consolidación | E — conteo de reservas por día |

## Datos complementarios entregados después

| Dato | Valor |
| --- | --- |
| Salas | 10, de 80 butacas cada una (800 en total) |
| Salas 1–5 | 2D, $100 MXN por boleto |
| Salas 6–10 | 3D, $150 MXN por boleto |
| Película | *Spider-Man*, por ahora la única |
| Funciones | 30 al día, de dos horas: 1–5 a las 13:00, 16:00 y 20:00; 6–10 a las 12:30, 15:30 y 18:30 |
| Días de operación | Lunes a domingo |

## Qué se hace con las respuestas

1. Se actualiza `docs/ANTEPROYECTO.md` con el negocio, los precios y los horarios confirmados.
2. Se responden en `citas_service/docs/specs/ACUERDOS.md` las preguntas que dependen de este cliente: **P4** (negocio y datos), **P5** (cuentas de usuario) y **P9** (butacas ocupadas en la misma selección).
3. Con eso se cierra el anteproyecto y se pasa a la etapa de Propuesta.
