# Tasks — impl-backend

Cada tarea indica el requisito que cumple. Marcar con `[x]` al terminar y reportar en `citas_backend/TODOLIST.md`.

## 1. Preparación
- [x] 1.1 Crear `citas_backend/app/` y `citas_backend/tests/` (Requirement: Scripts de construcción).
- [x] 1.2 Crear `citas_backend/.env.example` con las variables de conexión y sin contraseñas reales.

## 2. Esquema (02_tablas.sql)
- [x] 2.1 Crear `CitasBD` en `01_crear_bd.sql` de forma idempotente.
- [x] 2.2 Tabla `Sitios` con `RequiereComprador` y datos de `web_1` (1) y `web_2` (0) (Requirement: Sitios y compradores opcionales).
- [x] 2.3 Hacer `Reservas.IdComprador` y `Ordenes.IdComprador` nulables.
- [x] 2.4 `Zonas.Capacidad`, y en `Funciones`: `Formato`, `Idioma`, `Clasificacion`, `DuracionMinutos` (Requirement: Campos de función y zona).
- [x] 2.5 `IntentosPago.UltimosDigitos CHAR(4) NOT NULL` (Requirement: Pagos con últimos dígitos).
- [x] 2.6 Verificar que no existe ninguna columna con número completo de tarjeta ni CVV.

## 3. Índices (03_indices.sql)
- [x] 3.1 Índice único `UQ_Funciones_IdEvento_FechaHoraInicio`.
- [x] 3.2 Índice por `Folio` y por `Codigo` de boleto para `spOrdenes_Buscar`.
- [x] 3.3 Índice por `CreadaEn` de `Reservas` para `spReservas_ContarPorDia`.

## 4. Procedimientos prioritarios (04_sps.sql, primero)
- [x] 4.1 SP06 `spAsientos_ListarPorFuncion` con `@Ahora` y `Estado` (Requirement: Procedimientos del contrato).
- [x] 4.2 SP07 `spReservas_Crear` con CSV, transacción, bloqueo, límite opcional y `51001` con ids (Requirement: Reglas de apartado).
- [x] 4.3 SP13 `spOrdenes_Pagar` atómico: intento, reserva pagada, orden, boletos y asientos comprados (Requirement: Procedimientos del contrato).

## 5. Resto de procedimientos (04_sps.sql)
- [x] 5.1 SP01 a SP05 con las firmas de la tabla del contrato.
- [x] 5.2 SP08 a SP11 incluyendo `52002` en SP11 (Requirement: Códigos de error del contrato).
- [x] 5.3 SP12 `spIntentosPago_Registrar` con `@UltimosDigitos`.
- [x] 5.4 SP14 y SP15.
- [x] 5.5 SP16 y SP17 (SP17 opcional).
- [x] 5.6 SP18 `spOrdenes_Buscar` con `@Folio` o `@Codigo`, sustituyendo `spOrdenes_ObtenerPorCodigo`.
- [x] 5.7 SP19 `spReservas_ContarPorDia` en zona CDMX.
- [x] 5.8 Validar `RequiereComprador` en SP01, SP07, SP13 y SP15 (`53005` y `53006`).

## 6. Datos iniciales (05_datos_iniciales.sql)
- [ ] 6.1 Semilla de web_1: 1 evento, 3 zonas, 120 asientos, 120 funciones, 360 precios (Requirement: Semilla de web_1 y web_2).
- [ ] 6.2 Semilla de web_2: 1 evento, 10 salas con capacidad 80, 800 asientos, 900 funciones del 19 nov al 18 dic 2026, y 900 precios (uno por función, el de su sala: RN30 y contrato «Semilla de datos acordada»), más los campos de formato. Corregido el 20 nov 2026: decía 9,000 (10 salas × 900 funciones).
- [ ] 6.3 Confirmar que la carga es idempotente.

## 7. Pruebas (tests/)
- [ ] 7.1 Apartado concurrente: dos ejecuciones por el mismo asiento (Requirement: Pruebas de base de datos).
- [ ] 7.2 Vencimiento con `@Ahora` y `@ExpiraEn <= @Ahora` → `53004`.
- [ ] 7.3 Límite de 10 con `@LimiteAsientos` → `53001`.
- [ ] 7.4 Pago atómico con fallo forzado al crear un boleto: sin orden parcial.
- [ ] 7.5 Conteos de la semilla (web_1: 120 funciones y 360 precios; web_2: 800 asientos, 900 funciones y 900 precios).
- [ ] 7.6 Unicidad de `Folio` y código de boleto.
- [ ] 7.7 `RequiereComprador` con `53005` y `53006`.

## 8. Entrega
- [ ] 8.1 Revisión por el subagente `sqlserver-dba` (según `citas_backend/TODOLIST.md`).
- [ ] 8.2 Avisar al servicio en `citas_service/TODOLIST.md` que los scripts están listos; no se requiere acuerdo porque el contrato ya lo define.
- [ ] 8.3 Actualizar `citas_backend/TODOLIST.md` con el avance de este change.
