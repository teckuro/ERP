# Implementación UI en el código

Este archivo solo indica **dónde** está implementada la UI. Las reglas (tokens, layout, formularios) están en [`../AGENTS.md`](../AGENTS.md) y [`../ui-form-guidelines.md`](../ui-form-guidelines.md).

## Dónde vive el CSS y los componentes

| Ubicación | Uso |
|-----------|-----|
| [`src/styles.css`](../../../src/styles.css) | Tokens globales ERP (`:root`), layout shell, utilidades compartidas, bloques `app-form-empleado`, etc. |
| [`src/styles/`](../../../src/styles/) | `theme.css`, Tailwind, fuentes |
| [`src/app/shared/components/ui/`](../../../src/app/shared/components/ui/) | Componentes UI reutilizables (`app-message-box`, cards, etc.): preferirlos antes que CSS ad hoc por pantalla |
| CSS por feature / componente | Solo lo específico del flujo; idealmente **encapsulado** para no romper otras vistas |

## Referencias de pantalla frecuentes

- Formulario empleados (alta / tabs): `src/app/features/empleados/components/form-empleado/`
- Parámetros (grilla 8 columnas, estilos en componente): `src/app/pages/parametros.page.ts`

## Responsive (recordatorio breve)

Misma norma que en `AGENTS.md`: lectura vertical; en mobile, breadcrumb → título → botonera → contenido en una columna, sin solapes.
