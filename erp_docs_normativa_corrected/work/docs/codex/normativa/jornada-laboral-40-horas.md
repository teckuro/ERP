# Jornada laboral de 40 horas (Ley 21.561)

La Ley 21.561, publicada el **26 de abril de 2023**, modifica el Código del Trabajo para reducir de manera escalonada la jornada ordinaria de 45 a 40 horas semanales.  La propia Dirección del Trabajo ha señalado que esta reducción no puede implicar disminución de remuneraciones ni afectar los derechos adquiridos por los trabajadores.

## Calendario de reducción

| Fecha de vigencia | Límite de jornada ordinaria |
|-------------------|-----------------------------|
| **26‑04‑2024**    | 44 horas semanales |
| **26‑04‑2026**    | 42 horas semanales |
| **26‑04‑2028** (aprox.) | 40 horas semanales |

El límite final de 40 horas entrará en vigor cinco años después de la publicación de la ley, salvo que la legislación posterior disponga otra cosa.

## Validación e impacto en el ERP

La aplicación de la Ley 21.561 exige que el ERP adapte la validación de contratos y el cálculo de horas según la jornada máxima vigente. Se recomiendan las siguientes reglas:

| Regla | Validación ERP |
|---|---|
| **Jornada ordinaria máxima por fecha** | Al definir un contrato o modificar la jornada de un trabajador, el campo `contrato.jornada` debe validar la vigencia de la jornada máxima de acuerdo con el calendario legal: 45 horas antes del 26‑04‑2024, 44 horas desde el 26‑04‑2024, 42 horas desde el 26‑04‑2026 y 40 horas desde el 26‑04‑2028. Se debe considerar la **fecha de inicio del contrato** y el **periodo de remuneración** para determinar el límite aplicable. |
| **Jornada parcial** | Los contratos a jornada parcial no deben superar 30 horas semanales. El sistema debe advertir o bloquear si el valor ingresado excede este límite. |
| **Artículo 22** | Los trabajadores excluidos de la limitación de jornada (artículo 22) no están sujetos al límite ordinario; sin embargo, el empleador debe registrar y justificar esta condición. |
| **Reducción sin disminución de sueldo** | La reducción de jornada no puede disminuir las remuneraciones. El valor de la hora ordinaria debe recalcularse para mantener el sueldo mensual. El sistema debe advertir si se pretende rebajar el sueldo base en proporción a la reducción de horas. |
| **Horas extraordinarias** | El cálculo de horas extraordinarias debe basarse en la jornada vigente en cada etapa y aplicar el recargo legal de al menos un 50 % sobre la hora ordinaria. |

La versión y vigencia de esta norma se encuentran detalladas en `versionado‑normativo.md`.

## Fuente normativa

| Campo | Valor |
|---|---|
| **Fuente oficial** | Ministerio del Trabajo y Dirección del Trabajo |
| **Documento / página** | Ley 21.561 – Reducción de la jornada laboral |
| **URL oficial** | [www.mintrab.gob.cl/ley40horas](https://www.mintrab.gob.cl/ley40horas/) |
| **Fecha de vigencia** | 2024‑04‑26 (inicio de la reducción) |
| **Fecha de revisión documental** | 2026‑05‑05 |
| **Tipo de dato ERP** | VIGENCIA |
| **Módulo responsable** | Empleados / Nómina |
