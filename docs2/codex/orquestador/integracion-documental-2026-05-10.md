# Integracion documental 2026-05-10 - DOCS-INTEGRATION-01

## Objetivo

Integrar, normalizar y mejorar la base documental `docs/codex` sin tocar codigo, SQL, RPC, RLS, tests ni configuracion.

## Resultado

Se agrego una capa canonica para que nuevas fases puedan ubicarse rapido:

```txt
README.md
-> orquestador/mapa-global-fases.md
-> orquestador/estado-fases.md
-> fases/README.md
-> contrato del modulo
```

## Archivos principales agregados

| Archivo | Rol |
|---|---|
| `orquestador/auditoria-documental-global.md` | Auditoria de coherencia documental. |
| `orquestador/mapa-global-fases.md` | Vista rapida de fases, estados y siguientes pasos. |
| `fases/README.md` | Indice de fases canonicas. |
| `modulos/liquidaciones-oficiales/README.md` | Modulo futuro de liquidaciones. |
| `modulos/liquidaciones-oficiales/contrato-general.md` | Contrato futuro de liquidaciones oficiales. |
| `assets/README.md` | Reglas para capturas/evidencias visuales. |

## Roadmap canonico

```txt
NOM-CIERRE-DESIGN-01
-> NOM-CIERRE-01
-> LIQ-DESIGN-01
-> LIQ-OFICIAL-01
-> UX-COMERCIAL-01
-> PREVIRED/LRE/BANCO/CONTABILIDAD como futuras
```

## Criterios respetados

- No se borraron archivos.
- No se movieron archivos.
- No se renombraron archivos.
- No se marco cierre operativo como implementado.
- No se marcaron liquidaciones oficiales como implementadas.
- Previred, LRE, banco y contabilidad quedaron futuras.
- La nomina queda documentada hasta aprobacion operativa persistida y E2E real.

## Nota de encoding

Se normalizaron algunos Markdown con caracteres invalidos a UTF-8 para facilitar edicion en Cursor. No se cambio el alcance funcional por esa normalizacion.
