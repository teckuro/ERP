# Auditorías — Nómina mensual

Índice de auditorías de `/remuneraciones/proceso-mensual` (V1), `/remuneraciones/nomina-mensual-v2` (V2) y el rediseño **Administrador + Generador** (rutas `/remuneraciones/nominas` y `/remuneraciones/nominas/:nominaPeriodoId`; legacy `.../generador` redirige).

Documento rector del módulo: [`../arquitectura-administrador-generador.md`](../arquitectura-administrador-generador.md).

## Inventario

| Documento | Fecha | Alcance | Estado |
|-----------|------:|---------|--------|
| [`auditoria-admin-generador-nomina-2026-06.md`](./auditoria-admin-generador-nomina-2026-06.md) | 2026-07-27 | Administrador (`/remuneraciones/nominas`) + Generador (**5 pasos**: Parámetros, Dotación, Movimientos, Cálculo, Cierre con validación) | **Vigente.** P0 en ejecución (NOM-ADMIN-REVIEW); UI plantillas F03 retirada |
| [`auditoria-nomina-v2-2026-06.md`](./auditoria-nomina-v2-2026-06.md) | 2026-06-02 | V2 shell + pasos 1–3 productivos + overlays + copy RRHH | **Cerrada.** L0–L7 completados (2026-06-03). L5.3 declarada como deuda opcional |
| [`cierre-mensual-audit-post-reset-01.md`](./cierre-mensual-audit-post-reset-01.md) | 2026-05-18 | V1 `/remuneraciones/proceso-mensual` (post-reset visual) | **Superada (parcial).** La fase propuesta `NOM-CIERRE-MENSUAL-OPERATIVE-LAYOUT-01` no se ejecutó; el foco operativo se trasladó a Administrador + Generador |
| [`nom-mensual-cleanup-audit-01.md`](./nom-mensual-cleanup-audit-01.md) | 2026-05-19 | Limpieza de código y CSS huérfanos en `features/nomina-mensual/` | **Implementada.** Documento histórico |

## Orden de lectura sugerido

1. **[`auditoria-admin-generador-nomina-2026-06.md`](./auditoria-admin-generador-nomina-2026-06.md)** — es la única auditoría vigente y define el roadmap actual del módulo. Empezar siempre por aquí.
2. **[`../arquitectura-administrador-generador.md`](../arquitectura-administrador-generador.md)** — documento rector con la decisión vigente (Administrador + Generador, 6 pasos, ciclo consistente).
3. **[`auditoria-nomina-v2-2026-06.md`](./auditoria-nomina-v2-2026-06.md)** — referencia del rediseño NOIA ya cerrado de los pasos 1–3 del Generador.
4. Resto de auditorías solo como contexto histórico.

## Política de auditorías

- Una auditoría documenta un diagnóstico en un punto del tiempo. No se reescribe: se añade banner de estado y, si corresponde, una sección final con el contraste vs. la realidad implementada.
- Cuando un roadmap se ejecuta en lotes, los lotes se documentan dentro del mismo archivo (sección "Estado") o en una entrada nueva en [`../../peticiones-estilos.md`](../../peticiones-estilos.md) si tienen impacto visual.
- Cuando una auditoría queda superada por otra más reciente, la antigua mantiene su contenido pero se marca con banner `Superada (parcial)` o `Superada` y se enlaza la sucesora.
- Las decisiones del usuario que se apartan del roadmap propuesto se anotan en la sección final de la auditoría correspondiente (p. ej. ARC-FRM-03 / `app-page-frame` en la 2026-06-05).

## Estado de ejecución resumido (2026-06-05)

| Frente | Estado | Referencia |
|--------|--------|------------|
| F3 Fusion + migración ciclo consistente | Aplicado | `arquitectura-administrador-generador.md` §1 |
| Shell residual (tokens de ownership) | Aplicado | `peticiones-estilos.md` (entrada shell residual) |
| Filtro de mes con nómina fija | Aplicado | `peticiones-estilos.md` (entrada filtro mes generador) |
| Rediseño visual full-bleed Admin + Generador | Aplicado (decisión opuesta a ARC-FRM-03) | `auditoria-admin-generador-nomina-2026-06.md` §15 |
| Sub-lote P0 (ADM-MOD-05, CIE-ENUM-01, DOT-DET-04, MOV-ID-03, CAL-INV-05, QA-FOC-01) | Aplicado (2026-06-05) | `peticiones-estilos.md` (entrada sub-lote P0) · `auditoria-admin-generador-nomina-2026-06.md` §15 Tabla A |
| Lote estructural (AG-NAV-03, AG-CTA-01, AG-NAV-02) | Aplicado (2026-06-05) | `peticiones-estilos.md` (entrada lote estructural) · `auditoria-admin-generador-nomina-2026-06.md` §15 Tabla A |
| Pulido bandeja Administrador (filtros 3 op, columna Acciones, celdas, prioridad) | Aplicado (2026-06-05) | `peticiones-estilos.md` (entrada pulido bandeja) · `auditoria-admin-generador-nomina-2026-06.md` §15 Tabla A |
| Persistencia último paso visitado del Generador (server-side + sub-renglón "En curso") | Aplicado (2026-06-05) | `peticiones-estilos.md` (entrada "En curso: X") · `auditoria-admin-generador-nomina-2026-06.md` §15 Tabla A · `supabase/migrations/20260605130000_nomina_periodo_paso_visitado.sql` |
| Generador secuencial puro (bloqueo de avance + candado en stepper + confirmación al volver atrás + `maximo_paso_completado` monótono + sub-renglón "Avance: X") | Aplicado (2026-06-05) | `peticiones-estilos.md` (entrada "Generador secuencial puro") · `auditoria-admin-generador-nomina-2026-06.md` §15 Tabla A · `supabase/migrations/20260606120000_nomina_periodo_maximo_paso_completado.sql` |
| Dotación · Picker "Agregar trabajadores" + grilla `app-data-grid` | Aplicado (2026-06-05) | `peticiones-estilos.md` (entrada "Dotación · Agregar trabajadores") · `auditoria-admin-generador-nomina-2026-06.md` §15 Tabla A |
| P0 críticos restantes (6 ítems: PAR-CTA-03, DOT-SEL-02, MOV-CON-01, VAL-STA-02, VAL-APP-03, CIE-REO-04) | **Pendiente** | `auditoria-admin-generador-nomina-2026-06.md` §6 y §15 Tabla B |
| P1 escalabilidad | **Pendiente** | `auditoria-admin-generador-nomina-2026-06.md` §6 |
| P2 visual NOIA y mantenibilidad | **Pendiente** | `auditoria-admin-generador-nomina-2026-06.md` §6.9 |
| P3 retiro V1/V2 antiguo | **Pendiente** | `auditoria-admin-generador-nomina-2026-06.md` §10 |
| L5.3 sweep CSS V2 | Deuda opcional | `auditoria-nomina-v2-2026-06.md` §7 |
