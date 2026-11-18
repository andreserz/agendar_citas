# Design — impl-service

## Contexto

El servicio ya tiene configuración por entorno (`app/config.js`), CORS, Swagger, formato de error y repositorios en memoria con pruebas. Lo que falta es el router, la seguridad de compradores y el adaptador SQL. Todo lo que este change necesita está en `contrato-entre-capas`; no depende de otros equipos.

## Decisiones

**1. Routers por dominio.** `app/rutas/` tiene `catalogo.js`, `reservas.js`, `pagos.js`, `ordenes.js`, `auth.js`, `reportes.js` y `salud.js`. Cada uno recibe `repos` y `reloj` por inyección, como ya hace `crearApp`.

**2. Middlewares en orden.** `cors` → `json` → `validarSitio` → `autenticarComprador` (solo en rutas que lo requieren y solo si el sitio lo exige) → rutas → manejador de errores. `autenticarComprador` consulta `RequiereComprador` a través del repositorio de sitios para no duplicar la regla.

**3. Hash y token sin dependencias de compilación.** `crypto.scrypt` viene con Node 20. El token usa `jsonwebtoken` (JS puro). No se introduce bcrypt por compilación nativa en Windows.

**4. Reserva de web_2 identificada por UUID.** Como no hay comprador, el `id` de la reserva es el secreto. Se genera con `crypto.randomUUID()`. Las rutas comprueban que `reserva.sitio === X-Sitio`.

**5. Adaptador SQL sin lógica de negocio.** El adaptador solo traduce parámetros y resultados. Las reglas (límite, vencimiento, estado) viven en el servicio o en los procedimientos, según el contrato; nunca se repiten en el adaptador.

**6. Configuración nueva.** `REPOSITORIO` (`memoria` o `sql`), `JWT_SECRET`, `SQL_SERVER`, `SQL_DATABASE`, `SQL_USER`, `SQL_PASSWORD`. `.env.example` tiene valores vacíos o de ejemplo.

## Riesgos

- Si `JWT_SECRET` no está definido, el servicio no debe arrancar en entorno distinto de `test`. Se valida en `cargarConfig`.
- El adaptador SQL no se puede probar sin `CitasBD`. Mientras tanto, las pruebas de contrato corren contra memoria y el adaptador tiene pruebas de integración marcadas para cuando haya base disponible.
