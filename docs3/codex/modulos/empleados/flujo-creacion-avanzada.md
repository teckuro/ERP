# Empleados - flujo de creacion avanzada

## Objetivo

Describir el wizard de alta avanzada, el manejo de pasos y el guardado de borradores. 
Este flujo permite crear la ficha completa en un solo recorrido y validar inmediatamente para remuneraciones.

## Alcance

- Ruta de acceso y estructura del wizard.
- Pasos y campos incluidos.
- Reglas para guardar borrador y reanudar.
- Resultado al finalizar el wizard.

## Flujo resumido

```
Listado → Crear empleado → Creacion avanzada
```

1. El usuario selecciona **Crear empleado** en modo avanzado.
2. Se inicia un wizard con multiples pasos (Datos personales, Contrato, Prevision y salud, Bancario, APVI, Resumen).
3. En cada paso se validan los campos correspondientes y se ofrece la accion **Guardar borrador**.
4. Al guardar un borrador:
   - El sistema crea o actualiza la persona con `estado = BORRADOR`, `estado_ficha = INCOMPLETO`, `apto_para_remuneraciones = false` y `paso_alta_avanzada` con el paso actual.
   - La accion principal en el listado sera **Continuar alta**.

5. Al completar todos los pasos y confirmar:
   - La persona se activa (`estado = ACTIVO`) y la ficha queda valida (`estado_ficha = VALIDO`, `apto_para_remuneraciones = true`).
   - Se limpia `paso_alta_avanzada` para evitar volver al wizard.

## Pasos comunes del wizard

| Paso | Contenido | Notas |
|-----|-----------|------|
| 1. Datos personales | Identidad, nombres, datos de contacto | - |
| 2. Contrato | Tipo de contrato, jornada, fecha de inicio, fecha termino | APVI condicional segun tipo de contrato |
| 3. Prevision y salud | Sistema previsional, seguro de salud, mutual | - |
| 4. Bancario | Cuenta bancaria, banco, forma de pago | Opcional si no aplica pago bancario |
| 5. APVI (opcional) | Institucion y forma de pago APV | Solo si corresponde |
| 6. Resumen y confirmacion | Se muestra una lista de campos completos e incompletos | Permite guardar borrador o finalizar |

## Archivos relacionados

- `contrato-general.md` - reglas de estados y flujos.
- `ficha-empleado.md` - acciones posteriores.

## Pruebas/validacion

- Al guardar borrador, la persona queda en estado `BORRADOR` y el listado muestra **Continuar alta**.
- Al finalizar el wizard, la persona queda activa y apta.
- El wizard debe reanudar en el paso guardado cuando se selecciona **Continuar alta**.
