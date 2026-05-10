# Fases canonicas

## Proposito

Indice canonico de fases creado en `DOCS-INTEGRATION-01` para no depender solo de textos largos por modulo.

Los archivos de esta carpeta resumen fase, estado, evidencia, alcance y relacion con documentos modulares. No reemplazan los contratos de modulo.

## Estructura

| Carpeta | Contenido |
|---|---|
| `auth/` | Auth base, entorno E2E y usuario/periodo E2E. |
| `empleados/` | Fases que alinean alta/ficha con nomina. |
| `nomina/` | Persistencia, E2E, cierre y liquidaciones. |
| `ux-comercial/` | Experiencia comercial posterior a liquidaciones. |
| `futuras/` | Previred, LRE, banco y contabilidad como fases futuras. |

## Regla

Una fase futura debe quedar marcada como `futura` o `en_diseno`. No usar lenguaje de implementacion si no hay evidencia.

## Lectura recomendada

1. `../orquestador/mapa-global-fases.md`
2. `../orquestador/estado-fases.md`
3. Archivo de fase en esta carpeta.
4. README y contrato del modulo.
