# Arquitectura funcional de remuneraciones

## 1. Objetivo

Este documento define el contrato estructural del flujo de remuneraciones del ERP chileno. Su objetivo es evitar mezclar responsabilidades entre catalogos, asignaciones, novedades, preparacion, calculo, resultado y salidas legales.

La arquitectura ordena donde vive cada dato, para que sirve, cuando participa, cual es su fuente y que modulo es responsable. No implementa codigo, SQL, motor, liquidaciones, Previred ni LRE.

## 2. Principio rector

Maestros identifican.  
Parametros regulan.  
Conceptos definen.  
Asignaciones recurrentes preparan.  
Novedades mensuales informan el mes.  
Proceso mensual valida.  
Motor calcula.  
Liquidacion congela.  
Previred y LRE reportan.

## 3. Regla para decidir donde vive cada dato

Cada dato debe tener:

- un lugar claro;
- un proposito claro;
- un momento claro;
- una fuente clara;
- un responsable claro.

| Pregunta | Donde vive |
|---|---|
| Identifica al trabajador? | Maestros RRHH |
| Regula el calculo? | Parametros |
| Define un item? | Conceptos de remuneracion |
| Se repite o queda pactado? | Haberes y descuentos recurrentes |
| Ocurre solo en el mes? | Novedades mensuales |
| Prepara el calculo? | Proceso mensual |
| Calcula? | Motor de liquidacion |
| Es resultado final? | Liquidacion |
| Se informa legalmente? | Previred / LRE |

## 4. Mapa general de modulos

| Modulo | Responsabilidad | Fuente principal | Resultado | No debe hacer |
|---|---|---|---|---|
| Maestros RRHH | Identificar trabajador, contrato y condiciones base. | Persona, contrato, empresa, sucursal, centro de costo, cargo, jornada, prevision, salud, banco. | Trabajador apto o no apto para remuneraciones. | Calcular remuneraciones, guardar bonos del mes, congelar liquidaciones. |
| Parametros | Regular valores legales, mensuales, vigencias y configuracion cliente del periodo. | `parametros_generales`, `parametros_generales_cliente`, catalogos y vigencias. | Parametros operativos y estado de completitud/reconciliacion. | Calcular liquidaciones, asignar conceptos a trabajadores, generar novedades. |
| Conceptos de remuneracion | Definir que items pueden existir y como se comportan. | Catalogo `concepto` y clasificaciones funcionales. | Item gobernado: haber/descuento, imponible, tributable, legal/manual/sistema, LRE. | Asignar valores a trabajadores, registrar novedades del mes, calcular liquidaciones. |
| Haberes y descuentos recurrentes | Asignar conceptos a trabajadores de forma pactada o repetitiva. | `haberdescuento_persona` y concepto asignable. | Asignaciones vigentes por trabajador y periodo. | Registrar hechos puntuales del mes, reemplazar novedades, calcular liquidacion. |
| Novedades mensuales | Registrar hechos que pertenecen solo a un periodo. | Movimientos variables del periodo. | Novedades validadas, observadas, bloqueadas o anuladas. | Crear conceptos, crear recurrentes automaticamente, calcular liquidacion final. |
| Proceso mensual | Validar y preparar el periodo antes del calculo. | Trabajadores, contratos, parametros, conceptos, recurrentes y novedades. | Bloqueos, advertencias, resumen y base lista para calculo. | Calcular liquidacion final o modificar fuentes. |
| Motor | Calcular remuneraciones segun entradas validadas. | Base preparada, reglas legales y parametros operativos. | Detalle calculado preliminar o resultado de motor. | Editar contratos, parametros, conceptos, recurrentes o novedades. |
| Liquidacion | Guardar el resultado congelado del calculo. | Resultado validado del motor. | Snapshot por periodo/trabajador/contrato/version. | Ser formulario libre, recalcularse silenciosamente o modificar fuentes. |
| Previred / LRE | Reportar resultados validados. | Liquidaciones cerradas, codigos legales, trabajador y empresa. | Archivos o salidas legales. | Calcular sueldo desde cero, decidir parametros, modificar liquidaciones. |
| Reportes / auditoria | Exponer trazabilidad, control y consulta. | Snapshots, estados, historicos y salidas. | Consultas y evidencias. | Ser fuente de verdad ni corregir datos operativos. |

## 5. Maestros RRHH

Responsabilidad: identificar al trabajador, su contrato y sus condiciones base.

Incluye:

- persona;
- contrato;
- empresa;
- sucursal;
- centro de costo;
- cargo;
- jornada;
- prevision;
- salud;
- banco;
- cargas familiares si aplica.

Los maestros responden quien es el trabajador, donde trabaja, bajo que contrato y con que condiciones base se le puede evaluar para remuneraciones.

No debe hacer:

- no calcula remuneraciones;
- no guarda bonos del mes;
- no guarda resultados de liquidacion.

## 6. Parametros

Responsabilidad: regular los valores y configuraciones del periodo.

