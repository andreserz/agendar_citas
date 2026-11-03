# Cuestionario para reserva — cineclub

Estado: listo para aplicar al cliente. Cinco preguntas de opción múltiple; ninguna se responde con sí o no. Las respuestas alimentan el anteproyecto, la definición de reglas y el contrato con el servicio.

## Cómo aplicarlo

- Lo responde una sola persona del cineclub, la que tenga la visión completa del negocio.
- En las preguntas que lo indican se puede marcar más de una opción.
- Si ninguna opción describe la realidad del cineclub, se usa la última y se escribe la respuesta.
- Cada pregunta indica qué decisión del sistema desbloquea, para que el cliente entienda por qué se le pregunta.

---

## 1. ¿Cómo se organiza hoy la oferta de funciones del cineclub?

**Desbloquea:** el modelo de cartelera, el volumen de funciones y los datos que debe entregar la API.

- **A)** Una sala con una película por horario y tres funciones al día.
- **B)** Una sala con varias películas alternadas durante el día.
- **C)** Varias salas en paralelo, con películas distintas a la misma hora.
- **D)** Ciclos o temporadas (por ejemplo, cine de autor los martes) además de la cartelera habitual.
- **E)** Otra: ______________________________________________

## 2. ¿Cómo se eligen y se cobran los lugares dentro de la sala?

**Desbloquea:** el mapa de butacas, las zonas y la tabla de precios.

- **A)** Butacas numeradas en una sola zona, con el mismo precio para todas.
- **B)** Butacas numeradas en zonas con precio distinto (por ejemplo, VIP, general y frente).
- **C)** Butacas numeradas, más lugares reservados para personas con discapacidad y su acompañante.
- **D)** Acceso general sin butaca asignada, con cupo por función.
- **E)** Otra: ______________________________________________

## 3. ¿Cómo identifica el sistema a la persona que reserva y compra?

**Desbloquea:** el manejo de cuentas, la identificación del comprador y el límite de butacas por persona y función.

- **A)** Cuenta obligatoria con correo electrónico y contraseña, creada en el sitio.
- **B)** Compra como invitado con sólo el correo electrónico; la cuenta se crea después de comprar.
- **C)** Cuenta obligatoria creada con un proveedor externo (por ejemplo, Google o Facebook).
- **D)** Cuenta creada en el cineclub y también en taquilla, para que el historial sea el mismo en los dos canales.
- **E)** Otra: ______________________________________________

## 4. Si alguien elige cinco butacas y, al confirmar, dos ya fueron tomadas por otra persona, ¿qué debe hacer el sistema?

**Desbloquea:** la política ante butacas ocupadas y el mensaje que ve el usuario.

- **A)** Rechazar las cinco butacas y pedir que se elija de nuevo.
- **B)** Apartar sólo las tres libres y avisar cuáles no se pudieron conseguir.
- **C)** Apartar las tres libres y ofrecer automáticamente butacas cercanas para completar la selección.
- **D)** Mostrar el mapa actualizado y dejar que la persona vuelva a elegir desde cero, sin apartar nada todavía.
- **E)** Otra: ______________________________________________

## 5. ¿Qué necesita consultar y exportar el cineclub de las reservas y compras ya registradas?

**Desbloquea:** el alcance de la consolidación de horarios, lugar y fecha, y si se requiere un reporte para el negocio.

*Se puede marcar más de una opción.*

- **A)** Listado por función con comprador, butaca, fecha y monto pagado.
- **B)** Totales por día y por función, para el corte de caja.
- **C)** Ocupación por película y horario, para decidir qué funciones mantener.
- **D)** Exportación a archivo (CSV o Excel) para contabilidad.
- **E)** Otra: ______________________________________________

---

## Qué se hace con las respuestas

1. Se actualiza `docs/ANTEPROYECTO.md` con el negocio y los precios confirmados.
2. Se responden en `citas_service/docs/specs/ACUERDOS.md` las preguntas que dependen de este cliente: **P4** (negocio y datos), **P5** (cuentas de usuario) y **P9** (butacas ocupadas en la misma selección).
3. Con eso se cierra el anteproyecto y se pasa a la etapa de Propuesta.
