# NOM-MOVIMIENTOS-SIMPLE-00 - Movimientos de remuneracion

Fecha: 2026-05-15

Tipo: decision funcional/UX documental. No modifica Angular, SQL, rutas, motor, servicios productivos ni calculo de nomina.

## Resumen ejecutivo

`Movimientos del mes` y `Asignaciones recurrentes` deben evolucionar hacia una sola experiencia visible:

```txt
Movimientos de remuneracion
```

Para RRHH no son dos problemas distintos. Ambos responden que suma, descuenta, informa o ajusta la remuneracion de un trabajador. La diferencia visible no debe ser el modulo, sino la duracion del movimiento:

```txt
Solo este mes
Recurrente
En cuotas
```

Esta fase no fusiona pantallas ni datos. Deja la decision preparada para fases posteriores.

## Problema actual

Hoy el ERP separa:

- `Movimientos del mes`: hechos puntuales del periodo.
- `Asignaciones recurrentes`: haberes/descuentos vigentes por trabajador.

La separacion obliga a RRHH a decidir donde registrar un bono, descuento, anticipo, prestamo, asignacion o ajuste antes de pensar en su impacto real. Eso produce duplicacion mental, dudas de registro y mayor friccion en `Preparar nomina`.

## Decision de producto

El nombre visible recomendado para la experiencia unificada es:

```txt
Movimientos de remuneracion
```

En menu puede abreviarse como:

```txt
Movimientos
```

Descripcion recomendada:

```txt
Registra y revisa haberes, descuentos, anticipos, bonos, asignaciones y ajustes que afectan la remuneracion de los trabajadores.
```

`Asignaciones recurrentes` no desaparece como logica. Queda absorbida como vista recurrente dentro de `Movimientos de remuneracion`.

## Modelo conceptual

| Concepto | Significado |
|---|---|
| Concepto de remuneracion | Catalogo maestro: bono, descuento, asignacion, anticipo, etc. |
| Movimiento de remuneracion | Aplicacion concreta de un concepto a un trabajador. |
| Duracion | Define si aplica solo este mes, se repite o se paga/descuenta en cuotas. |
| Periodo | Mes en que impacta la nomina. |
| Preparar nomina | Proceso que consume movimientos activos/revisados del periodo. |

Regla central:

```txt
No existen dos modulos para lo mismo. Existe un movimiento, y ese movimiento puede durar un mes, repetirse o pagarse en cuotas.
```

## Duraciones permitidas

### Solo este mes

Aplica unicamente al periodo seleccionado.

Ejemplos:

- bono puntual;
- descuento puntual;
- ajuste manual del mes;
- anticipo unico.

### Recurrente

Se repite mes a mes desde un periodo o fecha de inicio. Puede tener termino si el modelo actual lo permite.

Ejemplos:

- bono de responsabilidad;
- asignacion fija pactada;
- descuento mensual interno;
- seguro complementario.

### En cuotas

Divide un monto en varias cuotas mensuales.

Ejemplos:

- prestamo empresa;
- descuento por compra interna;
- anticipo pactado en cuotas;
- reintegro en cuotas.

No agregar en esta fase categorias visibles como `Retroactivo`, `Futuro`, `Especial`, `Legal`, `Manual avanzado`, `Programado` o `Ajuste historico`. Si existen internamente, quedan como metadata o caso posterior, no como duracion principal.

## Vistas recomendadas

Usar tres vistas principales:

```txt
Este mes
Recurrentes
Todos
```

`Este mes` debe ser la vista principal. Muestra todo lo que afecta la nomina del periodo: movimientos unicos, recurrentes activos, cuotas correspondientes y registros por revisar.

`Recurrentes` es vista de administracion de movimientos que se repiten: activos, pausados, finalizados y con termino proximo si aplica.

`Todos` es vista historica o general. No debe reemplazar la mesa diaria de trabajo.

## Estados minimos

Estados visibles recomendados:

```txt
Borrador
Activo
Pausado
Finalizado
```

Cuando falte informacion o exista inconsistencia, usar una marca secundaria:

```txt
Activo - Requiere revision
```

No convertir `Requiere revision` en estado principal si complica la logica existente.

## Relacion con Preparar nomina

`Preparar nomina` debe consumir movimientos activos/revisados del periodo. No debe duplicar la edicion completa de movimientos.

Resumen futuro recomendado:

```txt
Movimientos detectados: 48
Movimientos unicos del mes: 18
Recurrentes aplicados: 22
Cuotas aplicadas: 8
Movimientos por revisar: 3
```

Accion clara:

```txt
Revisar movimientos
```

Esa accion debe navegar a `Movimientos de remuneracion` filtrado por el periodo activo.

## Impacto en menu

La navegacion futura de Remuneraciones debe tender a:

```txt
Remuneraciones
|-- Preparar nomina
|-- Movimientos
|-- Liquidaciones
|-- Parametros
```

`Asignaciones recurrentes` debe desaparecer progresivamente como pantalla principal visible, sin eliminar su logica ni su fuente tecnica actual.

## Auditoria del estado actual

### Pantallas y rutas