Capas:

- `parametros_generales` = oficial / Python / accion mensual.
- `parametros_generales_cliente` = editable / configuracion cliente.
- referencia anterior = visual, no oficial.
- reconciliacion = decision entre oficial y cliente.
- cierre = validacion completa futura.

Reglas:

- Guardar parametros no es cerrar periodo.
- Mostrar referencia anterior no es cargar el mes.
- Usar referencia como base no es carga oficial.
- Carga oficial no sobrescribe cliente sin decision.
- Reconciliar modifica cliente, no oficial.

No debe hacer:

- no calcula liquidaciones;
- no asigna bonos a trabajadores;
- no genera novedades mensuales.

## 7. Conceptos de remuneracion

Responsabilidad: definir que items pueden existir en una liquidacion y como se comportan.

Ejemplos:

- sueldo base;
- gratificacion;
- horas extra;
- colacion;
- movilizacion;
- bono;
- comision;
- anticipo;
- prestamo;
- AFP;
- salud;
- AFC;
- impuesto unico.

Debe responder:

- es haber o descuento?
- es imponible?
- es tributable?
- afecta liquido?
- es legal, sistema o manual?
- es recurrente o variable?
- requiere cantidad?
- requiere monto?
- tiene codigo LRE?
- tiene vigencia?
- puede ser editable?
- se calcula automaticamente?

No debe hacer:

- no asigna valores a trabajadores;
- no calcula liquidaciones;
- no registra novedades mensuales.

## 8. Haberes y descuentos recurrentes

Responsabilidad: asignar conceptos a trabajadores de forma recurrente, pactada o con vigencia.

Ejemplos:

- colacion fija mensual;
- movilizacion fija mensual;
- bono responsabilidad mensual;
- descuento prestamo empresa en cuotas;
- APV pactado;
- anticipo recurrente;
- asignacion permanente.

Regla: si se repite o queda pactado, vive aqui.

Campos logicos:

- trabajador;
- concepto;
- monto o regla;
- vigencia_inicio;
- vigencia_fin;
- periodicidad;
- estado;
- observacion.

No debe hacer:

- no registra horas extra puntuales;
- no registra bonos unicos del mes;
- no calcula liquidacion.

## 9. Novedades mensuales / movimientos variables

Responsabilidad: registrar hechos, novedades o movimientos que pertenecen solo a un periodo.

Nombre funcional: **Novedades mensuales**.

Nombre tecnico posible:

- movimientos variables;
- movimientos del periodo;
- novedades de remuneracion del periodo.

Ejemplos:

- horas extra;
- comisiones;
- bono puntual;
- ausencia;
- atraso;
- licencia medica;
- permiso sin goce;
- anticipo puntual;
- descuento unico;
- retroactivo;
- reintegro.

Regla: si ocurre solo en un mes, vive aqui.

Campos logicos:

- periodo;
- trabajador;
- concepto;
- cantidad;
- monto;
- origen;
- estado;
- observacion.

No debe hacer:

- no reemplaza conceptos;
- no crea asignaciones recurrentes automaticamente;
- no calcula liquidacion final.

## 10. Proceso mensual / pre-nomina

Responsabilidad: preparar y validar el periodo antes de calcular.

Consume:

- trabajadores activos;
- contratos vigentes;
- parametros del periodo;
- conceptos vigentes;
- haberes/descuentos recurrentes vigentes;
- novedades mensuales;
- prevision/salud;
- centro de costo;
- validaciones.

Produce:

- estado del periodo;
- bloqueos;
- advertencias;
- resumen por trabajador;
- base lista para calculo.

Regla: proceso mensual valida y prepara. No calcula la liquidacion final.

Estados sugeridos:

- sin_iniciar;
- preparando;
- con_pendientes;
- listo_para_calcular;
- calculado;
- cerrado;
- error.

Los estados anteriores son una nomenclatura funcional futura. La implementacion actual mantiene sus estados de prevalidacion y snapshot segun los contratos 9.5A, 9.5B, 9.5C y MOTOR-03.

## 11. Motor de liquidacion

Responsabilidad: calcular remuneraciones.

Entrada:

- contrato vigente;
- parametros operativos del periodo;
- haberes recurrentes aplicables;
- novedades mensuales;
- reglas legales.

Salida:

- haberes imponibles;
- haberes no imponibles;
- descuentos legales;
- otros descuentos;
- impuesto unico;
- liquido a pago;
- detalle calculado.

Regla: el motor calcula, no edita fuentes.

No debe hacer:

- no modifica parametros;
- no cambia conceptos;
- no edita contratos;
- no crea novedades;
- no guarda decisiones de usuario.

## 12. Liquidacion

Responsabilidad: guardar el resultado congelado del calculo.

Debe ser snapshot.

Debe guardar:

- periodo;
- trabajador;
- contrato usado;
- parametros usados;
- detalle de haberes;
- detalle de descuentos;
- impuestos;
- liquido;
- fecha de calculo;
- version;
- estado.

