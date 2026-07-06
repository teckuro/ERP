# EST-008 — Estándar para Agentes de IA

**ERP Remuneraciones Chile**

Versión: 1.0  
Estado: Obligatorio  
Última revisión: 2026-07-02

## Objetivo

Contrato operativo para Cursor, Codex, ChatGPT y agentes similares: flujo de trabajo, orden de lectura, zonas prohibidas, pruebas por tipo de cambio y matriz NOIA antes de tocar UI.

Complementa [`AGENTS.md`](../AGENTS.md) (UI y checklist visual) y [`contexto-rapido.md`](../contexto-rapido.md) (arranque). Reglas técnicas por capa: [EST-001](./EST-001-nomenclatura-tecnica.md) … [EST-007](./EST-007-documentacion.md).

**En conflicto de alcance o zonas protegidas, EST-008 prevalece sobre EST-001 … EST-007.**

---

## Flujo obligatorio

```text
Aclarar → Read → Implementar → Autorevisar → Responder
```

### 1. Aclarar

Antes de codificar a gran escala, confirmar:

- pantalla, módulo o archivo concreto;
- solo UI vs lógica/BD;
- criterio de «listo»;
- si la fase está abierta en [`orquestador/estado-fases.md`](../orquestador/estado-fases.md).

Si falta alcance: **preguntar al usuario**. No asumir módulos colindantes.

### 2. Read (orden de lectura)

| Orden | Documento | Cuándo |
|-------|-----------|--------|
| 1 | [`contexto-rapido.md`](../contexto-rapido.md) | siempre |
| 2 | **EST-008** (este archivo) | siempre |
| 3 | [`estandares/README.md`](./README.md) + EST por capa tocada | según alcance |
| 4 | [`orquestador/estado-fases.md`](../orquestador/estado-fases.md) | siempre |
| 5 | [`AGENTS.md`](../AGENTS.md) | UI o copy |
| 6 | [`modulos/<módulo>/`](../modulos/) o fase en `temas/` | alcance funcional |
| 7 | NOIA + [`ui-form-guidelines.md`](../ui-form-guidelines.md) | cambio visual |
| 8 | [`arquitectura/frontend-interfaces.md`](../arquitectura/frontend-interfaces.md) | rutas/pages/containers nuevos |

Leer archivos **reales** del repo citados en el contrato del módulo; no confiar en memoria externa.

### 3. Implementar

- Diff mínimo correcto; reutilizar patrones del módulo más cercano.
- Respetar convenciones [EST-001](./EST-001-nomenclatura-tecnica.md) … [EST-006](./EST-006-supabase.md).
- Fases «solo UI»: CSS/copy/layout local; no cambiar `formControlName`, guardado, servicios ni rutas globales.

### 4. Autorevisar

- Checklist de [`AGENTS.md`](../AGENTS.md) si hubo UI.
- [`noia-ui-review-checklist.md`](../diseno/noia-ui-review-checklist.md) antes de cerrar UI.
- Checklists EST de la capa modificada.
- Ejecutar tests que correspondan (ver abajo).

### 5. Responder

Incluir:

- archivos tocados y **no** tocados;
- validaciones ejecutadas (o por qué no);
- una frase sobre qué se contrastó con `docs/codex`.

---

## NUNCA tocar (sin fase explícita)

### Configuración y estilos globales

- `angular.json`
- `postcss.config.*`
- `tailwind.config.*`
- `src/styles.css`
- `src/styles/index.css`
- `src/styles/tailwind.css`
- `src/styles/fonts.css`
- `src/styles/theme.css`

### Backend y negocio crítico

- SQL / RPC / RLS / migraciones productivas no incluidas en alcance
- **Relajar RLS** o grants a `anon` «para probar»
- Motor de cálculo de remuneraciones
- Nómina productiva / liquidaciones productivas
- Servicios de negocio, repositorios, mappers, payloads fuera de alcance
- Persistencia crítica y contratos de datos congelados
- Rutas/guards globales

Si el usuario pide «arreglar rápido» relajando seguridad: **rechazar** y proponer alternativa en entorno dev documentada.

