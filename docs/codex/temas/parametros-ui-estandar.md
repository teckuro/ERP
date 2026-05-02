# Parametros - estandar UI del modulo

Fecha de revision Codex: 2026-05-02.

## Objetivo

Este documento fija el patron visual del modulo Parametros para que los cambios futuros no vuelvan a quedar como ajustes sueltos. Complementa `docs/codex/AGENTS.md`, `docs/codex/ui-form-guidelines.md`, `docs/codex/ui-tables.md`, `docs/codex/estilos/README.md` y `docs/codex/temas/parametros-vigencia-y-periodo.md`.

No redefine reglas de datos. La politica periodo/vigencia/catalogo sigue viviendo en `parametros-vigencia-y-periodo.md`.

## Inventario actual

1. Contenedor principal: `parametros-page` como pagina, `parametros-shell` como card externa, `parametros-frame` como marco flexible y `parametros-content` / `parametros-panel` como area de tabs.
2. Banda superior: `parametros-period-band` con zona izquierda (`parametros-period-left`) y estado mensual (`parametros-period-status`).
3. Acciones: viven en la toolbar superior (`parametros-toolbar`, `parametros-period-actions`), no dentro de las tabs.
4. Selector periodo: `parametros-period-controls` agrupa flechas, anio y mes.
5. Estado mensual: `Pendiente`, `Parcial`, `Completo`, `Editando`, `Error`; se muestra como titulo corto, detalle y pill.
6. Tabs principales: `parametros-tabs` con botones `parametros-tab-button`; el activo tambien lleva `parametros-tab-active`.
7. Subtabs: `parametros-inner-tabs` con botones `parametros-inner-tab-button`; el activo tambien lleva `parametros-inner-tab-active`.
8. Formularios editables: `parametros-tab-panel`, `parametros-section-card`, `parametros-form-grid`.
9. Configuracion corta: `parametros-config-card` para CCAF/Mutual u otros bloques compactos.
10. Grillas: `parametros-grid-shell` alrededor de `app-data-grid`; el scroll horizontal pertenece al DataGrid.
11. Filtros: labels funcionales (`Periodo`, `Vigencia inicio`, `Estado`, `Codigo`, `Nombre`) segun tipo de dato.
12. Empty states: especificos por tab y por tipo de dato.
13. Loading: `app-message-box` modal para carga de pantalla; loading interno del DataGrid para grillas.
14. Responsive: banda y tabs aceptan apilado/scroll interno; no debe aparecer scroll horizontal global.
15. Capturas: se guardan bajo `docs/codex/assets/parametros-tabs-*`.

## Estructura oficial

```text
parametros-page
  parametros-header
  parametros-shell
    parametros-frame
      parametros-viewhead
        parametros-toolbar / parametros-period-actions
        parametros-period-band
      parametros-panel
        parametros-tabs
        parametros-tab-body
          parametros-tab-panel
```

El marco padre es el que resuelve altura. No se debe rellenar la pagina inflando inputs, filtros, filas de tabla, padding o cards internas.

## Banda superior del periodo

La banda es el patron oficial para comunicar contexto y estado mensual.

Zona izquierda:

- Titulo: `Parametros del periodo Mayo 2026`.
- Controles anio/mes y flechas.
- Texto breve: `Sincronizado con el periodo activo.`

Zona derecha:

- Titulo: `Estado mensual: Pendiente`, `Parcial`, `Completo`, `Editando` o `Error`.
- Detalle corto. Para pendiente/parcial: `Faltan datos oficiales del periodo. Vigencias y catalogos siguen disponibles.`
- Referencia anterior solo si aplica: `Referencia disponible: Abril 2026`.

Reglas:

- No usar `Sin informacion cargada para YYYY-MM` como mensaje global.
- No dar a entender que todo el modulo esta vacio si solo faltan snapshots mensuales.
- No repetir chips de `Mensual`, `Vigencia` o `Catalogo` en la banda.
- Desktop: dos zonas. Ancho medio: el estado puede bajar bajo el selector.
- El bloque derecho no va pegado al borde; mantener ancho controlado.

## Estados mensuales

- `Pendiente`: periodo sin carga mensual suficiente.
- `Parcial`: periodo preparado con catalogos/vigencias/normativa, pero con datos mensuales oficiales pendientes.
- `Completo`: snapshots mensuales principales disponibles.
- `Editando`: formulario mensual en edicion.
- `Error`: carga o validacion fallida.

La UI puede mostrar catalogos y vigencias aunque el estado mensual sea `Pendiente` o `Parcial`.

## Tabs principales

Tabs actuales:

- Informacion de Valores.
- Informacion de Remuneraciones.
- CCAF y Mutual.
- Tramos Cargas Familiares.
- Impuesto unico.
- Salud.
- Prevision.
- Reforma de Pensiones.