Regla: la liquidacion es resultado, no entrada editable. No debe recalcularse silenciosamente.

Si cambia algo despues:

- correccion;
- recalculo versionado;
- reapertura controlada.

## 13. Previred / LRE / salidas legales

Responsabilidad: reportar resultados validados.

Consume:

- liquidaciones cerradas;
- detalle legal;
- codigos LRE;
- datos previsionales;
- datos trabajador/empresa.

No debe hacer:

- no calcular sueldo desde cero;
- no decidir parametros;
- no modificar liquidaciones.

## 14. Matriz de responsabilidades

| Modulo | Define | Asigna | Registra mes | Valida | Calcula | Congela | Reporta |
|---|---|---|---|---|---|---|---|
| Parametros | Si | No | No | Si | No | No | No |
| Conceptos | Si | No | No | No | No | No | No |
| Haberes/descuentos recurrentes | No | Si | No | Parcial | No | No | No |
| Novedades mensuales | No | No | Si | Parcial | No | No | No |
| Proceso mensual | No | No | No | Si | No | No | No |
| Motor | No | No | No | No | Si | No | No |
| Liquidacion | No | No | No | No | No | Si | No |
| Previred/LRE | No | No | No | Si | No | No | Si |

## 15. Flujo mensual resumido

1. Iniciar periodo.
2. Revisar parametros.
3. Confirmar configuracion cliente.
4. Revisar trabajadores y contratos.
5. Revisar conceptos vigentes.
6. Traer haberes/descuentos recurrentes vigentes.
7. Ingresar novedades mensuales.
8. Ejecutar prevalidaciones.
9. Calcular liquidaciones.
10. Revisar resultados.
11. Cerrar periodo.
12. Generar Previred/LRE/reportes.

## 16. Reglas de no mezcla

- Parametros no paga.
- Conceptos no asigna.
- Haberes recurrentes no son novedades.
- Novedades no son recurrentes.
- Proceso mensual no calcula.
- Motor no modifica fuentes.
- Liquidacion no es editable.
- Previred/LRE no recalcula.
- Reportes no son fuente de verdad.

## 17. Estado actual y pendientes

| Area | Estado | Observacion |
|---|---|---|
| Maestros RRHH | implementado | Existen flujos de empleados/ficha/contrato y aptitud para remuneraciones; este documento no cambia su alcance. |
| Parametros | parcial | Parametros oficiales, cliente, referencia y reconciliacion estan documentados/implementados funcionalmente; cierre completo de periodo queda futuro. |
| Conceptos de remuneracion | parcial | Existe mantenimiento y reglas de asignabilidad; gobierno completo para motor fuerte sigue sujeto a fases de Conceptos. |
| Haberes/descuentos recurrentes | implementado | Asignaciones recurrentes, vigencias y lectura para prevalidacion mensual existen segun contrato 9.3/9.5B. |
| Novedades mensuales | parcial | Existe dominio tecnico de movimientos variables mensuales; la nomenclatura funcional recomendada para RRHH es Novedades mensuales. |
| Proceso mensual / pre-nomina | parcial | Prevalidaciones, pre-nomina y calculo preliminar existen; no hay cierre productivo ni liquidacion oficial. |
| Motor de liquidacion | parcial | Hay motor preliminar y snapshots preliminares; no es motor productivo definitivo de liquidacion oficial. |
| Liquidacion | pendiente | No hay liquidacion oficial congelada como snapshot final de pago en el alcance actual. |
| Previred / LRE | pendiente | LRE tiene contrato documental; salidas legales reales desde liquidaciones cerradas quedan pendientes. |
| Reportes y auditoria | parcial | Hay documentacion y trazabilidad parcial; reporteria/auditoria productiva completa queda futura. |

## 18. Relacion con fases siguientes

Fases futuras propuestas, sin implementacion en este documento:

- NOM-01: modelo documental de novedades mensuales.
- NOM-02: prevalidaciones de proceso mensual.
- NOM-03: integracion de haberes recurrentes.
- NOM-04: integracion de novedades mensuales.
- NOM-05: contrato de entrada del motor.
- NOM-06: snapshot de liquidacion.
- NOM-07: cierre y salidas legales.

Estas fases deben mantener la regla madre: cada dato tiene lugar, proposito, momento, fuente y responsable claros.

<!-- ARQ-ERP-01-INTEGRACION -->

## Anexo canonico 2026-05-07

Esta arquitectura se complementa con [`../../orquestador/estructura-canonica-erp.md`](../../orquestador/estructura-canonica-erp.md).

Ajuste de nomenclatura:

- Donde el documento diga **Novedades mensuales / movimientos variables**, entender que **Novedades mensuales** es el nombre funcional oficial.
- **Movimientos variables** queda como termino historico/tecnico mientras se completa la transicion.
- La tabla canonica futura para hechos del periodo es `novedad_remuneracion_periodo`.
- La tabla `movimiento_variable_mensual` es legacy/transicion.
