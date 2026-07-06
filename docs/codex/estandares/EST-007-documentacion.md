# EST-007 — Estándar de Documentación

**ERP Remuneraciones Chile**

Versión: 1.0  
Estado: Obligatorio  
Última revisión: 2026-07-02

## Objetivo

Definir dónde vive la documentación del ERP, cómo nombrarla, cuándo actualizarla y cómo evitar duplicar contratos ya cubiertos por [`AGENTS.md`](../AGENTS.md) o por los estándares EST.

Complementa el mapa en [`orquestador/mapa-documentacion.md`](../orquestador/mapa-documentacion.md) y la jerarquía de [`README.md`](../README.md).

---

## Jerarquía `docs/codex/`

En conflicto, gana el documento de **mayor prioridad** según contexto:

| Prioridad | Documento | Rol |
|-----------|-----------|-----|
| 1 | Fase/módulo congelado + [`orquestador/estado-fases.md`](../orquestador/estado-fases.md) | qué está cerrado y qué sigue |
| 2 | [EST-008 — IA](./EST-008-ia.md) | alcance agentes, zonas prohibidas |
| 3 | [EST-001 … EST-007](./README.md) | reglas técnicas transversales |
| 4 | [`modulos/<módulo>/`](../modulos/) | contrato vivo del dominio |
| 5 | [`diseno/noia-ui-manual.md`](../diseno/noia-ui-manual.md) | UI visible (prevalece sobre EST de código) |
| 6 | Bitácoras (`peticiones-estilos.md`, auditorías) | historial, no normativa base |

### Árbol principal

```text
docs/codex/
├── README.md                 # índice padre
├── AGENTS.md                 # contrato agente (único; no duplicar)
├── contexto-rapido.md        # arranque sesión
├── estandares/               # EST-001 … EST-008 (esta colección)
├── orquestador/              # fases, mapa, contexto proyecto
├── arquitectura/             # frontend-interfaces, decisiones transversales
├── modulos/                  # contratos por dominio
├── diseno/                   # NOIA, nomenclatura UI
├── temas/                    # guías puntuales (evitar solapar AGENTS)
├── peticiones-estilos.md     # bitácora visual
└── ui-form-guidelines.md     # formularios (no reescribir en EST)
```

Inicio recomendado humano: [`contexto-rapido.md`](../contexto-rapido.md) → [`estandares/README.md`](./README.md) → módulo.

Inicio agente: [`contexto-rapido.md`](../contexto-rapido.md) → [EST-008](./EST-008-ia.md) → EST según alcance.

---

## Cuándo actualizar qué

| Evento | Actualizar |
|--------|------------|
| Nueva fase cerrada | [`orquestador/estado-fases.md`](../orquestador/estado-fases.md) |
| Cambia mapa global (módulos, stack) | [`orquestador/contexto-proyecto.md`](../orquestador/contexto-proyecto.md) |
| Cambio visual UI ERP | [`peticiones-estilos.md`](../peticiones-estilos.md) |
| Nuevo estándar o revisión EST | [`estandares/README.md`](./README.md) + EST afectado |
| Feature de módulo | `docs/codex/modulos/<módulo>/<flujo>.md` |
| Decisión arquitectura Angular | [`arquitectura/frontend-interfaces.md`](../arquitectura/frontend-interfaces.md) |
| Solo duda puntual ya documentada | **enlazar**, no copiar |

### Orquestador

- **`estado-fases.md`**: fuente de verdad de fases cerradas, siguiente fase y criterios de avance.
- **`contexto-proyecto.md`**: visión, stack, módulos, qué no construir aún.
- **`mapa-documentacion.md`**: índice de rutas; mantener enlaces válidos.

Al **cerrar fase** documentada: actualizar orquestador + commit según flujo del equipo ([EST-008](./EST-008-ia.md)).

### `peticiones-estilos.md`

Obligatorio registrar:

- cambios visuales (CSS local, layout, copy UI);
- pantalla/archivo tocado;
- patrón NOIA reutilizado o introducido.

