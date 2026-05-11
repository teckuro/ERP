# Criterios de cierre de fases

## 1. Regla general

Una fase no se considera cerrada solo porque compila.

Una fase esta cerrada cuando cumple:

- Objetivo funcional.
- Alcance implementado.
- Limites respetados.
- Tests o validacion manual ejecutada.
- Documentacion actualizada.
- Riesgos conocidos documentados.
- Pendientes separados de la fase actual.

## 2. Estados permitidos

| Estado        | Significado                                                         |
| ------------- | ------------------------------------------------------------------- |
| Pendiente     | No iniciada                                                         |
| En definicion | Alcance documental o matriz base en preparacion; no cerrada todavia |
| En curso      | Se esta implementando                                               |
| Parcial       | Hay avance, pero faltan piezas relevantes                           |
| Cerrada base  | Cumple alcance base, con pendientes no bloqueantes                  |
| Cerrada       | Cumple alcance funcional y tecnico esperado                         |
| Congelada     | No tocar salvo decision explicita                                   |
| Bloqueada     | Depende de otra fase                                                |

## 3. Criterios por tipo de fase

### Documentacion

Debe tener:

- Objetivo.
- Alcance.
- No tocar.
- Dependencias.
- Riesgos.
- Criterios de aceptacion.
- Siguiente fase sugerida.

### Funcional

Debe tener:

- Flujo usable.
- Reglas de negocio claras.
- Manejo de errores.
- Estados definidos.
- Validacion manual o test.
- Documentacion actualizada.

### Base de datos

Debe tener:

- Script no destructivo si aplica.
- Relaciones claras.
- Constraints necesarios.
- RLS o nota si queda pendiente.
- Impacto en tipos TypeScript.
- Validacion SQL.

### Seguridad

Debe tener:

- Roles definidos.
- Acciones permitidas.
- Acciones bloqueadas.
- Acciones criticas identificadas.
- Acciones solo admin identificadas.
- Separacion entre permiso UI, service y BD/JWT/RLS.
- RLS esperado o decision explicita de dejarlo para subfase posterior.
- Comportamiento por perfil.
- Casos prohibidos.
- Modulos futuros bloqueados por fase cuando corresponda.

### Contrato de motor

Debe tener:

- Entradas declaradas.
- Salidas declaradas.
- Calculos incluidos en v1.
- Calculos excluidos de v1.
- Snapshot minimo.
- Relacion con proceso mensual.
- Bloqueos, advertencias y errores esperados.

### UI minima

Debe tener:

- Flujo entendible.
- Sin datos demo falsos.
- Estados visibles.
- Bloqueos claros.
- Mensajes breves.
- Sin pulido visual profundo.

### Testing

Debe tener:

- Tests unitarios si hay reglas puras.
- Tests de servicio si hay orquestacion.
- Smoke E2E si hay ruta critica.
- Validacion manual documentada.

## 4. Criterio de no cierre

Una fase no puede cerrarse si:

- No se sabe que desbloquea.
- No se sabe que no toca.
- Mezcla motor, liquidacion y exportacion.
- Usa datos demo como si fueran reales.
- No actualiza docs/codex.
- Rompe una fase anterior.
- Deja reglas de negocio ambiguas.

## 5. Cierres administrativos actuales

| Fase     | Estado                | Criterio aplicado                                                                                                                                                  |
| -------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ORDEN-01 | Cerrada               | Roadmap, dependencias, criterios, prioridades, tablero, mapa, README y diseno operativo quedan alineados. La matriz pasa a ser contrato base documental de SEG-01. |
| SEG-01   | En definicion         | Matriz base documental en preparacion; no cerrar hasta revisar acciones criticas, capas UI/service/BD/JWT/RLS y bloqueos por fase futura.                          |
| CONC-02  | Bloqueada por SEG-01  | No debe cerrar gobierno de conceptos sin restricciones por rol.                                                                                                    |
| MOTOR-00 | Bloqueada por CONC-02 | Debe documentar contrato antes de implementar motor.                                                                                                               |
