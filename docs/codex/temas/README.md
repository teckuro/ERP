# Temas (`docs/codex/temas`)

Documentación **por módulo y contrato** que complementa el índice padre [`../README.md`](../README.md) sin repetir el contrato de [`../AGENTS.md`](../AGENTS.md).

El **contexto global** y el **tablero de fases** están en [`../orquestador/`](../orquestador/README.md).

## Convención de orden

1. Leer **[`organizacion-por-modulo-y-flujos.md`](./organizacion-por-modulo-y-flujos.md)** — cómo agrupamos archivos y la carpeta `flujos/`.
2. Entrar al **índice de flujos** **[`flujos/README.md`](./flujos/README.md)** — tabla de rutas ↔ documento de recorrido.
3. Abrir el **contrato** (`.md` en esta carpeta) según el tema.

Los archivos de contrato **permanecen en la raíz de `temas/`** (nombres con prefijo `empleados-`, `parametros-`, etc.) para no invalidar enlaces; el orden se expresa aquí y en `flujos/`.

---

## Índice de flujos por módulo (`flujos/`)

| Módulo | Índice de recorrido |
|--------|---------------------|
| Dashboard | [`flujos/dashboard.md`](./flujos/dashboard.md) |
| Empleados | [`flujos/empleados.md`](./flujos/empleados.md) |
| Parámetros | [`flujos/parametros.md`](./flujos/parametros.md) |
| Remuneraciones / conceptos | [`flujos/remuneraciones-conceptos.md`](./flujos/remuneraciones-conceptos.md) |
| Haberes y descuentos | [`flujos/haberes-descuentos.md`](./flujos/haberes-descuentos.md) |
| Proceso remuneraciones | [`flujos/proceso-remuneraciones.md`](./flujos/proceso-remuneraciones.md) |
| Liquidaciones | [`flujos/liquidaciones.md`](./flujos/liquidaciones.md) |
| Licencias médicas | [`flujos/licencias-medicas.md`](./flujos/licencias-medicas.md) |
| Reportes | [`flujos/reportes.md`](./flujos/reportes.md) |

**Lista maestra:** [`flujos/README.md`](./flujos/README.md).

---

## Transversal — UI y menú

| Documento | Contenido |
|-----------|------------|
| [`organizacion-por-modulo-y-flujos.md`](./organizacion-por-modulo-y-flujos.md) | Convención módulo / flujo / contrato |
| [`implementacion-ui.md`](./implementacion-ui.md) | Rutas de código (CSS, componentes compartidos) |
| [`crear-menu-base.md`](./crear-menu-base.md) | Menú lateral y rutas de navegación |

---

## Módulo — Empleados

### Flujo y contrato por página

| Página / flujo | Contrato o guía |
|----------------|-----------------|
| Listado, CTAs y estados | [`empleados-estados-completitud-aptitud.md`](./empleados-estados-completitud-aptitud.md) |
| Ficha `/empleados/:id` (tabs, guardado, validar remuneraciones) | [`flujo-edicion-ficha-empleado.md`](./flujo-edicion-ficha-empleado.md), [`ficha-empleado-funcionamiento-y-tests-visuales.md`](./ficha-empleado-funcionamiento-y-tests-visuales.md) |
| Alta básica | [`modo-basico-empleado.md`](./modo-basico-empleado.md) |
| Alta avanzada (wizard, campos) | [`creacion-avanzada-formulario-campos.md`](./creacion-avanzada-formulario-campos.md) |
| Borrador, continuar alta, E2E | [`creacion-avanzada-borrador-tests.md`](./creacion-avanzada-borrador-tests.md) |
| Arquitectura Angular | [`base-angular-empleados.md`](./base-angular-empleados.md) |

**Recorrido unificado:** [`flujos/empleados.md`](./flujos/empleados.md).

---

## Módulo — Parámetros y carga normativa

| Página / flujo | Contrato o guía |
|----------------|-----------------|
| Pantalla `/parametros` (UI) | [`parametros-ui-estandar.md`](./parametros-ui-estandar.md) |
| Período, vigencia, catálogo | [`parametros-vigencia-y-periodo.md`](./parametros-vigencia-y-periodo.md) |
| Campos y listas | [`parametros-generales-campos-y-listas.md`](./parametros-generales-campos-y-listas.md) |
| Reforma / gradualidad | [`reforma-pensiones-gradualidad.md`](./reforma-pensiones-gradualidad.md) |
| Python, mensual, seeds | [`python-parametros-carga-mensual.md`](./python-parametros-carga-mensual.md) |
| Sync v6.11 | [`sync-parametros-v611.md`](./sync-parametros-v611.md) |
| Permisos / ejemplo SQL | [`parametros-permisos-bd-ejemplo.sql`](./parametros-permisos-bd-ejemplo.sql) |

**Recorrido unificado:** [`flujos/parametros.md`](./flujos/parametros.md).

---

## Módulo — Remuneraciones (conceptos)

| Página / flujo | Contrato o guía |
|----------------|-----------------|
| `/remuneraciones/conceptos` | Contrato **pendiente**; ver [`flujos/remuneraciones-conceptos.md`](./flujos/remuneraciones-conceptos.md) |

---

## Módulo — Haberes y descuentos

| Página / flujo | Contrato o guía |
|----------------|-----------------|
| `/haberes-descuentos` | Contrato **pendiente**; ver [`flujos/haberes-descuentos.md`](./flujos/haberes-descuentos.md) |

---

## Módulo — Proceso, liquidaciones, licencias, reportes

| Página / flujo | Documento de flujo |
|----------------|-------------------|
| `/proceso-remuneraciones` | [`flujos/proceso-remuneraciones.md`](./flujos/proceso-remuneraciones.md) |
| `/liquidaciones`, `/liquidaciones/:id` | [`flujos/liquidaciones.md`](./flujos/liquidaciones.md) |
| `/licencias-medicas` | [`flujos/licencias-medicas.md`](./flujos/licencias-medicas.md) |
| `/reportes` | [`flujos/reportes.md`](./flujos/reportes.md) |

Contratos por dominio para estos módulos: **pendientes** (crear `temas/<modulo>-*.md` al cerrar fase de documentación).

---

## Metadatos

- **Organización:** [`organizacion-por-modulo-y-flujos.md`](./organizacion-por-modulo-y-flujos.md)
- **Flujos app:** [`flujos/README.md`](./flujos/README.md)