Reglas:

- Usar `parametros-tabs` / `parametros-tab-button`.
- El activo debe quedar completamente visible; la pagina centra el tab activo al cambiar.
- Si no caben, el scroll es interno a la barra de tabs.
- No usar dropdown en desktop.
- No repetir chips de tipo de dato dentro de cada tab si no aporta decision operativa.

## Subtabs

Aplican en CCAF/Mutual, Impuesto unico, Salud y Reforma.

Reglas:

- Usar `parametros-inner-tabs` / `parametros-inner-tab-button`.
- Son navegacion secundaria, no chips de estado.
- Desktop: botones con scroll horizontal interno si hace falta.
- Ancho pequeno: usar el select existente del componente.
- No agregar parrafos tecnicos debajo de cada subtab.

## Copy permitido y no permitido

Permitido:

- Mensajes operativos cortos.
- Estado del periodo.
- Empty states especificos.
- Accion sugerida.
- `Pendiente de carga mensual` cuando faltan snapshots oficiales.
- `Vigencias y catalogos siguen disponibles` en la banda superior.

No permitido:

- Nombres de tablas o columnas internas en UI.
- Explicaciones largas de BD.
- `Sin informacion cargada` como mensaje global ambiguo.
- Chips permanentes repetidos de `Mensual`, `Vigencia`, `Catalogo global`.
- Textos como `tramos compact`, `columna periodo`, `tabla tramo_carga`.

## Empty states

Mensual:

- Titulo: `No hay tramos de asignacion familiar para Mayo 2026.`
- Detalle: `La carga oficial del periodo esta pendiente.`
- Accion opcional: `Ver referencia Abril 2026`, cambiando el selector al periodo anterior.

Vigencia:

- Titulo: `No hay registros vigentes para el periodo activo.`
- Detalle: `Prueba con otro periodo o revisa la carga normativa.`

Catalogo:

- Titulo: `Sin registros en catalogo.`
- Detalle: `Revisa la normativa base o maestros.`

La referencia anterior no se renderiza dentro del periodo activo y no se guarda como dato oficial.

## DataGrid

Reglas:

- La grilla vive dentro de `parametros-grid-shell`.
- Cada DataGrid debe tener titulo claro o contexto suficiente.
- Filtros:
  - `Periodo` para snapshots mensuales.
  - `Vigencia inicio` / `Vigencia fin` para rangos.
  - `Estado` cuando aporte.
- Loading dentro del DataGrid.
- Altura controlada con `gridHeight` razonable (`min(520px, 100%)` o `100%` cuando el contenedor ya esta acotado).
- Scroll horizontal solo interno al DataGrid.
- No mostrar IDs tecnicos si no aportan al usuario.

## Cards compactas

Aplican a CCAF/Mutual y bloques cortos equivalentes.

Reglas:

- Usar `parametros-config-card`.
- Max-width de contenido, no card gigante flotando.
- Titulo: `Configuracion vigente del periodo`.
- Texto breve: `Seleccion usada como referencia para el periodo activo.`
- Campos esperados: Caja de compensacion, Mutual de Seguridad, Porcentaje.
- No rellenar con texto innecesario.

## Responsive

Desktop:

- Banda superior en dos zonas.
- Tabs principales con scroll interno si no caben.
- DataGrid ocupa el ancho disponible del panel.
- Cards compactas donde corresponda.

Ancho medio:

- Banda puede apilar el estado debajo del selector.
- Tabs y subtabs mantienen scroll interno.
- Filtros pueden bajar de linea.

Mobile:

- No debe haber scroll horizontal global.
- Acciones principales siguen visibles.
- DataGrid maneja scroll interno o el patron responsive existente.

## Que no tocar desde este estandar

- Python.
- SQL.
- Supabase remoto.
- Calculo o generacion de liquidaciones.
- Payloads y mappers.
- Modulos Empleados, Haberes y descuentos, creacion basica/avanzada.
- Politica de filtros periodo/vigencia/catalogo ya aprobada.

## Checklist de cierre para Parametros

Antes de cerrar una mejora en Parametros:

1. La banda superior mantiene dos zonas y copy corto.
2. Header, acciones, periodo, tabs y contenido comparten eje visual.
3. No hay scroll horizontal global.
4. Tabs principales y subtabs no cortan el activo.
5. Empty states son especificos por tipo de dato.
6. No aparecen nombres de tablas, columnas ni detalles tecnicos en UI.
7. DataGrid tiene titulo, filtros correctos y scroll interno.
8. Cards cortas no se estiran artificialmente.
9. Pendiente/parcial no oculta catalogos ni vigencias.
10. Si hay cambio visual, registrar en `docs/codex/peticiones-estilos.md`.
11. Ejecutar `npm test` y capturas de Parametros si se toca UI.
