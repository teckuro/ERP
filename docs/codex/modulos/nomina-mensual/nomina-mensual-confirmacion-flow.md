# NOM-MENSUAL-CONFIRMACION-FLOW-00 - Nómina mensual confirmada

Fecha: 2026-05-18  
Tipo: definición documental de producto, UX y arquitectura funcional.  
Estado: documentada.

## 1. Problema detectado

La pantalla actual de nómina se ha ido ordenando como `Preparar nómina`, con validación del período, construcción de base, cálculo, aprobación, cierre y acta operativa. Ese enfoque es correcto internamente, pero para RRHH puede seguir sintiéndose como un tablero técnico del proceso.

La experiencia que se necesita comunicar es más simple:

```txt
Estoy trabajando la Nómina mensual de un período.
Genero una nómina.
Reviso trabajador por trabajador qué falta o qué cambió.
Confirmo una versión oficial.
Desde esa versión genero liquidaciones.
```

## 2. Decisión principal

La regla rectora del módulo queda definida así:

```txt
Nómina mensual confirmada = fuente oficial para generar liquidaciones.
```

Las liquidaciones no deben generarse desde datos vivos dispersos. Deben generarse desde una versión confirmada de la nómina mensual del período.

Esta fase no cambia código, SQL, motor ni persistencia. Deja definida la dirección para fases posteriores.

## 3. Cambio conceptual visible

El concepto principal para usuario final debe evolucionar desde:

```txt
Preparar nómina
Validar período
Construir base
Calcular y revisar
Cerrar nómina
```

hacia:

```txt
Nómina mensual
Generar nómina
Revisar trabajadores
Confirmar nómina
Generar liquidaciones
```

Los pasos técnicos pueden seguir existiendo internamente, pero no deben dominar la experiencia visual ni el copy principal.

## 4. Flujo operativo propuesto

```txt
Nómina mensual del período
-> Verificar período (prevalidación; diagnóstico persistente en BD — ver nom-periodo-diagnostico-persist-01)
-> Generar borrador de nómina
-> Revisar trabajadores incluidos, omitidos, bloqueados y con cambios
-> Resolver faltantes o confirmar advertencias
-> Confirmar nómina mensual
-> Generar liquidaciones desde nómina confirmada
```

CTA «Revisar parámetros» en consola solo cuando el período **no** está operativo en prevalidación (`parametrosOperativos === false`); ver `NOM-PREVALIDACION-PARAMETROS-CTA-01`.

## 5. Estados de la nómina mensual

| Estado | Qué significa para RRHH | CTA principal esperado |
|---|---|---|
| Sin generar | Todavía no existe nómina mensual del período. | Generar nómina |
| Borrador generado | El sistema armó una nómina preliminar con trabajadores, parámetros, movimientos y recurrentes del período. | Revisar trabajadores |
| En revisión | Hay trabajadores con bloqueos, advertencias o cambios que requieren revisión. | Revisar trabajadores |
| Lista para confirmar | No quedan bloqueos críticos y la nómina puede convertirse en versión oficial. | Confirmar nómina |
| Confirmada | La nómina queda bloqueada como base oficial del período. | Generar liquidaciones |
| Liquidaciones generadas | Ya existen liquidaciones generadas desde la nómina confirmada. | Ver liquidaciones |

## 6. Estados por trabajador

La revisión de nómina debe bajar desde el diagnóstico general hacia una lectura por trabajador.

| Estado | Uso visible | Ejemplo de copy |
|---|---|---|
| Listo | Puede calcularse normalmente. | Sin observaciones críticas. |
| Revisar | Tiene advertencias o datos que RRHH debe confirmar. | Tiene licencia médica registrada en el período. |
| Bloqueado | Falta información obligatoria para calcular o confirmar. | Falta previsión o régimen previsional. |
| Cambio detectado | Hay diferencias relevantes respecto al período anterior. | Sueldo base cambió de $650.000 a $720.000. |
| Omitido | No entra en la nómina del período. | Contrato finalizado antes del período. |

## 7. Qué debe revisar la nómina generada

Al generar o regenerar una nómina mensual, el sistema debe poder revisar como mínimo:

