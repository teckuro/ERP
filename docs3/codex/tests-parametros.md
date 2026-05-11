# Plan de pruebas - Módulo de Parámetros

El módulo de **Parámetros** administra los valores legales y empresariales que se utilizan en todo el ERP: sueldos mínimos, topes de gratificación, tasas previsionales, etc.� Este plan de pruebas detalla los escenarios que deben validarse para asegurar su correcto funcionamiento.

## Escenarios de prueba

| ID | Descripción | Pasos | Resultado esperado |
|---|---|---|---|
| **PAR-01** | Carga de parámetros mensuales desde PreviRed | 1. Ejecutar el script de carga para un periodo específico (por ejemplo, abril� 2026).� 2. Verificar que se creen registros en las tablas correspondientes (`parametros_generales`, `afp_vigencia`, `afc_parametro`, etc.). | Todos los parámetros del archivo se cargan con `vigencia_inicio` y `vigencia_fin` correctos.� Los valores se muestran en la UI. |
| **PAR-02** | Detección de parámetros duplicados | 1. Cargar manualmente un parámetro con la misma vigencia y valor que ya existe. | El sistema impide el registro duplicado y muestra un mensaje de error. |
| **PAR-03** | Cambio de valor con nueva vigencia | 1. Editar un parámetro existente para modificar su valor y establecer una nueva `vigencia_inicio`. | El sistema debe cerrar la vigencia anterior (`vigencia_fin` igual al día anterior) y crear una nueva línea con el valor actualizado. |
| **PAR-04** | Validación de vigencia inconsistentes | 1. Intentar crear un parámetro con `vigencia_fin` anterior a `vigencia_inicio`. | La UI debe impedir el guardado y mostrar un mensaje de error indicando que la fecha de fin debe ser posterior a la fecha de inicio. |
| **PAR-05** | Eliminación de parámetros históricos | 1. Intentar eliminar un registro de parámetro que ya se utilizó en cálculos de nómina. | El sistema debe impedir la eliminación física y sugerir marcar el registro como inactivo, manteniendo el historial para trazabilidad. |
| **PAR-06** | Carga masiva con formato incorrecto | 1. Subir un archivo de parámetros con columnas adicionales o separador incorrecto. | El sistema rechaza la carga y muestra un log de errores que explica el motivo (por ejemplo, “separador no válido” o “columna desconocida”). |

## Consideraciones generales

* Las pruebas deben ejecutarse tanto para la carga manual (UI) como para la carga masiva (script Python) para garantizar que ambos caminos producen los mismos resultados.
* Se deben considerar escenarios en los que las tasas previsionales cambian a mitad de mes y validar cómo el sistema deriva el periodo operativo (`periodo`) a partir de la vigencia.
* Registrar en el `CHANGELOG.md` cualquier modificación de las pruebas cuando cambien los requisitos o las normativas.

## Fixture minimo DOC-04

- periodo: `2026-04`
- IMM 18-65: `539000`
- Asignacion familiar tramo 1: `22007`
- Jornada maxima desde `2026-04-26`: `42`
- Ley 16.744 basica: `0.90`
- SIS: pendiente / segun fuente oficial mensual

La tasa SIS no se fija como constante; debe confirmarse por periodo antes de validar nomina.
