# Contexto rápido ERP Remuneraciones Chile

Fecha base: 2026-05-15

Este archivo es un resumen operativo corto para iniciar tareas en Cursor/Codex sin cargar todo el historial del proyecto. No reemplaza la documentación completa: apunta a los documentos que mandan.

## 1. Fuente de verdad

Antes de modificar, leer según alcance:

1. `docs/codex/AGENTS.md`
2. `docs/codex/README.md`
3. `docs/codex/orquestador/estado-fases.md`
4. `docs/codex/peticiones-estilos.md`
5. Documento del módulo o fase bajo `docs/codex/modulos/` o `docs/codex/diseno/`
6. Contratos del módulo y archivos reales del ZIP actual

La memoria o resúmenes externos solo sirven como apoyo. Si contradicen el ZIP o `docs/codex`, gana el proyecto.

## 2. Stack y alcance técnico

- Frontend: Angular standalone.
- Backend: Supabase/PostgreSQL.
- Dominio: remuneraciones Chile.
- Diseño: UI clara para RRHH, trazable, guiada por estado y acción.
- Arquitectura preferida: por features, con componentes reutilizables y contenedores por módulo.

## 3. Archivos y zonas protegidas

No tocar salvo fase explícita:

- `angular.json`
- `postcss.config.*`
- `tailwind.config.*`
- `src/styles.css`
- `src/styles/index.css`
- `src/styles/tailwind.css`
- `src/styles/fonts.css`
- `src/styles/theme.css`
- SQL/RPC/RLS/BD
- motor de cálculo
- nómina productiva
- liquidaciones productivas
- servicios de negocio, mappers, payloads o persistencia crítica

Si una fase es visual, no debe cambiar contratos de datos, `formControlName`, guardado, servicios ni rutas sin autorización explícita.

## 4. Identidad visual actual

### NOIA

`NOIA = No parecer IA`.

La interfaz debe evitar apariencia genérica, decorativa o tipo plantilla. Cada pantalla debe responder:

- qué está pasando;
- qué falta;
- qué está listo;
- qué no aplica;
- qué acción sigue;
- qué queda trazado.

### Bitácora Operativa

El ERP se entiende como una bitácora operativa del periodo: registrar, revisar, preparar y cerrar remuneraciones con trazabilidad.

### Bitácora Laboral

En Creación avanzada de empleados, el alta se comunica como `Bitácora laboral`: ficha en construcción, registros agrupados, decisiones visibles, pendientes claros y cierre como acta.

## 5. Reglas visuales rápidas

Evitar:

- `border-left` fuerte como marcador visual;
- gradientes decorativos;
- sombras fuertes;
- cards repetidas sin jerarquía;
- botones azules para todo;
- badges excesivos;
- texto técnico visible para RRHH;
- pantallas largas sin acción principal clara.

Preferir:

- bordes completos y neutros;
- fondos suaves funcionales para info/alerta/error/éxito;
- densidad compacta;
- una acción principal por zona;
- lenguaje administrativo claro;
- empty states con causa y acción;
- tablas con filtros sobrios y selección sin barras laterales fuertes.

## Decision de maquetacion NOIA

Antes de tocar UI, Codex debe completar la matriz NOIA: tipo de pantalla, usuario, fuente de verdad, editable/no editable, estado, accion, riesgo, confirmacion y patron visual.

Regla anti-card: no resolver todo con cards. Elegir el patron correcto: franja operativa, registro de bitacora, panel dividido, linea de estado, lista de revision, bloque editorial, tabla contextual, MessageBox, disclosure o card justificada.

Orden: ordenar, reducir, jerarquizar, reusar patrones existentes y crear solo si hace falta.
## 6. Fases recientes relevantes

### `ERP-NOIA-BITACORA-OPERATIVA-00`

Fase documental. Define `NOIA / Bitácora Operativa` en `docs/codex/diseno/bitacora-operativa-noia.md`.

### `ERP-SHELL-BITACORA-OPERATIVA-01`

Aplica identidad al shell y componentes base: header, sidebar, cards, botones, badges, breadcrumbs, DataGrid, SearchSelect y MessageBox.

### `EMP-ADV-BITACORA-LABORAL-UX-01`

Creación avanzada adopta `Bitácora laboral` como identidad local del flujo.

### `EMP-ADV-CSS-BUDGET-REDUCE-01`

Reduce el error de budget CSS de `app-form-empleado` sin tocar budgets, estilos globales ni cambiar visualmente el flujo.

### `PARAM-NOIA-CIERRE-UX-01`

Parametros funciona como cierre normativo del periodo: muestra estado operativo, secciones listas, faltantes, impacto en nomina y siguiente accion. La guardia `PARAM-MENSUAL-OVERWRITE-GUARD-01` vive en `scripts/run-parametros-mensuales.ps1`: no aplica SQL mensual si detecta datos existentes salvo `-Force`.

## 7. Decisiones de producto vigentes

