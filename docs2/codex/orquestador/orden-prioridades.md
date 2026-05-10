# Orden de prioridades

## 1. Prioridad alta

Estas fases desbloquean el producto real:

1. ORDEN-01 - Integracion final del roadmap (**cerrada**)
2. SEG-01 - Roles, permisos, JWT/RLS base (**siguiente fase oficial**)
3. CONC-02 - Conceptos gobernados para motor
4. MOTOR-00 - Contrato del motor
5. MOTOR-01 - Motor v1
6. LIQ-01 - Liquidaciones snapshot

## 2. Prioridad media

Estas fases son importantes, pero dependen de las anteriores:

1. CIERRE-01 - Cierre mensual
2. PREVIRED-01 - Exportacion Previred
3. LRE-01 - Libro de Remuneraciones Electronico
4. REPORTES-01 - Reportes y auditoria

## 3. Prioridad baja por ahora

No son malas, pero no deben interrumpir el camino funcional:

1. UX-FINAL-01 - Pulido visual integral
2. Importacion masiva avanzada de movimientos variables
3. Dashboards ejecutivos
4. Exportaciones secundarias
5. Optimizaciones esteticas por pantalla

## 4. Regla de decision

Si una tarea no ayuda a llegar a motor, liquidacion, cierre, Previred o LRE, no debe entrar como prioridad alta.

Excepcion vigente: SEG-01 es prioridad alta aunque no calcule montos, porque define permisos y bloqueos antes de endurecer conceptos, movimientos, proceso mensual y fases productivas.

## 5. Regla de bloqueo del motor

MOTOR-00 debe estar cerrado antes de cualquier implementacion de motor. MOTOR-01 no puede absorber definiciones pendientes de contrato, conceptos o seguridad.

## 6. Regla visual

Los ajustes visuales se permiten solo si:

- La pantalla queda inutilizable sin ellos.
- Hay confusion funcional.
- Hay bloqueo visual para operar.
- El cambio es minimo.

El resto se guarda para UX-FINAL-01.
