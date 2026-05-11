# 00_EJECUTAR_CURSOR

## Fase

```txt
UX-QA-01-FIX / UX-COMERCIAL-02 candidate
Tabs, collapsables y densidad profesional
```

## Tipo

Refinamiento UX/UI profundo pero no funcional.

## IMPORTANTE

Antes de modificar, leer:

```txt
.cursor/skills/erp-codex-docs/SKILL.md
.cursor/rules/erp-codex-contract.mdc
docs/codex/AGENTS.md
docs/codex/README.md
docs/codex/ui-form-guidelines.md
docs/codex/ui-button-guidelines.md
docs/codex/ui-tables.md
docs/codex/estilos/README.md
docs/codex/peticiones-estilos.md
docs/codex/fases/ux-comercial/UX-COMERCIAL-01.md, si existe
```

Leer esta carpeta completa:

```txt
01_investigacion/01_REFERENCIAS_PATRONES.md
01_investigacion/02_PRINCIPIOS_APLICADOS.md
02_decisiones_patrones/01_DECISION_MATRIX.md
02_decisiones_patrones/02_TABS_VS_ACCORDION_VS_CARDS.md
03_sistema_navegacion/01_NAV_SECUNDARIA.md
03_sistema_navegacion/02_TABBAR_PRO.md
03_sistema_navegacion/03_COLLAPSABLES_ACCORDIONS.md
03_sistema_navegacion/04_DENSITY_RULES.md
04_componentes_ui/01_API_COMPONENTES.md
04_componentes_ui/02_CSS_LAYOUT_GUIDE.md
05_aplicacion_por_pantalla/*.md
06_tickets_cursor/*.md
07_qa_visual/*.md
```

Aplicar flujo:

```txt
Aclarar -> Identificar -> Read -> Implementar -> Autorevisar -> Responder
```

Si el alcance esta claro, ejecutar.

---

# Objetivo

Ordenar visual y funcionalmente la UI post V4 con patrones consistentes de navegacion secundaria:

```txt
tabs reales para vistas hermanas
accordions/collapsables para detalle progresivo
quick links para navegar a otras pantallas
cards metricas solo para datos resumidos
banners compactos para estado
action panel para siguiente accion
```

---

# Fuera de alcance

No tocar:

```txt
SQL
RPC
RLS
BD
formulas legales
motor de calculo
servicios de persistencia funcional
scripts Python
```

No activar:

```txt
PDF
firma
envio
Previred
LRE operativo
banco
contabilidad
portal trabajador
```

---

# Pantallas foco

```txt
1. Dashboard
2. Preparar nomina
3. Liquidaciones oficiales
4. Detalle liquidacion
5. Reportes
6. Movimientos del mes
7. Asignaciones recurrentes
```

No priorizar:

```txt
Ficha empleado
Listado empleados
Crear empleado
Parametros
Login
Licencias
Conceptos
```

salvo ajustes globales menores.

---

# Estrategia

## Paso 1 - Inventario de patrones actuales

Detectar por pantalla:

```txt
tabs
cards
quick links
accordions
empty states
action panels
tables
banners
```

## Paso 2 - Reemplazar patron incorrecto

Ejemplos:

```txt
card grande usada como acceso -> quick link compacto
seccion larga de detalle -> collapsable
tabs simuladas con cards -> tabbar real
empty state gigante -> guided empty compacto
salidas futuras cards grandes -> future list compacta
```

## Paso 3 - Crear componentes si reducen duplicacion

No crear libreria gigante.

## Paso 4 - Tests/build/docs

Ejecutar:

```bash
npx ng test --watch=false
npm run build
```

No usar:

```bash
npm test -- --watch=false
```

---

# Criterio de cierre

```txt
[ ] Tabs se usan solo para vistas hermanas.
[ ] Collapsables esconden detalle, no estado critico.
[ ] Quick links no parecen tabs.
[ ] Cards metricas no se usan como navegacion.
[ ] Dashboard cabe mas arriba y se entiende.
[ ] Preparar nomina tiene 6 pasos compactos.
[ ] Liquidaciones no desperdicia espacio cuando no hay datos.
[ ] Reportes separa disponible/futuro con menos cajas.
[ ] Movimientos/asignaciones tienen empty states compactos.
[ ] No hay promesas futuras activas.
[ ] Tests/build OK.
```
