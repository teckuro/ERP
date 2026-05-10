# Arquitectura (`docs/codex/arquitectura`)

Contratos transversales de implementacion que complementan `AGENTS.md` y el orquestador.

| Documento | Rol |
|-----------|-----|
| [`frontend-interfaces.md`](./frontend-interfaces.md) | Paginas como wrappers, features, contenedores vs logica, anti-patrones Angular/ERP |

**Ejemplo aplicado:** Proceso mensual (`/remuneraciones/proceso-mensual`) -> `src/app/features/nomina-mensual/containers/proceso-mensual-container/` + wrapper `proceso-remuneraciones.page.ts` (PARAM-CHILE-01 v4).