- trabajadores habilitados para el período;
- trabajadores excluidos u omitidos y motivo;
- parámetros obligatorios del período;
- movimientos del mes aprobados o pendientes;
- asignaciones recurrentes vigentes;
- cambios relevantes frente al período anterior;
- bloqueos que impiden confirmar;
- advertencias que RRHH puede aceptar o corregir.

## 8. Regla de snapshot y trazabilidad

Las liquidaciones oficiales internas deben nacer desde la nómina mensual confirmada, no desde datos vivos.

Motivo:

```txt
Si luego cambia un sueldo, previsión, contrato, movimiento, recurrente o dato personal,
no debe alterar liquidaciones ya generadas sin una acción explícita de nueva versión,
reapertura o reliquidación futura documentada.
```

Flujo trazable esperado:

```txt
Trabajador
-> Datos vigentes al generar
-> Nómina mensual generada
-> Revisión por trabajador
-> Nómina mensual confirmada
-> Liquidación generada
```

## 9. Historial operativo requerido

La nómina mensual debe dejar historial administrativo por período. Ejemplos:

- Se generó nómina mensual.
- Se incluyeron trabajadores del período.
- Se omitieron trabajadores con motivo.
- Se detectaron trabajadores bloqueados.
- Se detectaron cambios relevantes.
- RRHH confirmó una advertencia.
- RRHH corrigió un bloqueo en otro módulo.
- Se confirmó la nómina mensual.
- Se generaron liquidaciones desde la nómina confirmada.

Este historial no debe ser protagonista visual permanente. Debe estar disponible como soporte y trazabilidad.

## 10. Implicancias para UI

La pantalla de Nómina mensual debe priorizar:

1. período activo;
2. estado de la nómina;
3. acción principal única;
4. listado o resumen de trabajadores;
5. faltantes y cambios por trabajador;
6. confirmación explícita antes de pasar a liquidaciones;
7. historial como soporte secundario.

Evitar que el centro de la pantalla se llene con diagnósticos abstractos o etiquetas técnicas. RRHH debe entender primero:

```txt
¿La nómina existe?
¿Qué trabajador falta revisar?
¿Qué cambió?
¿Puedo confirmar?
¿Puedo generar liquidaciones?
```

## 11. Relación con Liquidaciones oficiales

Liquidaciones oficiales mantiene su regla actual:

```txt
Liquidaciones oficiales no recalcula.
Materializa una nómina confirmada/cerrada.
```

El lenguaje futuro debe preferir `nómina mensual confirmada` sobre `snapshot cerrado` cuando se hable con usuario final. Los términos técnicos pueden quedar en documentación técnica, soporte o disclosures secundarios.

## 12. Compatibilidad con la base actual

La base actual todavía conserva nombres, rutas y componentes asociados a `Preparar nómina`:

- ruta visible: `/remuneraciones/proceso-mensual`;
- contenedor: `src/app/features/nomina-mensual/containers/proceso-mensual-container/`;
- conceptos internos: prevalidación, cálculo, snapshot, aprobación y cierre operativo.

Esta fase no exige renombrar rutas ni archivos. Define la dirección para que fases posteriores ajusten copy, estados y estructura visual sin romper compatibilidad.

## 13. Fases futuras sugeridas

### NOM-MENSUAL-WORKSPACE-01

Reorden visual de la pantalla actual para comunicar `Nómina mensual` como workspace del período, manteniendo rutas y servicios.

### NOM-MENSUAL-TRABAJADORES-02

Vista por trabajador de la nómina generada: listos, revisar, bloqueados, cambios detectados y omitidos.

### NOM-MENSUAL-CONFIRMAR-03

Confirmación explícita de nómina mensual como versión oficial del período, con advertencia clara de que será la base de liquidaciones.

### NOM-LIQ-DESDE-NOMINA-CONFIRMADA-04

Ajuste visible de Liquidaciones oficiales para hablar de nómina mensual confirmada como entrada principal.

## 14. Fuera de alcance de esta fase

No se toca:

- Angular, HTML, CSS o rutas;
- servicios productivos;
- mappers o payloads;
- SQL/RPC/RLS;
- motor de cálculo;
- persistencia de snapshot;
- generación real de liquidaciones;
- PDF, firma, envío, Previred, LRE, banco o contabilidad;
- estilos globales protegidos.