- `Movimientos del mes` y `Asignaciones recurrentes` deben evolucionar a una experiencia unificada visible: `Movimientos de remuneración`.
- La diferencia real es temporal:
  - `Del periodo`: impacto puntual del periodo.
  - `Recurrentes`: impacto vigente o repetible.
- `Conceptos de remuneración` se mantiene separado como catálogo maestro.
- `tipo_trabajador` es categoría base derivada:
  - `CONTRATO` -> `DEPENDIENTE`
  - `HONORARIOS` -> `INDEPENDIENTE`
- Condiciones especiales se manejan como condiciones separadas, no como variantes de `tipo_trabajador`.

## 8. Validaciones recomendadas por tipo de fase

### Documentación / reglas / scripts auxiliares

- Verificar existencia de archivos nuevos.
- Verificar enlaces o referencias agregadas.
- No requiere build Angular si no se tocó `src/`.

### UI Angular / componentes

- `npm ci --ignore-scripts --no-audit --no-fund` si faltan dependencias.
- `npx tsc -p tsconfig.app.json --noEmit`
- `npx tsc -p tsconfig.spec.json --noEmit`
- `npx ng build --configuration development`
- Tests unitarios específicos si existen.

### Productivo

- `npm run build`
- Si falla, distinguir entre error nuevo y deuda preexistente. No subir budgets sin fase explícita.

## 9. Cómo pedir a Codex con menos tokens

Usar un MD de fase con esta estructura mínima:

```md
# FASE-ID - Nombre

Objetivo:
...

Leer antes:
- docs/codex/contexto-rapido.md
- docs/codex/AGENTS.md
- docs/codex/orquestador/estado-fases.md
- docs/codex/peticiones-estilos.md
- docs/codex/<módulo-o-fase>.md

Tocar solo:
- ...

No tocar:
- ...

Validar:
- ...

Respuesta esperada:
- resumen de cambios
- archivos tocados
- validaciones
- restricciones respetadas
```

## 10. Uso de context pack

Para tareas acotadas, generar un paquete pequeño con:

```powershell
./scripts/build-context-pack.ps1 -IncludeEmpleadoAdvanced
```

O pasar archivos puntuales:

```powershell
./scripts/build-context-pack.ps1 -ExtraFiles "src/app/features/empleados/pages/form-empleado/form-empleado.css","docs/codex/modulos/empleados/creacion-avanzada.md"
```

El context pack no reemplaza el ZIP completo para ejecución final, pero reduce tokens en diagnóstico, revisión y planificación.

### `PARAM-CLIENT-CONFIG-SEPARATION-AUDIT-01`

Parametros mantiene separacion estricta: `parametros_generales` es snapshot oficial mensual, `parametros_generales_cliente` es configuracion cliente protegida y `periodo_remuneracion` es estado operativo. Python mensual no debe escribir la tabla cliente; `-Force` solo autoriza actualizar el snapshot oficial.
### `PARAM-RECONCILIACION-MSGBOX-FIX-01`

La reconciliacion oficial/cliente de Parametros registra `Revisar despues` como decision explicita (`estadoReconciliacionOficial = revisar_despues`) y no vuelve a abrir el MsgBox en bucle para esa misma decision. No existe aun fingerprint de nueva version oficial; queda como fase futura si se requiere detectar nuevas cargas con precision.

### `PARAM-BITACORA-LAYOUT-ALIGN-01`

Parametros ordena su pantalla como bitacora normativa del periodo: cabecera con estado/accion, tabs compactos, contexto de seccion activa y filtros secundarios. Es UX local; no toca oficial/cliente, reconciliacion, Python, wrapper, SQL ni servicios.

### `NOM-MOVIMIENTOS-SIMPLE-00`

Fase documental. Define `Movimientos de remuneracion` como experiencia futura que absorbe `Movimientos del mes` y `Asignaciones recurrentes` desde tres duraciones visibles: `Solo este mes`, `Recurrente` y `En cuotas`. Documento rector: `docs/codex/modulos/remuneraciones/movimientos-remuneracion-simple.md`. No habilita cambios de Angular, SQL, rutas, motor ni servicios productivos.

### `NOM-MOVIMIENTOS-SIMPLE-01`

Primera capa visible. El menu principal muestra `Movimientos`, la pantalla mensual se titula `Movimientos de remuneracion` y `Asignaciones recurrentes` queda como vista `Recurrentes`. `En cuotas` se comunica como duracion para prestamos/anticipos/descuentos pactados, sin calculo ni tablas nuevas. Documento: `docs/codex/diseno/nom-movimientos-simple-01.md`.

### `NOM-MOVIMIENTOS-SIMPLE-01-FORM-POLISH`

Pulido local del modal `Registrar movimiento`. Organiza el formulario en `Movimiento`, `Duracion del movimiento`, `Detalle administrativo opcional` y `Resumen`. Agrega duraciones visibles `Solo este mes`, `Recurrente` y `En cuotas`, con campos UI de cuotas y validacion local. No cambia SQL, motor, servicios, payloads ni persistencia critica.
