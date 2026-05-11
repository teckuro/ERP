# Criterios globales y estados

## Objetivo

Recoger las reglas transversales de estados, validaciones y cierres que aplican a todos los modulos del ERP. Este documento complementa el `contrato-general.md` y evita duplicar criterios en cada modulo.

## Clasificacion de datos

| Tipo | Definicion | Ejemplo |
|------|------------|---------|
| **PERIODO_MENSUAL** | Datos cuya clave natural incluye `periodo` `YYYY-MM` y representan un snapshot del mes. | `parametros_generales`, `tramo_carga`. |
| **VIGENCIA** | Datos versionados por `vigencia_inicio` y `vigencia_fin`. El periodo activo se utiliza para resolver que fila esta vigente. | `parametros_legales`, `afc_parametro`, `tabla_impuesto_unico`. |
| **CATALOGO_GLOBAL** | Catalogos que no dependen del periodo activo; pueden tener `periodo` nulo por trazabilidad. | `ccaf_entidad`, `institucion_apv`. |
| **CONFIG_EMPRESA** | Preferencias propias del cliente que se guardan en el snapshot mensual. | CCAF seleccionada, Mutual seleccionada. |

La UI debe mostrar mensajes coherentes con el tipo de dato. Un catalogo global no debe culpar al periodo activo si esta vacio.

## Estados del periodo de remuneracion

`periodo_remuneracion.estado` es la fuente oficial del estado de carga mensual y puede tomar los valores `pendiente`, `parcial`, `cargado`, `corregido`, `cerrado` o `error`. 
No inventar estados alternativos en cliente. 

Reglas de transicion:

- **Preparar** (`--modo preparar`): lleva el estado a `parcial` si el periodo no estaba `cerrado` ni `corregido`.
- **Cargar** (`--modo mensual`): lleva el estado a `cargado` cuando todas las secciones obligatorias validan.
- **Corregir**: se marca `corregido` manualmente cuando hay ajustes posteriores a la carga.
- **Cerrar**: estado final que no se degrada.

## Estados de entidades

Cada modulo debe derivar su estado visual a partir de campos de negocio. 
Por ejemplo, el modulo Empleados deriva `Borrador`, `En proceso`, `Activo / Apto`, etc., en funcion de `paso_alta_avanzada`, `estado_ficha` y `apto_para_remuneraciones`. 
No se deben inventar estados sin contrato.

## Criterios de cierre de fases

Una fase puede considerarse cerrada cuando:

- Se cumple el objetivo definido en su contrato.
- El codigo y la documentacion estan alineados.
- Las pruebas unitarias y E2E validadas no muestran regresiones.
- Los pendientes se registran en el documento de fase o en el tablero.
- El orquestador actualiza su estado a `Cerrada` en `estado-fases.md`.

## Pendientes

Si durante la revision se detectan vacios o contradicciones que no estan resueltos en la documentacion, deben marcarse como **Pendiente** en el documento correspondiente y enlazarse desde el mapa de documentacion. Los pendientes no bloquean la publicacion de este repositorio, pero deben resolverse antes de cerrar la fase afectada.

## Reglas legales transversales

Además de los criterios operativos, el ERP debe cumplir ciertas reglas legales que aplican a todos los módulos:

- **Sueldo base:** el salario básico de cada trabajador con jornada completa debe ser igual o superior al **Ingreso Mínimo Mensual (IMM)** vigente, según corresponda a su grupo de edad.  Las actualizaciones del IMM se detallan en `normativa-remuneraciones.md` y el módulo Parámetros debe reflejar estos cambios.
- **Horas extraordinarias:** cualquier hora trabajada por sobre la jornada ordinaria se paga con un recargo mínimo del 50 % sobre el valor de la hora ordinaria.  La jornada ordinaria vigente (45, 44, 42 o 40� horas) se determina de acuerdo con la gradualidad de la Ley� 21.561.
- **Reducción de jornada:** la reducción gradual de la jornada a 40� horas semanales no puede implicar una disminución de la remuneración mensual.  El cálculo de la hora ordinaria debe ajustarse al nuevo número de horas.
- **Gratificación legal:** si el empleador opta por el sistema de gratificación del artículo� 50 del Código del Trabajo, deberá pagar el 25� % de lo devengado en remuneraciones mensuales con un tope de 4,75� IMM por trabajador.  Este mecanismo se implementa en los módulos de conceptos y haberes.
- **Libro de Remuneraciones Electrónico:** el empleador debe cargar mensualmente las remuneraciones y descuentos en el LRE dentro de los 15 primeros días hábiles del mes siguiente.  El alta en el LRE es irrevocable y reemplaza al libro en papel.