No registrar refactors internos sin impacto visible salvo acuerdo explícito de omitir (borrador).

---

## Convención de nombres

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Carpetas | kebab-case | `nomina-mensual/` |
| Estándares | `EST-NNN-tema.md` | `EST-004-typescript.md` |
| Módulos | kebab-case descriptivo | `creacion-avanzada.md` |
| Orquestador | kebab-case | `estado-fases.md` |
| Diseño NOIA | prefijo `noia-` cuando aplique | `noia-ui-manual.md` |
| Fases en SQL | ID en encabezado | `NOM-ADMIN-OPS-F05` |

Evitar:

- espacios en nombres de archivo;
- `README` duplicados compitiendo con el índice padre;
- sufijos `.bak`, `.old`, ZIPs en `docs/codex` (política en contexto-rapido).

---

## Qué va en cada tipo de documento

### `AGENTS.md` (único contrato agente)

Contiene: prioridades UI, layout base, tokens, checklist agente, anti-patrones generales.

**No duplicar** en módulos ni en EST: **enlazar**.

Raíz del repo: [`AGENTS.md`](../../AGENTS.md) apunta a `docs/codex/AGENTS.md` — mantener un solo contenido normativo en `docs/codex/`.

### Estándares EST

Reglas técnicas transversales por capa ([EST-001](./EST-001-nomenclatura-tecnica.md) … [EST-008](./EST-008-ia.md)). Sin copy de pantalla ni historial de peticiones.

### Módulo (`modulos/<módulo>/`)

- alcance funcional y estados;
- archivos clave del repo;
- RPC/tablas **referenciadas**, no reescritura completa de EST-002/003;
- criterios de listo de la fase.

### Diseño NOIA

Decisiones visuales y matriz NOIA — no procedimientos SQL ni estructura de carpetas TS (eso es EST-004/005).

---

## Redacción

- Español claro, orientado a RRHH cuando el doc es visible para negocio.
- Títulos con verbo o sustantivo concreto («Creación transaccional de nómina»).
- Encabezados con versión/fecha/estado en documentos normativos nuevos.
- Enlaces relativos dentro de `docs/codex/` (`../modulos/...`).
- Listas checklist accionables al cierre de fase.

---

## Anti-patrones documentales

| Anti-patrón | Corrección |
|-------------|------------|
| Copiar `AGENTS.md` en cada módulo | enlace a `AGENTS.md` |
| Documentar SQL completo en módulo y en migración sin diferenciar rol | módulo = contrato; migración = fuente ejecutable |
| Bitácora en archivo normativo EST | mover a `peticiones-estilos.md` o auditoría |
| `docs/codex/archivo/` como fuente principal | usar módulo vivo + código ([`contexto-rapido.md`](../contexto-rapido.md)) |
| EST desactualizado sin bump de versión | actualizar cabecera + `estandares/README.md` |

---

## Relación con estándares técnicos

| Capa | EST |
|------|-----|
| Nomenclatura | [EST-001](./EST-001-nomenclatura-tecnica.md) |
| BD | [EST-002](./EST-002-base-de-datos.md) |
| SQL | [EST-003](./EST-003-sql-postgresql.md) |
| TypeScript | [EST-004](./EST-004-typescript.md) |
| Angular | [EST-005](./EST-005-angular.md) |
| Supabase | [EST-006](./EST-006-supabase.md) |
| Agentes | [EST-008](./EST-008-ia.md) |

---

## Checklist de cierre documental

- [ ] ¿El cambio altera alcance de fase? → actualizar `estado-fases.md`.
- [ ] ¿Hubo cambio visual? → entrada en `peticiones-estilos.md`.
- [ ] ¿Nuevo flujo o RPC? → documento en `modulos/<módulo>/`.
- [ ] ¿Nueva convención transversal? → EST correspondiente + README estandares.
- [ ] Enlaces relativos válidos; sin duplicar `AGENTS.md`.
- [ ] Nombre kebab-case; sin archivos basura en `docs/codex`.
- [ ] Una frase en PR/resumen indicando qué docs se contrastaron.
