# BCK — Anteproyecto: Base de datos de citas_backend

| Campo | Valor |
| --- | --- |
| Proyecto | `citas_backend` — base de datos para reserva y compra de boletos |
| Etapa | 1. Anteproyecto |
| Estado | **Aprobado** por el usuario el 4 nov 2026 |
| Fecha | 4 de noviembre de 2026 |
| Fuentes | `citas_web_1/docs/PROPUESTA.md`, `citas_web_1/docs/DEFINICION.md`, `citas_service/docs/specs/contrato-datos-backend.md`, `citas_service/docs/specs/ACUERDOS.md`, `citas_backend/promt.md`, entrevista del 4 nov 2026 |

---

## 1. Antecedentes

El monorepo `agendar_citas` tiene cuatro áreas:

| Carpeta | Papel |
| --- | --- |
| `citas_web_1` | Frontend del teatro «Aquí nadie actúa normal», con la obra «¡Que no se entere la suegra!» |
| `citas_web_2` | Segundo frontend; su negocio está pendiente (P4) |
| `citas_service` | API REST (Node.js 20 + Express) con las reglas de negocio |
| `citas_backend` | **Este proyecto:** la base de datos que comparten todos los sitios |

`citas_service` ya publicó lo que necesita del backend (`contrato-datos-backend.md`): entidades, garantías de atomicidad y unicidad, operaciones y volumen. Mientras no exista la base de datos, el servicio trabaja con datos en memoria (PR6). Como el calendario propuesto por el servicio (entrega el 2 nov) ya pasó, el adaptador de base de datos quedará como siguiente paso del servicio.

## 2. Necesidad

Los sitios necesitan **un solo estado compartido y persistente** de funciones, asientos, reservas temporales (5 minutos), pagos simulados, órdenes y boletos. Así, dos compradores no pueden apartar ni comprar el mismo asiento y lo confirmado no se pierde al reiniciar.

## 3. Objetivos

**General:** entregar una base de datos en Microsoft SQL Server con su esquema, procedimientos almacenados y datos iniciales, lista para que `citas_service` la consuma.

**Específicos:**
1. Modelar las entidades del contrato con un diseño genérico que sirva para web_1 y, más adelante, para web_2.
2. Garantizar desde la base de datos la exclusividad de asientos, el apartado atómico, el pago atómico y la unicidad de correos, códigos de boleto y boletos por asiento y función.
3. Exponer las operaciones del contrato como procedimientos almacenados parametrizados que usen `THROW` para abortar ante reglas incumplidas.
4. Cargar los datos iniciales del teatro de web_1.
5. Documentar el esquema y la forma de ejecutarlo en local (responde a P2 y P6).

## 4. Decisiones tomadas en la entrevista (4 nov 2026)

| # | Tema | Decisión | Responde a |
| --- | --- | --- | --- |
| E1 | Qué se entrega | **Opción C:** base de datos más procedimientos almacenados que el servicio invoca. | P1 |
| E2 | Ejecución local | **Scripts `.sql` numerados** que se ejecutan en SSMS sobre SQL Server Express o Developer. Sin Docker por ahora. | P2 |
| E3 | Cuentas de compradores | La base de datos guarda los compradores: nombre, correo único y **hash** de la contraseña. El hash lo calcula el servicio; la base de datos nunca recibe la contraseña en claro. | P5 (propuesta para web_1/web_2) |
| E4 | Alcance del modelo | **Genérico** (Sitios, Eventos, Funciones, Zonas…), cargando sólo los datos de web_1. | P4 (parcial) |
| E5 | Idioma de nombres | **Español**: tablas en plural y campos en PascalCase (ej. `Compradores`, `FechaRegistro`). | — |
| E6 | Fechas | `DATETIME2` en **UTC**; el servicio las entrega con zona `America/Mexico_City`. | P8 |
| E7 | Reloj de negocio | Los procedimientos que dependen del tiempo (apartar, pagar, contar vigentes) reciben **`@Ahora`** del servicio. Las columnas de auditoría (`FechaRegistro`) usan la fecha del sistema (`SYSUTCDATETIME()`). | Garantía 3 del contrato |
| E8 | Versión mínima | **SQL Server 2019** o superior. | P2 |

## 5. Alcance

### Incluye
- **Tablas** con `Id INT/BIGINT IDENTITY` autoincremental y fecha de registro con la fecha del sistema (ver E7).
- **Catálogos** (por ejemplo `Sitios`, `Zonas`, `EstadosReserva`, `ResultadosPago`) con `Descripcion` e indicador `Activo` (`BIT`).
- Restricciones `PK`, `FK`, `UQ`, `CK` y `DEFAULT` con nombres descriptivos.
- Índices `NONCLUSTERED` para las consultas frecuentes: asientos de una función y asientos de un comprador en una función.
- Procedimientos almacenados para las operaciones del contrato (lista preliminar en §7). **Cada uno se aprueba antes de construirlo**, como pide `promt.md`.
- Tabla interna de registro de errores; al cliente sólo se le devuelven mensajes genéricos.
- Datos iniciales de web_1: 1 evento, 120 funciones, 3 zonas y 120 asientos.
- Pruebas T-SQL en `./tests`: concurrencia, vencimiento, límite de 10, atomicidad del pago.
- Documentos en `./docs` con prefijo `BCK_` y arquitectura en `./docs/architecture`.

