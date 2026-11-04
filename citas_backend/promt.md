# ETAPA CONSTRUCCIÓN DE BASE DE DATOS
1. Busca en la carpeta \citas_web_1\docs\ los archivos PROPUESTA.md y DEFINICION.md y en base a esos archivos usa el sub agente "sqlserver-dba.md" para:


## ESPECIFICACIÓN TÉCNICA:
1. Crear la tablablas con Id (IDENTITY autoincremental), fecha actual del sistema; para los catálogos una descripción y un indicador de activo/inactivo.
2. Stored Procedure de Registro: Crear los procedimiento almacenados necesarios y previamente aprovados.

REGLAS DE NEGOCIO EN EL SP (T-SQL):
- Usar THROW para lanzar los errores y abortar el proceso.

Realiza una entrevista para entregarte la información que consideres que hace falta.
Escribe en markdown el anteproyecto y los nuevos documentos en \agendar_citas\citas_backend\docs con el prefijo "BCK_".