# EST-004 — Estándar TypeScript

**ERP Remuneraciones Chile**

Versión: 1.0  
Estado: Obligatorio  
Última revisión: 2026-07-02

## Objetivo

Definir capas, tipos, mappers, repositorios, servicios y pruebas TypeScript del frontend ERP, con conversión única desde PostgreSQL/Supabase hacia modelos de dominio en camelCase español.

Nomenclatura de símbolos: [EST-001](./EST-001-nomenclatura-tecnica.md). Estructura Angular: [EST-005](./EST-005-angular.md). Contratos BD/RPC: [EST-002](./EST-002-base-de-datos.md), [EST-003](./EST-003-sql-postgresql.md).

---

## Capas obligatorias por feature

```text
src/app/features/<feature>/
├── models/           # interfaces/types de dominio (sin Supabase)
├── mappers/          # fila BD/RPC ↔ dominio
├── data-access/      # repositories (I/O Supabase)
├── services/         # orquestación, estado de sesión, casos de uso
├── rules/            # lógica pura sin I/O
├── presenters/       # opcional: VM para componentes complejos
└── containers/       # ver EST-005
```

### Responsabilidades

| Capa | Responsabilidad | No debe |
|------|-----------------|---------|
| **models** | tipos de dominio, enums UI, DTO de pantalla | importar `@supabase/*` ni `Tables` |
| **mappers** | `rowTo*`, `*ToInsert`, normalización | llamar Supabase |
| **repository** | `.rpc()`, `.from()`, errores de red/BD | reglas de negocio complejas |
| **service** | compone repos, rules, expone API al contenedor | manipular DOM ni CSS |
| **rules** | funciones puras testeables | async / HTTP |
| **components** | template, signals locales, delegar al contenedor | SQL strings, `Tables` directo |

Referencia viva: `src/app/features/nomina-mensual/`, `src/app/features/empleados/`, `src/app/features/nomina-mensual-v2/`.

---

## camelCase español en dominio

Propiedades de negocio en **camelCase español**:

| BD (`snake_case`) | TS dominio |
|-------------------|------------|
| `id_empresa` | `idEmpresa` |
| `fecha_inicio` | `fechaInicio` |
| `id_nomina_periodo` | `idNominaPeriodo` o `nominaPeriodoId` según módulo |
| `created_at` | `createdAt` |

Guía extendida: [`diseno/nomenclatura-es-camelcase-01.md`](../diseno/nomenclatura-es-camelcase-01.md).

### Excepciones congeladas (no renombrar)

- Strings de RPC/tabla/columna hacia Supabase (`'listar_dotacion_nomina'`).
- Contratos del motor de cálculo: `payload`, `snapshot`, `issues`.
- Props de componentes compartidos (`DataGridColumn`, `label`, `value`).

---

## `database.types.ts`

Ubicación: `src/app/core/models/database.types.ts`

### Reglas

1. Representa el esquema Supabase **generado o sincronizado**; no editar a mano salvo fase de regeneración.
2. Solo **repositories y mappers** importan `Database`, `Tables`, `TablesInsert`, `TablesUpdate`, `Json`.
3. **Prohibido** importar `Tables` en componentes, templates, rules o services de alto nivel.
4. Tras migración BD ([EST-002](./EST-002-base-de-datos.md)), regenerar o actualizar tipos antes de merge.

### Patrón mapper

```typescript
import type { Database } from '../../../core/models/database.types';
import type { NominaPeriodo } from '../models/nomina-periodo.models';

type NominaPeriodoRow = Database['public']['Tables']['nomina_periodo']['Row'];

export function rowToNominaPeriodo(row: NominaPeriodoRow): NominaPeriodo {
  return {
    id: row.id,
    idEmpresa: row.id_empresa,
    periodo: row.periodo,
    estado: row.estado,
    createdAt: row.created_at,
  };
}
```

Una sola conversión por frontera: repository recibe/fila cruda → mapper → dominio.

---

## Repositories (`data-access/`)