Referencia: [`contexto-rapido.md` §3](../contexto-rapido.md), reglas `.cursor/rules/erp-protected-files.mdc`.

---

## Matriz NOIA (obligatoria antes de UI)

Completar mentalmente o declarar en el razonamiento:

| Pregunta | Respuesta requerida |
|----------|---------------------|
| Tipo de pantalla | formulario / tabla / bitácora / consola / flujo mixto |
| Usuario principal | RRHH / admin nómina / otro |
| Fuente de verdad | servicio, RPC, estado local |
| Qué puede editar | campos y acciones permitidas |
| Qué no puede editar | estados cerrados, campos calculados |
| Estado principal | pendiente / listo / bloqueado / no aplica |
| Acción recomendada | una primaria por zona |
| Riesgo principal | error de cierre, pérdida de datos, etc. |
| Confirmación requerida | sí/no; modal MessageBox |
| Patrón visual | franja operativa, tabla, panel — **no card por defecto** |

Si no se puede completar: **no implementar UI**; leer docs o pedir aclaración.

Fuentes: [`noia-ui-manual.md`](../diseno/noia-ui-manual.md), [`noia-ui-guardrails.md`](../diseno/noia-ui-guardrails.md), [`noia-antipatrones-ia.md`](../diseno/noia-antipatrones-ia.md).

---

## Tests por tipo de cambio

| Tipo de cambio | Acción mínima |
|----------------|---------------|
| `rules` / `mapper` | unit spec del archivo |
| `service` / `repository` | spec existente o nuevo en el feature |
| Componente contenedor crítico | `ng test` del spec |
| Migración SQL | smoke `bd/scripts/` + no merge sin revisión humana en prod |
| Solo CSS local | lint visual NOIA; tests si el spec cubre bindings |
| Refactor amplio | suite del módulo (`npx ng test --watch=false`) |

No omitir tests por conveniencia salvo acuerdo explícito con el usuario.

Playwright: solo si el módulo define specs E2E.

---

## Comportamiento documental

- Cambio visual → [`peticiones-estilos.md`](../peticiones-estilos.md) ([EST-007](./EST-007-documentacion.md)).
- Cierre de fase → [`estado-fases.md`](../orquestador/estado-fases.md).
- **No duplicar** contenido de [`AGENTS.md`](../AGENTS.md) en respuestas largas; aplicar y citar.
- **No crear commits** salvo petición explícita del usuario.

---

## Señales de stop

Detenerse y escalar al usuario si:

- el pedido contradice fase congelada;
- requiere tocar motor/RLS/productivo sin fase;
- falta diseño para copy o estados visibles;
- el budget CSS falla → fase propia, no subir límites en `angular.json`;
- hay conflicto entre doc y código → **gana código + doc vivo del módulo**; reportar inconsistencia.

---

## Referencias rápidas por capa

| Capa | EST |
|------|-----|
| Nombres | [EST-001](./EST-001-nomenclatura-tecnica.md) |
| Tablas / RLS | [EST-002](./EST-002-base-de-datos.md) |
| SQL / RPC | [EST-003](./EST-003-sql-postgresql.md) |
| TypeScript | [EST-004](./EST-004-typescript.md) |
| Angular | [EST-005](./EST-005-angular.md) |
| Supabase | [EST-006](./EST-006-supabase.md) |
| Documentación | [EST-007](./EST-007-documentacion.md) |

---

## Checklist agente (cierre)

- [ ] Alcance confirmado o preguntado.
- [ ] Documentos obligatorios leídos según orden EST-008.
- [ ] Sin archivos protegidos tocados sin autorización.
- [ ] Sin relajar RLS ni exponer negocio a `anon`.
- [ ] Matriz NOIA completada si hubo UI.
- [ ] Patrón existente reutilizado (empleados / nomina-mensual-v2 / parámetros).
- [ ] Tests ejecutados según tipo de cambio.
- [ ] `peticiones-estilos.md` / módulo / orquestador actualizados si correspondía.
- [ ] Respuesta lista: archivos tocados, no tocados, validaciones, contraste con docs.
