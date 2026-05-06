# Python – carga de parámetros mensual

El ERP utiliza un script en **Python** para automatizar la carga de parámetros legales y empresariales. Esta herramienta extrae los valores publicados por Previred y otras fuentes oficiales, los transforma al formato de nuestras tablas y los carga en la base de datos.

## Modos de ejecución

El script contempla dos modos principales:

* **Preparar**: descarga los archivos de Previred (TXT/CSV) y realiza una transformación preliminar, generando archivos intermedios. Este modo permite revisar manualmente los datos antes de cargarlos en la base.
* **Mensual**: toma los archivos intermedios o descarga directamente de Previred, valida la estructura y vigencia de cada parámetro y los inserta en las tablas correspondientes (`parametros_generales`, `afp_vigencia`, `afc_parametro`, `salud_plan`, `tramo_carga`, etc.).

## Flujo general del script

1. **Descarga**: se conectan a la página de Previred y se descargan los archivos de indicadores previsionales del mes. También se pueden consumir APIs o fuentes alternativas si estuvieran disponibles.
2. **Parsers específicos**: para cada tipo de parámetro (IMM, UF, UTM, AFP, AFC, Salud, SIS, Ley 16.744, Asignación familiar, impuestos), existen funciones de parsing que convierten el formato original en filas de nuestras tablas.
3. **Validaciones**: se verifican la existencia y vigencia de los parámetros, se detectan valores vacíos o no numéricos y se comparan con la versión anterior para asegurar que no haya retrocesos (por ejemplo, que una tasa no disminuya si la normativa indica un aumento).
4. **Carga**: se insertan o actualizan los registros en la base de datos, cerrando la vigencia anterior cuando corresponde. Se generan logs de inserciones, actualizaciones y errores.
5. **Reporte**: al finalizar, el script produce un reporte con los parámetros cargados, los cambios detectados y las advertencias encontradas. Este reporte debe revisarse y archivarse.

## Consideraciones de desarrollo

* **Versionamiento**: el script se versiona con un número de versión alineado con el ERP (por ejemplo, v6.11). Cada cambio debe documentarse en `CHANGELOG.md` y contar con pruebas automatizadas.
* **Configurabilidad**: se deben parametrizar las rutas de descarga, las credenciales de conexión (si aplica) y los periodos a cargar para permitir ejecuciones en distintos entornos (QA, staging, producción).
* **Pruebas unitarias**: incluir pruebas que validen la correcta lectura y transformación de cada tipo de parámetro, así como la lógica de vigencia.

Para conocer la especificación completa, consulte `modulos/parametros/carga-parametros-python.md`.