- Un repository por agregado o tabla principal (`nomina-periodo.repository.ts`).
- Métodos nombrados como casos de uso (`listarDotacion`, `confirmarCreacion`), no como SQL (`selectJoin`).
- Encapsular `.rpc('listar_dotacion_nomina', { p_page: page })`.
- Mapear filas antes de retornar al service.
- Propagar errores tipados (ver abajo); no tragar excepciones.

---

## Services

- Inyectables `@Injectable({ providedIn: 'root' })` o scoped al feature según módulo.
- Orquestan repositories + rules; mantienen señales de sesión cuando aplique (`nomina-mensual-v2-sesion.service.ts`).
- No duplicar lógica que ya vive en rules.
- Retornan tipos de dominio o `Result`/`Observable` documentado en el contrato del módulo.

---

## Rules (`*.rules.ts`)

- Funciones puras: mismos inputs → mismos outputs.
- Sin dependencias Angular salvo tipos.
- Spec obligatorio para reglas de negocio no trivial (`*.rules.spec.ts`).
- Ejemplos: `nomina-dotacion.rules.ts`, `empleado-alta-validaciones.rules.ts`.

---

## Clases de error

Centralizar errores de dominio en `src/app/core/errors/` o por feature cuando el módulo lo define.

### Patrón

```typescript
export class NominaPeriodoCerradoError extends Error {
  readonly code = 'NOMINA_PERIODO_CERRADO';

  constructor(readonly nominaPeriodoId: string) {
    super('No se puede modificar un período cerrado.');
    this.name = 'NominaPeriodoCerradoError';
  }
}
```

Reglas:

- Mensaje `message` en español, apto para RRHH (puede mostrarse en UI).
- Mapear códigos PostgreSQL (`P0001`, `40001`) en repository/service — no en template.
- No exponer `error.details` crudos de Supabase al usuario.

---

## Presenters (opcional)

Para grillas o pasos complejos (`nomina-dotacion-grid.presenter.ts`):

- Transforman dominio → columnas/filtros de `app-data-grid`.
- Sin I/O; testeables con fixtures.
- Ver [EST-005](./EST-005-angular.md) para `serverSide`.

---

## Tests

| Cambio | Prueba mínima |
|--------|---------------|
| rules | unit spec en `*.rules.spec.ts` |
| mapper | spec con fila fixture |
| repository | spec con Supabase mock / spy |
| service | spec de orquestación |
| componente crítico | spec + pruebas de interacción si el módulo las usa |

Ejecutar según alcance:

```bash
npx ng test --watch=false --include=**/nomina-periodo.service.spec.ts
```

Política agente: [EST-008](./EST-008-ia.md).

---

## Anti-patrones

- Importar `Tables` en `.component.ts`.
- Mapear snake_case en templates o pipes ad hoc.
- Servicios de 800+ líneas mezclando UI, SQL y reglas (extraer rules/repository).
- `any` en frontera Supabase sin justificación documentada.
- Duplicar tipos entre models y `database.types` en lugar de mapper.
- Mensajes de error en inglés o con nombres de RPC visibles.

---

## Relación con otras capas

| Tema | Documento |
|------|-----------|
| Nomenclatura archivos/símbolos | [EST-001](./EST-001-nomenclatura-tecnica.md) |
| Angular / contenedores | [EST-005](./EST-005-angular.md) |
| RPC y errores SQL | [EST-003](./EST-003-sql-postgresql.md) |
| Supabase client | [EST-006](./EST-006-supabase.md) |
| Documentación de módulo | [EST-007](./EST-007-documentacion.md) |
| Flujo agente | [EST-008](./EST-008-ia.md) |

---

## Checklist de cierre

- [ ] Modelos de dominio sin dependencia Supabase.
- [ ] Mapper único BD ↔ dominio; propiedades camelCase español.
- [ ] Repository encapsula `.rpc()` / `.from()`; service orquesta.
- [ ] Rules puras con spec cuando hay lógica de negocio.
- [ ] Sin `Tables` en componentes.
- [ ] Errores con clases/mensajes en español.
- [ ] `database.types.ts` sincronizado si hubo migración.
- [ ] Tests ejecutados según tipo de cambio.
- [ ] Contrato del módulo en `docs/codex/modulos/` actualizado si cambió API TS.
