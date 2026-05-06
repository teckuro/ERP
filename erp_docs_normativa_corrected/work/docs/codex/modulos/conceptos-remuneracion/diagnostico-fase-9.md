# Diagnóstico de fase 9 – Conceptos de remuneración

La fase 9 del proyecto aborda el diseño e implementación del **módulo de conceptos de remuneración**. Este módulo centraliza la definición de haberes, descuentos e indemnizaciones, clasificándolos como imponibles o no imponibles, afectos o no al impuesto único y, en el futuro, mapeándolos a los códigos del Libro de Remuneraciones Electrónico (LRE).

## Estado actual

* La base de datos contiene una tabla `concepto` con campos como `nombre`, `descripcion`, `afecta_imponible`, `afecta_liquido` y `estado`. No existe aún una referencia al catálogo LRE.
* Los módulos de **Haberes y descuentos** y **Movimientos variables** utilizan el catálogo de conceptos, pero la clasificación de imponibilidad se realiza de manera manual o por convención.
* No se ha documentado el mapeo de los conceptos internos a los códigos LRE, ni se han definido reglas para conceptos especiales (gratificación legal, horas extraordinarias, indemnizaciones, etc.).

## Brechas identificadas

| Área | Brecha | Impacto |
|---|---|---|
| **Clasificación de conceptos** | No existe una taxonomía oficial que identifique qué conceptos son imponibles, no imponibles, afectos a cotizaciones o a impuestos. | El cálculo de cotizaciones e impuesto único depende de esta clasificación; errores pueden generar diferencias en la nómina. |
| **Mapa al catálogo LRE** | No se ha asignado a cada concepto un código del catálogo LRE. | Sin este mapeo, la exportación al LRE no puede generarse automáticamente. |
| **Vigencias y parámetros** | Algunos conceptos requieren vigencias o tasas asociadas (por ejemplo, gratificación legal, horas extraordinarias). | Falta de vigencias puede provocar que se apliquen tasas antiguas o incorrectas. |
| **Documentación de reglas de cálculo** | No se han documentado reglas de cálculo específicas (por ejemplo, cálculo de sobretiempo con recargo del 50 %, tope de gratificación de 4,75 IMM). | El motor de liquidación no podrá implementar correctamente estas reglas. |

## Próximos pasos

1. **Definir taxonomía**: elaborar una tabla de clasificación para cada concepto con atributos tales como: imponible, afecta impuesto único, afecta gratificación, afecta AFC, afecta SIS, etc.
2. **Asignar códigos LRE**: crear una columna `codigo_lre` en la tabla `concepto` y definir el mapeo al catálogo oficial. Actualizar `catalogo_lre` si es necesario.
3. **Establecer vigencias y parámetros**: para conceptos cuya tasa o tope dependa de normativas (p.ej., gratificación legal, horas extraordinarias), definir tablas de vigencia y relacionarlas con el concepto.
4. **Documentar reglas de cálculo**: crear documentos específicos por concepto complejo, indicando fórmula, tope, base de cálculo y referencias normativas.
5. **Pruebas**: diseñar casos de prueba unitarios y de integración para validar la clasificación y el cálculo correcto de cada concepto.

Este diagnóstico será el punto de partida para la fase **DOC‑03B – Corrección de canonicidad y trazabilidad normativa**, en la que se completará la consolidación normativa-operativa.
