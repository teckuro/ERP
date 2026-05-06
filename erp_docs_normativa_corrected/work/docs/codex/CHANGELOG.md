# CHANGELOG

Registro de cambios aplicados a la base documental del ERP de remuneraciones.  Cada entrada debe incluir una fecha y describir de forma concisa las modificaciones realizadas.  Los cambios que afectan contratos funcionales, glosarios o flujos deben acompañarse de una referencia al documento correspondiente.

## 2026‑05‑05 — Versión final consolidada

- **Adición de glosario y nomenclatura:** se añadió `glosario.md` para unificar la definición de términos como `PERIODO_MENSUAL`, `VIGENCIA`, `CATALOGO_GLOBAL`, `ANUAL`, `CONFIG_EMPRESA`, así como los estados de períodos de remuneración y empleados.  Este archivo surge ante la necesidad de evitar ambigüedades y duplicación de definiciones dispersas en múltiples documentos.
- **Registro de inconsistencias:** se creó `inconsistencias.md` para documentar contradicciones detectadas entre fuentes originales: uso híbrido de `trabajo_pesado_parametro`, clasificación de `tabla_impuesto_unico`, falta de exposición de `afp_vigencia`, estados `BORRADOR` en diferentes dominios, entre otros.  Este registro permite priorizar decisiones futuras.
- **Plan de pruebas consolidado:** se añadió `plan-pruebas.md` para centralizar las pruebas existentes y proponer una expansión.  El plan agrupa pruebas unitarias, de integración y E2E por módulo y resalta brechas actuales.
- **Changelog formalizado:** se incorporó este propio `CHANGELOG.md` como mecanismo transparente de trazabilidad de cambios en la documentación.
- **Actualización de `README.md`:** se actualizó el índice general para incluir las nuevas secciones (`glosario.md`, `inconsistencias.md`, `plan-pruebas.md`, `CHANGELOG.md`) y se reforzó la jerarquía de lectura.
- **Actualización del mapa de documentación:** `orquestador/mapa-documentacion.md` se modificó para listar los nuevos archivos y describir su propósito.
- **Homologación de estilo ASCII:** se revisaron archivos para eliminar acentos innecesarios y mantener una codificación ASCII en títulos, tablas y rutas.  Se dejaron tildes únicamente en explicaciones donde la claridad lo exigía.
- **Notas de UI sincronizadas:** se aclaró en varios contratos que las explicaciones mensuales/vigencias se desplazan a la banda superior de las pantallas, limpiando tabs y copy repetitivo (alineado al ajuste del 2026‑05‑01 en Parametros).
- **Enlaces cruzados:** se agregaron referencias al glosario y al registro de inconsistencias en contratos generales y guías relevantes, mejorando la navegabilidad.

## 2026‑05‑02 — Versión base inicial

- Se creó la primera versión de la base documental reorganizada a partir de las fuentes originales (`docs.zip`).  Se definió la estructura de carpetas (`codex/`, `modulos/`, `temas/`, `orquestador/`) y se redactaron archivos resumidos por módulo: empleados, parámetros, conceptos de remuneración, haberes y descuentos, nómina mensual.  Se añadieron guías de UI y estilos y un índice general (`README.md`).  Se generó un `mapa-documentacion.md` para describir cada archivo.

Entradas anteriores se encuentran en resúmenes del memento; esta changelog las formaliza en la base documental para futuras referencias.