- `/remuneraciones/novedades-mensuales` es la ruta canonica visible para `Movimientos del mes`.
- `/remuneraciones/movimientos-variables` queda como redirect legacy hacia `novedades-mensuales`.
- `/remuneraciones/haberes-descuentos` mantiene `Asignaciones recurrentes`.
- `/remuneraciones/proceso-mensual` consume entradas del periodo en `Preparar nomina`.

### Fuentes tecnicas reutilizables

| Fuente | Uso actual | Reutilizable para |
|---|---|---|
| `nomina_novedad_mensual` | Movimientos mensuales visibles en el flujo nuevo de novedades. | `Solo este mes`. |
| `movimiento_variable_mensual` | Fuente legacy de movimientos variables mensuales. | Compatibilidad y migracion progresiva. |
| `haberdescuento_persona` | Asignaciones recurrentes por trabajador/concepto/vigencia. | `Recurrente`. |
| `concepto` | Catalogo maestro de conceptos de remuneracion. | Selector y clasificacion del movimiento. |
| `EntradasMensualesPeriodoService` | Consolida recurrentes, novedades y legacy por periodo. | Base conceptual de `Este mes`. |

### Campos ya representados

En el proyecto actual ya existen estructuras para:

- `id_persona`;
- `id_contrato`;
- `id_concepto`;
- `tipo_movimiento`;
- `monto`;
- `periodo`;
- `vigencia_inicio`;
- `vigencia_fin`;
- `periodicidad`;
- `estado`;
- `observacion`.

Tambien existen campos de cuotas en estructuras legacy de prestamos (`cuotas_total`, `cuotas_pagadas`), pero no estan integrados como duracion visible unificada de movimientos de remuneracion.

### Duplicaciones actuales

- `Movimientos del mes` y `Asignaciones recurrentes` usan pantallas y lenguaje separados aunque ambos terminan alimentando remuneraciones.
- `movimiento_variable_mensual` convive con `nomina_novedad_mensual`; el primero aparece como legacy y el segundo como flujo mensual nuevo.
- `Preparar nomina` ya distingue recurrentes y movimientos del mes, pero aun muestra textos separados en varios puntos.

### Lo que falta para unificar

- Definir contrato tecnico de `duracion` sin romper fuentes actuales.
- Resolver como representar `En cuotas` sin forzar migracion SQL inmediata.
- Definir mapeo entre estados actuales (`BORRADOR`, `VALIDADO`, `aprobada`, etc.) y estados visibles minimos.
- Crear navegacion y copy unificado en una fase posterior.
- Definir si `movimiento_variable_mensual` queda solo como compatibilidad o se migra a `nomina_novedad_mensual`.

## Riesgos

- Mezclar catalogo (`concepto`) con aplicacion concreta (`movimiento`).
- Renombrar pantallas antes de resolver compatibilidad de rutas y textos.
- Tratar cuotas como categoria nueva sin modelo suficiente.
- Cambiar calculo o SQL durante una fase que solo busca decision funcional.
- Ocultar que recurrentes siguen existiendo como logica necesaria.

## Fases siguientes

### NOM-MOVIMIENTOS-SIMPLE-01

Aplicar cambios visibles iniciales: menu, titulo, descripcion, textos, navegacion hacia pantalla unificada y primer layout simple. Sin tocar calculo ni SQL critico.

### NOM-MOVIMIENTOS-SIMPLE-02

Unificar formulario de creacion/edicion: trabajador, concepto, monto, duracion, periodo inicio, cuotas si aplica y estado.

### NOM-MOVIMIENTOS-SIMPLE-03

Conectar con `Preparar nomina`: resumen de movimientos detectados, recurrentes aplicados, cuotas del periodo, movimientos por revisar y boton `Revisar movimientos`.

## Restricciones de esta fase

No se debe modificar:

- Angular;
- rutas;
- SQL/RPC/RLS;
- motor de calculo;
- liquidaciones;
- servicios productivos;
- mappers;
- payloads;
- estilos globales.

La salida de esta fase es solo documental.

### Cierre NOM-MOVIMIENTOS-SIMPLE-01

Implementada como primera capa visible. Menu `Movimientos`, pantalla `Movimientos de remuneracion`, vista mensual `Este mes`, vista `Recurrentes` sobre la ruta existente de haberes/descuentos y copy de `En cuotas` preparado sin calculo ni persistencia nueva. Documento: [`../../diseno/nom-movimientos-simple-01.md`](../../diseno/nom-movimientos-simple-01.md).

### Cierre NOM-MOVIMIENTOS-SIMPLE-01-FORM-POLISH

Se pulio el modal `Registrar movimiento` como capa UX local. El formulario queda guiado por bloques: Movimiento, Duracion del movimiento, Detalle administrativo opcional y Resumen. La duracion visible ya permite seleccionar `Solo este mes`, `Recurrente` o `En cuotas`.

`En cuotas` queda tratado como UI preparada para prestamos, anticipos, reintegros o descuentos pactados: cantidad de cuotas, monto por cuota, cuota inicial, periodo de inicio y periodo estimado de termino. Esta fase no cambia SQL, motor, servicios, payloads ni persistencia critica; el guardado productivo sigue usando el contrato existente de novedades mensuales.
