# Temas (`docs/codex/temas`)

Documentación **transversal**, **flujos por ruta** y **stubs** que complementan el índice padre [`../README.md`](../README.md) sin sustituir [`../AGENTS.md`](../AGENTS.md).

**Contratos por módulo y pantalla (fuente vigente):** [`../modulos/`](../modulos/empleados/README.md).  
**Contexto global y fases:** [`../orquestador/`](../orquestador/README.md) y [`../orquestador/mapa-documentacion.md`](../orquestador/mapa-documentacion.md).

## Convención de orden

1. Orquestador + mapa (arriba).
2. **[`organizacion-por-modulo-y-flujos.md`](./organizacion-por-modulo-y-flujos.md)** - política `modulos/` vs `temas/`.
3. **[`flujos/README.md`](./flujos/README.md)** - tabla de rutas ↔ recorrido.
4. **[`../modulos/<módulo>/README.md`](../modulos/empleados/README.md)** y el documento del flujo en esa carpeta.

Varios `.md` en la **raíz de `temas/`** son **solo redirección** (“Documento migrado…”) hacia `modulos/`; el texto normativo está allí.

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

## Transversal - UI y menú

| Documento | Contenido |
|-----------|------------|
| [`organizacion-por-modulo-y-flujos.md`](./organizacion-por-modulo-y-flujos.md) | Convención `modulos/` + `temas/` + `flujos/` |
| [`implementacion-ui.md`](./implementacion-ui.md) | Rutas de código (CSS, componentes compartidos) |
| [`crear-menu-base.md`](./crear-menu-base.md) | Menú lateral y rutas de navegación |
| [`base-angular-empleados.md`](./base-angular-empleados.md) | Arquitectura del feature empleados (sigue aquí; no duplicado en `modulos/`) |

---

## Módulo - Empleados (enlaces canónicos en `modulos/`)

| Página / flujo | Documento vigente |
|----------------|---------------------|
| Punto de entrada | [`../modulos/empleados/README.md`](../modulos/empleados/README.md) |
| Listado, CTAs y estados | [`../modulos/empleados/listado.md`](../modulos/empleados/listado.md), [`../modulos/empleados/contrato-general.md`](../modulos/empleados/contrato-general.md) |
| Ficha | [`../modulos/empleados/ficha-empleado.md`](../modulos/empleados/ficha-empleado.md) |
| Alta básica | [`../modulos/empleados/creacion-basica.md`](../modulos/empleados/creacion-basica.md) |
| Alta avanzada | [`../modulos/empleados/creacion-avanzada.md`](../modulos/empleados/creacion-avanzada.md) |
| Borrador / continuar alta / E2E | [`../modulos/empleados/borrador-continuar-alta.md`](../modulos/empleados/borrador-continuar-alta.md) |
| Validar remuneraciones | [`../modulos/empleados/validar-remuneraciones.md`](../modulos/empleados/validar-remuneraciones.md) |
| Tests | [`../modulos/empleados/tests-empleados.md`](../modulos/empleados/tests-empleados.md) |
| Arquitectura Angular | [`base-angular-empleados.md`](./base-angular-empleados.md) |

**Recorrido unificado:** [`flujos/empleados.md`](./flujos/empleados.md).

---

## Módulo - Parámetros y carga normativa

| Página / flujo | Documento vigente |
|----------------|---------------------|
| Punto de entrada | [`../modulos/parametros/README.md`](../modulos/parametros/README.md) |
| Pantalla `/parametros` (UI) | [`../modulos/parametros/ui-parametros.md`](../modulos/parametros/ui-parametros.md) |
| Período, vigencia, catálogo | [`../modulos/parametros/periodo-vigencia-catalogo.md`](../modulos/parametros/periodo-vigencia-catalogo.md) |
| Campos y listas | [`../modulos/parametros/campos-y-listas.md`](../modulos/parametros/campos-y-listas.md) |
| Reforma / gradualidad | [`../modulos/parametros/reforma-gradualidad.md`](../modulos/parametros/reforma-gradualidad.md) |
| Python, mensual, seeds | [`../modulos/parametros/python-carga-mensual.md`](../modulos/parametros/python-carga-mensual.md) |
| Sync v6.11 | [`../modulos/parametros/sync-parametros-v611.md`](../modulos/parametros/sync-parametros-v611.md) |
| Permisos / ejemplo SQL | [`../modulos/parametros/permisos-bd-ejemplo.sql`](../modulos/parametros/permisos-bd-ejemplo.sql) |
| Tests | [`../modulos/parametros/tests-parametros.md`](../modulos/parametros/tests-parametros.md) |

**Recorrido unificado:** [`flujos/parametros.md`](./flujos/parametros.md).

---

## Módulo - Remuneraciones (conceptos)

| Página / flujo | Contrato o guía |
|----------------|-----------------|
| `/remuneraciones/conceptos` | [`../modulos/conceptos-remuneracion/README.md`](../modulos/conceptos-remuneracion/README.md); flujo [`flujos/remuneraciones-conceptos.md`](./flujos/remuneraciones-conceptos.md) |

---

## Módulo - Haberes y descuentos

| Página / flujo | Contrato o guía |
|----------------|-----------------|
| `/remuneraciones/haberes-descuentos` (redirect `/haberes-descuentos`) | [`../modulos/haberes-descuentos/README.md`](../modulos/haberes-descuentos/README.md); flujo [`flujos/haberes-descuentos.md`](./flujos/haberes-descuentos.md) |

---

## Módulo - Nómina / proceso (visión)

| Página / flujo | Documento |
|----------------|------------|
| Proceso / nómina futura | [`../modulos/nomina-mensual/README.md`](../modulos/nomina-mensual/README.md), [`../modulos/nomina-mensual/vision-futura.md`](../modulos/nomina-mensual/vision-futura.md) |

---

## Módulo - Proceso, liquidaciones, licencias, reportes

| Página / flujo | Documento de flujo |
|----------------|-------------------|
| `/remuneraciones/proceso-mensual` (redirect `/proceso-remuneraciones`) | [`flujos/proceso-remuneraciones.md`](./flujos/proceso-remuneraciones.md) |
| `/remuneraciones/liquidaciones`, `/remuneraciones/liquidaciones/:id` (redirects `/liquidaciones`) | [`flujos/liquidaciones.md`](./flujos/liquidaciones.md) |
| `/licencias-medicas` | [`flujos/licencias-medicas.md`](./flujos/licencias-medicas.md) |
| `/reportes` | [`flujos/reportes.md`](./flujos/reportes.md) |

Contratos por dominio para estos módulos: **pendientes** (añadir bajo `modulos/` al cerrar fase de documentación).

---

## Metadatos

- **Organización:** [`organizacion-por-modulo-y-flujos.md`](./organizacion-por-modulo-y-flujos.md)
- **Flujos app:** [`flujos/README.md`](./flujos/README.md)