### No incluye
- API HTTP propia (opción B), interfaces web y lógica de expiración del lado del servicio.
- Cálculo del hash de contraseñas, autenticación y emisión de tokens (los hace el servicio).
- Pago real, cargos y descuentos, cancelaciones o modificaciones de compra.
- Backoffice: sólo se deja una consulta de consolidación, porque su alcance está pendiente.
- Datos de web_2 hasta que se responda P4.
- Docker, servidores remotos y cambios en dependencias o variables de entorno sin aviso previo.

## 6. Modelo preliminar (sujeto a Definición)

| Tipo | Tabla propuesta | Origen en el contrato |
| --- | --- | --- |
| Catálogo | `Sitios` | Sitio |
| Catálogo | `Zonas` | Zona |
| Catálogo | `EstadosReserva` (`Activa`, `Liberada`, `Pagada`) | Reserva.estado |
| Catálogo | `ResultadosPago` (`Aprobado`, `Rechazado`) | Intento de pago.resultado |
| Entidad | `Compradores` | Comprador |
| Entidad | `Eventos` | Evento |
| Entidad | `Funciones` | Función |
| Entidad | `PreciosZonaFuncion` (o precio en `Zonas`, por decidir) | Precio por zona y función |
| Entidad | `Asientos` | Asiento |
| Transacción | `Reservas` | Reserva (`ExpiraEn`) |
| Transacción | `ReservasAsientos` | Asiento de reserva (precio tomado) |
| Transacción | `IntentosPago` | Intento de pago |
| Transacción | `Ordenes` | Orden |
| Transacción | `Boletos` | Boleto (código único) |
| Soporte | `BitacoraErrores` | Registro interno de errores |

El estado «vencida» **no se guarda**: se calcula comparando `ExpiraEn` con `@Ahora` (PR1, ADR-003 del servicio).

## 7. Procedimientos almacenados preliminares (requieren aprobación)

| Grupo | Procedimiento propuesto | Operación del contrato |
| --- | --- | --- |
| Compradores | `spCompradores_Registrar`, `spCompradores_ObtenerPorCorreo` | Registro e inicio de sesión (E3) |
| Catálogo | `spEventos_Listar`, `spFunciones_ListarPorEvento`, `spFunciones_Obtener`, `spAsientos_ListarPorFuncion` | AsientosRepo |
| Reservas | `spReservas_Crear` (atómico, falla completo e indica qué asientos fallaron), `spReservas_Obtener`, `spReservas_ListarActivasPorComprador`, `spReservas_ContarAsientosCompradorFuncion`, `spReservas_Liberar`, `spIntentosPago_Registrar` | ReservasRepo |
| Órdenes | `spOrdenes_Pagar` (atómico: orden, boletos y reserva pagada), `spOrdenes_Obtener`, `spOrdenes_ListarPorComprador`, `spBoletos_Consolidar` | OrdenesRepo |

Todos los procedimientos usarán parámetros tipados, `SET NOCOUNT ON`, `SET XACT_ABORT ON`, `TRY/CATCH`, transacciones cuando modifiquen varias tablas y `THROW` con códigos de negocio 50000+.

## 8. Entregables previstos

| Ruta | Contenido |
| --- | --- |
| `docs/BCK_ANTEPROYECTO.md` | Este documento |
| `docs/BCK_PROPUESTA.md` | Etapa 2 |
| `docs/BCK_DEFINICION.md` | Etapa 3: requisitos, reglas y diccionario de datos |
| `docs/BCK_ESPECIFICACION.md` | Etapa 4: firmas de los SPs, códigos de error e índices |
| `docs/architecture/` | Diagrama entidad-relación y decisiones (ADR) |
| `app/` | `01_crear_bd.sql`, `02_tablas.sql`, `03_indices.sql`, `04_sps.sql`, `05_datos_iniciales.sql` |
| `tests/` | Scripts T-SQL de verificación |
| `TODOLIST.md` | Plan y avance |

La construcción de los scripts la hará el subagente **`sqlserver-dba`** (`.claude/agents/sqlserver-dba.md`).

## 9. Supuestos y restricciones

- Cada equipo ejecuta todo en `localhost` (D3); no hay servidor compartido.
- Los datos de conexión se documentarán en un `.env.example` **sin contraseñas reales**, previo aviso al usuario.
- Volumen de web_1: 120 funciones × 120 asientos = 14,400 asientos-función, volumen bajo para SQL Server Express.
- Sólo se usa HTML5/CSS3/JS en interfaces; este proyecto no tiene interfaz (AGENTS.md aplica a la documentación y a la estructura de carpetas).

## 10. Riesgos

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| El calendario del servicio (2 nov) ya venció | El servicio sigue en memoria | Priorizar el esquema y los SPs de reservas; avisar en el chat del grupo |
| Nombres en español frente a los ejemplos en inglés del contrato | Confusión en el adaptador | Publicar un diccionario de datos con la equivalencia de cada campo (P6) |
| P4 (web_2) sin respuesta | Ajustes posteriores al modelo | Mantener el modelo genérico (E4) |
| Concurrencia en el apartado | Doble venta del mismo asiento | Validación dentro de una transacción con bloqueo adecuado e índice único; se prueba en `tests/` |

## 11. Pendientes para comunicar a otros equipos

`citas_backend` no modifica carpetas ajenas. Las respuestas E1, E2, E3, E6 y E8 se deben comunicar en el chat del grupo para que el líder de contrato las registre en `citas_service/docs/specs/ACUERDOS.md`. Siguen abiertas: P3 (se propone que el backend cargue los datos iniciales), P4, P9 y P10.

## 12. Siguiente etapa

Al aprobarse este anteproyecto se pasará a **2. Propuesta** (`BCK_PROPUESTA.md`), que incluirá el modelo de datos propuesto y la selección definitiva de los procedimientos almacenados.
