# ADR-001 — Node.js 20 + Express con contrato OpenAPI 3

- **Estado:** Aceptada (D1 en `../../specs/ACUERDOS.md`, 29 oct 2026)
- **Responsables:** L, D

## Contexto

`citas_service` debe exponer una API REST documentada con Swagger para dos sitios web hechos en HTML, CSS y JavaScript vanilla. El ejercicio dura del 29 de octubre al 2 de noviembre de 2026, el equipo tiene experiencia variada y cada equipo ejecuta los proyectos en su propia máquina, sin servidor ni dominio (D3). Los agentes de IA del equipo (pi, Claude) deben poder generar y validar código a partir de la especificación.

## Decisión

- **Node.js 20 + Express** para la API.
- **OpenAPI 3** en `docs/specs/openapi.yaml` como contrato, publicado con `swagger-ui-express` en `/docs` y versionado bajo `/api/v1`.
- **Jest + Supertest** para pruebas unitarias y de endpoints.

## Consecuencias

- El mismo lenguaje que los sitios (JavaScript) facilita que cualquier integrante lea el código.
- Express es mínimo: validación de peticiones, formato de errores y CORS se agregan como middleware y deben acordarse en la Especificación.
- Con OpenAPI como fuente de verdad, los sitios pueden usar un mock antes de que exista la implementación y las pruebas de contrato pueden comparar rutas implementadas contra la spec.
- Se necesita Node.js 20 instalado en cada máquina que levante el servicio.
