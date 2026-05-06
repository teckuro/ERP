# Libro de Remuneraciones Electrónico (LRE)

El Libro de Remuneraciones Electrónico (LRE) sustituye al antiguo libro físico y constituye el registro oficial de las remuneraciones y descuentos pagados por el empleador.  Su implementación está regulada por la Dirección del Trabajo y el Servicio de Impuestos Internos.

## Obligación y plazos

- **Obligación:** El artículo 62 del Código del Trabajo obliga a los empleadores a llevar un libro de remuneraciones.  Desde 2021 esta obligación puede cumplirse en formato electrónico mediante el LRE.
- **Plazo de carga:** Las remuneraciones deben cargarse **mensualmente**, dentro de los **15 primeros días hábiles** del mes siguiente al pago.
- **Irrevocabilidad:** Una vez que una empresa se incorpora al LRE, no puede volver al libro físico.  Debe cargar todos los meses del año calendario y, si corresponde, períodos retroactivos.

## Contenido del registro

El LRE debe incluir:

* Identificación de cada trabajador.
* Haberes imponibles y no imponibles.
* Cotizaciones previsionales y deducciones legales.
* Totales imponibles, tributable y líquido.

## Marco normativo

* **Dictamen N.º 877/006 (10‑03‑2021)** de la Dirección del Trabajo establece la doctrina sobre el LRE.
* **Resolución Exenta SII N.º 29 (09‑03‑2021)** dicta las instrucciones sobre cómo informar al Servicio de Impuestos Internos.
* La **Ley 21.327** de modernización de la Dirección del Trabajo podría hacer obligatorio el uso del LRE para todos los empleadores en el futuro.

## Implicancias para el ERP

* El módulo de **Nómina mensual** debe exportar los datos en el formato exigido por el LRE.  Esto incluye separar claramente haberes imponibles y no imponibles y detallar las cotizaciones.
* El catálogo `catalogo_lre` debe mantenerse actualizado para mapear los conceptos internos a los códigos del LRE.
* Los procesos de carga deben considerar que una vez adoptado el LRE, es necesario migrar los meses históricos y no se puede volver al libro físico.

Más detalles sobre la clasificación de conceptos se encuentran en `remuneracion‑imponible‑no‑imponible.md` y la vigencia normativa en `versionado‑normativo.md`.

## Modalidades de declaración

La Dirección del Trabajo y el Servicio de Impuestos Internos permiten dos modalidades para declarar el Libro de Remuneraciones Electrónico:

1. **Carga masiva mediante archivo CSV o TXT**: el empleador genera un archivo separado por **punto y coma (;)**, con encabezados exactos y sin columnas adicionales, y lo carga en la plataforma MiDT. El archivo puede comprimirse en formato ZIP si contiene varios meses o empresas.
2. **Formulario en línea**: la plataforma MiDT permite completar el libro directamente a través de un formulario, registrando los valores uno a uno.

El ERP debe ser capaz de exportar los datos de nómina en el formato CSV/TXT requerido y alertar al usuario si faltan columnas o si el separador no es el correcto. También debe indicar en qué periodo se cumple el plazo de 15 días hábiles para la carga.

## Fuente normativa

| Campo | Valor |
|---|---|
| **Fuente oficial** | Dirección del Trabajo y Servicio de Impuestos Internos |
| **Documento / página** | Dictamen N.º 877/006, Resolución Exenta SII N.º 29 y guías del LRE |
| **URL oficial** | [www.dt.gob.cl](https://www.dt.gob.cl/) / [www.sii.cl](https://www.sii.cl/) |
| **Fecha de vigencia** | 2021‑03‑09 (inicio del LRE electrónico) |
| **Fecha de revisión documental** | 2026‑05‑05 |
| **Tipo de dato ERP** | CATALOGO / VIGENCIA |
| **Módulo responsable** | Nómina / LRE |


Para profundizar en el diseño de este módulo consulte también:

* `modulos/lre/contrato-general.md` — describe el alcance funcional del módulo LRE.
* `modulos/lre/catalogo-lre.md` — detalla la estructura de catálogos y códigos exigidos por el SII/DT.
* `modulos/lre/exportacion-lre.md` — explica cómo exportar los datos en el formato requerido por la plataforma oficial.
