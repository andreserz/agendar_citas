# ETAPA CONSTRUCCIÓN DE BASE DE DATOS
1. Busca en la carpeta \citas_web_1\docs\ y \citas_web_2\docs\ los archivos PROPUESTA.md y DEFINICION.md y en base a esos archivos usa el sub agente "sqlserver-dba.md" para:


## ESPECIFICACIÓN TÉCNICA:
1. Crear la tablablas con Id (IDENTITY autoincremental), fecha actual del sistema; para los catálogos una descripción y un indicador de activo/inactivo.
2. Stored Procedure de Registro: Crear los procedimiento almacenados necesarios y previamente aprovados.
3. La estructura de la base de datos debe permitir integrar más páginas front a futuro, tomando como base inicial citas_web1 y citas_web2.

REGLAS DE NEGOCIO EN EL SP (T-SQL):
- Usar THROW para lanzar los errores y abortar el proceso.

Realiza una entrevista para entregarte la información que consideres que hace falta.
Escribe en markdown el anteproyecto y los nuevos documentos en \agendar_citas\citas_backend\docs con el prefijo "BCK_".