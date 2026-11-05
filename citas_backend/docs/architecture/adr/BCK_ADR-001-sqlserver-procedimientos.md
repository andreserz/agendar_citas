# BCK ADR-001 — SQL Server con procedimientos almacenados como única interfaz

- **Estado:** Aceptado (Anteproyecto E1, E2 y E8; acuerdos D4 y D5)
- **Fecha:** 5 nov 2026
- **Responsable:** S

## Contexto

`citas_service` necesita un estado compartido y persistente con garantías de atomicidad y unicidad (contrato de datos). Las opciones eran: (A) entregar sólo la BD y que el servicio escriba las consultas, (B) una API propia del backend o (C) la BD con procedimientos almacenados.

## Decisión

Opción **C**: Microsoft SQL Server 2019 o superior, entregado como scripts `.sql` numerados (`01`–`05`). El servicio **sólo invoca procedimientos almacenados**, con un usuario que tiene únicamente permiso `EXECUTE` (rol `rolCitasServicio`).

## Consecuencias

- Las reglas de integridad (atomicidad y unicidad) viven junto a los datos y se prueban con T-SQL.
- El servicio no depende de los nombres internos de tablas; los cambios de esquema no lo rompen mientras las firmas de los SP se mantengan.
- Cada cambio de firma de un SP se comunica en el chat (P6).
- Sin Docker: cada integrante instala SQL Server Express o Developer y SSMS en su máquina.
