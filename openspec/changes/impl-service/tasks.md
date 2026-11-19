# Tasks — impl-service

Marcar con `[x]` al terminar. Reportar el avance en `citas_service/TODOLIST.md`.

## 1. Configuración
- [x] 1.1 Agregar `JWT_SECRET`, `REPOSITORIO` y variables `SQL_*` a `config.js`; fallar al arrancar si falta `JWT_SECRET` fuera de `test` (Requirement: Dueño de la autenticación).
- [x] 1.2 Actualizar `.env.example` con valores de ejemplo sin secretos.
- [x] 1.3 Agregar dependencias `jsonwebtoken` y `mssql`.

## 2. Middlewares
- [ ] 2.1 `validarSitio` con `X-Sitio` y excepción de `/salud` (Requirement: Validación de X-Sitio).
- [ ] 2.2 `autenticarComprador` que respeta `RequiereComprador` (Requirement: Sitios sin cuenta).
- [ ] 2.3 Manejador de errores que mapea `ErrorRepositorio` según la tabla del contrato (Requirement: Traducción de errores).

## 3. Rutas
- [ ] 3.1 `GET /salud` (Requirement: Validación de X-Sitio).
- [ ] 3.2 Catálogo: `GET /eventos`, `GET /eventos/{id}`, `GET /eventos/{id}/funciones`, `GET /funciones/{id}`, `GET /funciones/{id}/asientos` (Requirement: Rutas montadas según el contrato).
- [ ] 3.3 Reservas: `POST /reservas` con límite obligatorio para `web_1`, `GET /reservas/{id}`, `GET /reservas?estado=activa`, `DELETE /reservas/{id}` (Requirement: Reserva de asientos).
- [ ] 3.4 Pagos: `POST /reservas/{id}/pago` con validación de tarjetas de prueba y de formato (Requirement: Pago simulado).
- [ ] 3.5 Órdenes: `GET /ordenes`, `GET /ordenes/{id}`, `GET /ordenes/buscar` (Requirement: Recuperar compra sin cuenta).
- [ ] 3.6 Reportes: `GET /reportes/reservas-por-dia` con rango máximo de 92 días (Requirement: Conteo diario de reservas).
- [ ] 3.7 Auth: `POST /auth/registro`, `POST /auth/login` (Requirement: Autenticación de compradores).

## 4. Dominio
- [x] 4.1 Corregir `ReservasRepo.liberar` en memoria: vencida → `410 RESERVA_VENCIDA` sin liberar (Requirement: Liberar reserva).
- [x] 4.2 Hacer obligatorio `limitePorComprador` en la API para sitios con `RequiereComprador = 1` (Requirement: Límite de 10 asientos).
- [ ] 4.3 Repositorio de sitios en memoria con `web_1` (1) y `web_2` (0).
- [x] 4.4 Hash scrypt y token JWT (Requirement: Dueño de la autenticación).
- [x] 4.5 `reservaId` UUID v4 y verificación de sitio (Requirement: Sitios sin cuenta).
- [ ] 4.6 Semilla en memoria de web_2 igual a la del contrato (10 salas, 800 asientos, 900 funciones).

## 5. Adaptador SQL
- [ ] 5.1 Implementar `AsientosRepo`, `ReservasRepo` y `OrdenesRepo` en `app/repos/sql/` llamando solo a procedimientos (Requirement: Adaptador SQL Server).
- [ ] 5.2 Mapear `Estado` de SP06 a `disponible`, `apartado`, `comprado`.
- [ ] 5.3 Pruebas de integración del adaptador marcadas para ejecutarse solo con `CitasBD` disponible.

## 6. Contrato OpenAPI
- [x] 6.1 Actualizar `openapi.yaml` a `1.0.0` con todas las rutas, formas y errores del contrato (Requirement: OpenAPI 1.0.0).
- [x] 6.2 Quitar `resultadoSimulado` y los ejemplos de formato anterior.
- [x] 6.3 `redocly lint` sin errores.

## 7. Pruebas
- [ ] 7.1 Pruebas de contrato por ruta con Supertest (Requirement: Pruebas de contrato).
- [ ] 7.2 Pruebas de expiración con reloj fijo.
- [ ] 7.3 Pruebas de concurrencia por Promise.all en memoria (CA-25).
- [ ] 7.4 Pruebas de límite de web_1 y ausencia de límite en web_2.
- [ ] 7.5 Pruebas de pago: tarjetas de prueba, atomicidad y no guardar número completo.
- [ ] 7.6 Mantener verde la suite actual (58 pruebas).

## 8. Entrega
- [ ] 8.1 Ejecutar `npm test` y `npm start` con `REPOSITORIO=memoria`.
- [ ] 8.2 Verificar que `web_1` funciona en modo `api` contra esta versión.
- [ ] 8.3 Actualizar `citas_service/TODOLIST.md` con el avance.
