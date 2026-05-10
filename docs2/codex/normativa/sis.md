# Seguro de Invalidez y Sobrevivencia (SIS)

## Fuente normativa

| Campo | Valor |
|---|---|
| Fuente oficial | Superintendencia de Pensiones / PreviRed mensual |
| Documento / pagina | Indicadores previsionales oficiales del periodo |
| URL oficial | Pendiente de registrar por periodo |
| Fecha de vigencia | Mensual, segun periodo remuneracional |
| Fecha de revision documental | 2026-05-05 |
| Tipo de dato ERP | VIGENCIA_MENSUAL_OFICIAL |
| Modulo responsable | Parametros / Nomina mensual |

## Regla operativa

La tasa SIS no se hardcodea en calculos ni se fija como constante documental.

Para cada periodo se resuelve en este orden:

1. Tabla oficial cargada desde PreviRed mensual.
2. Fuente oficial de la Superintendencia de Pensiones.
3. Registro manual auditado en Parametros, marcado como excepcion.

Si no existe tasa confirmada para el periodo, bloquear nomina.

## Tabla fisica

La tabla fisica o campo exacto para SIS queda pendiente de DB-01. No crear ni asumir nombres alternativos sin actualizar [`../orquestador/diccionario-tablas-canonicas.md`](../orquestador/diccionario-tablas-canonicas.md).