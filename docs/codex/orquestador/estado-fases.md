# Estado de fases - índice por dominio

> Bitácora canónica de fases del ERP, rotada por dominio el **2026-06-03** (DOCS-AUDIT-02 / L4) para reducir el tamaño del archivo único (anteriormente 188 KB / 1.074 líneas / 111 bloques H2) y facilitar la navegación.
>
> Cada archivo de dominio mantiene su orden cronológico inverso original. Las **nuevas entradas** se agregan en el archivo de dominio correspondiente, no aquí.

## Índice por dominio

| Dominio | Archivo | Entradas | Ámbito principal |
|---------|---------|---------:|------------------|
| Nómina mensual | [`estado-fases/nomina-mensual.md`](./estado-fases/nomina-mensual.md) | 47 | Flujo `Preparar nómina`, V2 productiva (pasos 1–3), modales periodo, workspace, prevalidaciones |
| Empleados | [`estado-fases/empleados.md`](./estado-fases/empleados.md) | 28 | Creación avanzada, ficha/expediente, perfil laboral, validaciones chilenas |
| ERP shell / NOIA | [`estado-fases/erp-shell.md`](./estado-fases/erp-shell.md) | 8 | Shell sidebar/topbar, guardrails NOIA, MessageBox, contexto, chips |
| Movimientos de remuneración | [`estado-fases/movimientos.md`](./estado-fases/movimientos.md) | 8 | Gestión integral, grilla única, modales, formularios |
| Parámetros | [`estado-fases/parametros.md`](./estado-fases/parametros.md) | 4 | Catálogos legales, vigencias, copy NOIA, transversal |
| Documentación | [`estado-fases/docs.md`](./estado-fases/docs.md) | 3 | Nomenclatura, DOCS-AUDIT, seeds documentales |
| Liquidaciones oficiales | [`estado-fases/liquidaciones.md`](./estado-fases/liquidaciones.md) | 1 | `LIQ-OFICIAL-01`, validación BD `LIQ-DB-APPLY-01` |
| UX comercial / transversal | [`estado-fases/ux-comercial.md`](./estado-fases/ux-comercial.md) | 1 | `REM-UX-FLOWS-01 V2` (periodo activo global) |
| LRE / Previred | [`estado-fases/lre-previred.md`](./estado-fases/lre-previred.md) | 1 | `LRE-CONCEPT-RULES-01` (parcial, SQL pendiente de aplicar) |
| Roadmap y orden | [`estado-fases/orden.md`](./estado-fases/orden.md) | 10 | `ORDEN-01` + secciones 1–9 (propósito, fases cerradas, pendientes, criterios) |

**Total**: 111 bloques H2 distribuidos.

## Cómo registrar una nueva fase

1. Identificar el dominio de la fase (si toca varios, primario = el de mayor impacto).
2. Abrir el archivo de dominio (`estado-fases/<dominio>.md`).
3. Agregar la nueva entrada **al inicio** del archivo (después del header), siguiendo el formato existente:
   ```
   ## <ID-FASE> - <título corto>

   | Campo  | Estado / valor                        |
   | ------ | ------------------------------------- |
   | Estado | Implementada / Parcial / Pendiente    |
   | …      |                                       |
   ```
4. Si la fase reemplaza/extiende una previa, enlazar a su entrada anterior en el mismo archivo.
5. Si toca UI visible, registrar también en [`../peticiones-estilos.md`](../peticiones-estilos.md).

## Política de "Actualización <fecha> - <ID>"

Las entradas con prefijo `Actualizacion YYYY-MM-DD - <ID>` viven en el archivo del **dominio del ID que actualizan**, no en uno separado.

## Documentos relacionados

- [`mapa-documentacion.md`](./mapa-documentacion.md) - índice maestro de `docs/codex/`.
- [`contexto-proyecto.md`](./contexto-proyecto.md) - visión, módulos, decisiones rectoras.
- [`../README.md`](../README.md) - README padre con tabla de módulos.
- [`../auditorias/auditoria-docs-codex-2026-06-03.md`](../auditorias/auditoria-docs-codex-2026-06-03.md) - auditoría DOCS-AUDIT-02 que originó esta rotación.

## Histórico antes de la rotación L4

El archivo previo `estado-fases.md` (1.074 líneas, 188 KB) **se eliminó** tras dividir sus 111 bloques en los archivos de dominio listados arriba. No se conserva copia byte-exacta porque el contenido completo está distribuido sin pérdida (validado por la suma 47+28+8+8+4+3+1+1+1+10 = 111). El historial git mantiene la versión previa.