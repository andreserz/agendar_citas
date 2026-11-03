# Propuesta — citas_service

Estado: elaborada con la información disponible. Lo que depende de otros equipos permanece como propuesta o pregunta en `specs/ACUERDOS.md`; nada de lo marcado como propuesta se considera acordado.

## Propósito

Ofrecer a los sitios web `citas_web_1` y `citas_web_2` una API REST común para consultar eventos y funciones, apartar asientos por cinco minutos y comprarlos mediante un pago simulado. El servicio concentra las reglas de negocio para que todos los sitios compartan el mismo estado de disponibilidad.

## Alcance

- Consultar eventos, funciones y asientos con su disponibilidad y precio.
- Apartar asientos creando una reserva que vence a los 5 minutos; liberarla manualmente o dejar que expire.
- Pagar la reserva de forma simulada, con resultado exitoso o rechazado. Tras un rechazo se puede reintentar mientras la reserva siga vigente.
- Generar la orden y un código de texto por boleto cuando el pago es exitoso, para que cada sitio dibuje el QR.
- Consultar las reservas vigentes y las compras de un comprador.
- Limitar a diez los asientos por persona y función, sumando sus compras y reservas vigentes aunque provengan de varias operaciones.
- Publicar el contrato OpenAPI 3 bajo `/api/v1` con Swagger UI en `/docs`, e identificar el sitio consumidor en cada petición.

Quedan fuera las interfaces, el diseño de la base de datos, el pago real y el backoffice (ver `ANTEPROYECTO.md`).

## Solución propuesta

### Estrategia: avanzar sin esperar al backend

1. **Spec primero.** `specs/openapi.yaml` es la fuente de verdad; los sitios pueden trabajar contra un mock generado de ese archivo.
2. **Patrón repositorio.** La lógica depende de las interfaces `AsientosRepo`, `ReservasRepo` y `OrdenesRepo`. Hoy se usa la implementación en memoria; cuando el backend defina la base de datos se agrega el adaptador sin tocar la lógica ni las pruebas.
3. **La regla de 5 minutos vive en el servicio.** Cada reserva guarda `expiraEn`. Un asiento está comprado, apartado (si `expiraEn > ahora`) o disponible. El reloj se inyecta para probar la expiración sin esperar.

### Expiración: opciones

| Opción | Ventaja | Desventaja |
| --- | --- | --- |
| Perezosa: calcular el estado al leer comparando `expiraEn` con la hora actual | Sin procesos en segundo plano; resultado siempre correcto | La BD acumula reservas vencidas hasta que se limpien |
| Barrido periódico que marca como vencidas las reservas | Mantiene los datos limpios | Hay una ventana de inconsistencia y un proceso más que operar |
| **Recomendada: perezosa, con barrido opcional de limpieza** | Corrección garantizada por la lectura; el barrido sólo ordena | Un poco más de lógica |

### Flujo de reserva y compra

```
consultar asientos ─▶ POST /reservas (409 si ya no está disponible)
                          │
                          ├─ vence a los 5 min ─▶ asientos disponibles (410 si se intenta pagar)
                          ├─ DELETE /reservas/{id} ─▶ asientos disponibles
                          └─ POST /reservas/{id}/pago
                                 ├─ rechazado ─▶ reintento mientras siga vigente
                                 └─ exitoso ──▶ orden + códigos de boleto
```

### Endpoints borrador

Genéricos, porque el negocio de web_2 está por confirmar. Se formalizan en `specs/openapi.yaml` en la etapa de Especificación.

| Método y ruta | Propósito |
| --- | --- |
| `GET /eventos` | Listar eventos |
| `GET /eventos/{id}/funciones` | Funciones de un evento |
| `GET /funciones/{id}/asientos` | Asientos con zona, precio y estado |
| `POST /reservas` | Apartar asientos |
| `GET /reservas/{id}` | Consultar una reserva y su tiempo restante |
| `DELETE /reservas/{id}` | Liberar una reserva |
| `POST /reservas/{id}/pago` | Pago simulado; el mecanismo para elegir éxito o rechazo se define en la Especificación |
| `GET /ordenes/{id}` | Consultar orden y boletos |
| `GET /reservas` y `GET /ordenes` filtrados por comprador | Reservas vigentes y compras de un comprador (RF10 de web_1); la forma del filtro **depende de P5** |
| `POST /auth/registro`, `POST /auth/login` | Cuentas; **dependen de P5** y son sólo borrador |

### Decisiones propuestas

Registradas como PR1–PR9 en `specs/ACUERDOS.md`; las propuestas son del servicio y deben confirmarse con el equipo indicado:

- **Con web_1 y web_2:** errores `409` y `410` (PR3), límite de 10 por persona y función (PR4), `/api/v1`, Swagger e identificación del sitio (PR5), código de boleto para el QR (PR7), CORS (PR9).
- **Con backend:** expiración controlada por el servicio y BD que sólo guarda `estado` y `expira_en` (PR1); apartado atómico (PR2).
- **Con todos:** datos en memoria mientras no exista la BD (PR6); puertos locales 3000, 5501 y 5502 (PR8).

## Comunicación y división del trabajo

- **Comunicación:** se conversa en el chat del grupo y las preguntas, propuestas y decisiones se registran en `specs/ACUERDOS.md`. Lo que no esté en ese archivo no se considera acordado.
- **Quién pide qué:** web_1 y web_2 piden al servicio lo que necesitan; el servicio define las reglas y el contrato, y le pide al backend las garantías de datos en `specs/contrato-datos-backend.md`. El backend decide motor, esquema e índices.
- **Roles:** líder de contrato (Osvaldo), reservas (Juan Carlos), datos e integración (Isaac) y QA (por asignar), según `PLAN_TRABAJO.md`.
- **Fechas:** respuestas a las preguntas abiertas antes del viernes 30 de octubre; esquema del backend el sábado 31; entrega el lunes 2 de noviembre. Si el backend no llega, se entrega con el repositorio en memoria y el adaptador documentado como siguiente paso.

## Dependencias y puntos por resolver

- Qué entrega el backend, motor, ejecución local, carga de datos iniciales y documentación del esquema (P1, P2, P3, P6).
- Negocio y datos de web_2 (P4).
- Quién maneja las cuentas y cómo se identifica a la persona para el límite de diez asientos (P5). Es la dependencia que más condiciona el diseño.
- Forma de la demo del lunes (P7).
- Alcance y responsable del backoffice de consolidación. El servicio deberá poder exponer al menos comprador, asiento, fecha de compra y monto; falta acordar cómo.
- Zona horaria en la que se expresan los horarios de las funciones.
- Reserva de varios asientos cuando alguno ya no está disponible: rechazar toda la reserva o apartar sólo los libres.
- Mecanismo para elegir el resultado del pago simulado (por ejemplo, datos de prueba o un campo en la petición).
- Formato de error, autenticación entre sitio y servicio, y criterios de aceptación, que se definen en las etapas de Definición y Especificación.

## Resultado esperado

Una API que permita recorrer el proceso descrito, documentada con Swagger y probada con Jest y Supertest, que corra localmente sin base de datos y quede lista para recibir el adaptador real cuando el backend lo entregue. La implementación y su validación se realizarán en las etapas de Construcción y Pruebas, después de completar la Definición y la Especificación.
