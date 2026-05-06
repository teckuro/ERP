# Parámetros generales: campos del formulario y listas (catálogos)

Referencia alineada al modelo en [`parametro-general.model.ts`](../../../../src/app/features/parametros-generales/models/parametro-general.model.ts) y a la carga vía `ParametrosGeneralesService`.

## Formulario editable por periodo (`ParametroGeneral`)

Campos del snapshot mensual oficial con el periodo seleccionado (pestañas **Valores** y **Remuneraciones** donde aplica):

| Control / API | Notas |
|---------------|--------|
| `periodo` | `YYYY-MM`; fijado por el selector superior del listado. |
| `uf`, `utm`, `uta` | Indicadores. |
| `sueldoMinimo18a65`, `sueldoMinimoMenor18Mayor65`, `sueldoMinimoCasaParticular`, `ingresoMinimoNoRemuneracional` | Rentas mínimas imponibles. |
| `afcTrabajadorIndefinido`, `afcEmpleadorIndefinido`, `afcEmpleadorPlazo`, `afcEmpleadorIndefinidoOnceAnosMas`, `afcEmpleadorCasaParticular` | Tasas AFC (%). |
| `sis`, `sanna`, `seguroSocialExpectativaVida`, `aporteEmpleadorAfp` | Cotizaciones empleador (%). |
| `topeAfpUf`, `topeAfp`, `topeIpsUf`, `topeIps`, `topeCesantiaUf`, `topeCesantia` | Topes AFP/IPS/Cesantía. |
| `topeApvMensualUf`, `topeApvMensual`, `topeApvAnualUf`, `topeApvAnual`, `topeDepositoConvenidoAnualUf`, `topeDepositoConvenidoAnual`, `topeAfpVoluntario` | Topes APV y afines. |
| `saludObligatoria`, `saludCcaf`, `saludFonasaConCcaf` | Salud (%). |
| `trabajoPesadoEmpleador`, `trabajoPesadoTrabajador`, `trabajoMenosPesadoEmpleador`, `trabajoMenosPesadoTrabajador` | Trabajo pesado (%). |
| `fechaActualizacion` | Metadato de última actualización. |

> El payload de guardado puede mapear nombres legacy (p. ej. `sueldoMinimo` desde `sueldoMinimo18a65`); ver `guardar` en `parametros.page.ts`.

## Configuracion cliente por periodo (`parametros_generales_cliente`)

Configuracion propia del cliente/empresa editable desde UI y guardable aunque no exista carga mensual oficial en `parametros_generales`.
El guardado normal de la UI escribe en esta tabla; `parametros_generales` queda como snapshot oficial mensual de comparacion.

| Control / API | Notas |
|---------------|-------|
| `periodo` | `YYYY-MM`; clave de configuracion aplicable al periodo activo. |
| `descuentosBasePorDia` | Metodo de descuento de ausencias. |
| `gratificacion`, `immGratificacion` | Configuracion de gratificacion y factor IMM. |
| `idCcafEntidad` | Seleccion de CCAF desde `ccaf_entidad`; puede ser NULL. |
| `idOrganismoAdministradorLey16744` | Seleccion de mutual/organismo administrador desde `organismo_administrador_ley_16744`; puede ser NULL. |
| `fechaActualizacion` | Metadato de ultima actualizacion. |

Para completitud operativa, la configuracion cliente puede incluir valores operativos equivalentes al snapshot oficial: UF, UTM, UTA, sueldos minimos, ingreso minimo no remuneracional, topes AFP/IPS/Cesantia/APV, SIS, SANNA, salud, AFC y trabajo pesado. Esos campos son obligatorios para considerar completa la configuracion cliente cuando existen en el modelo, y se comparan contra el dato oficial sin sobrescribirlo automaticamente.

## Catálogos y tablas (`ParametrosGeneralesCatalogos`)

Listas cargadas con `listarCatalogos()` (solo lectura en pantalla; grids en otras pestañas):

| Clave | Tipo principal | Uso típico en UI |
|-------|----------------|------------------|
| `afp` | `AfpParametro[]` | Pestaña AFP |
| `isapres`, `saludInstituciones` | `IsapreParametro[]` | ISAPRE / instituciones salud |
| `tramosCarga` | `TramoCargaParametro[]` | Tramos cargas familiares |
| `tramosImpuesto` | `TramoImpuestoParametro[]` | Tramos impuesto a la renta |
| `tablaImpuestoUnico` | `TablaImpuestoUnicoParametro[]` | Tabla impuesto único |
| `reformaPensiones` | `ParametroLegal[]` | Reforma pensiones |
| `trabajosPesados` | `TrabajoPesadoParametro[]` | Tabla trabajo pesado |
| `reformaPrevisional` | `ReformaPrevisionalParametro[]` | Reforma previsional |
| `ley16744Parametros` | `Ley16744Parametro[]` | Ley 16.744 |
| `organismosLey16744` | `OrganismoLey16744[]` | Mutuales / select CCAF-mutual |
| `ccafEntidades` | `CcafEntidad[]` | Lista CCAF |
| `apvInstituciones`, `apvFormasPago` | `ApvApvcInstitucion[]`, `ApvApvcFormaPago[]` | APV |
| `afcParametros` | `AfcParametro[]` | Tabla AFC por tipo contrato |

## Periodos y años del selector superior

- **Lista de periodos** (`YYYY-MM`): `listarPeriodos()` en el repositorio / servicio; alimenta `periodosGeneralesCatalogo` y los años derivados para el combo de año.
- Los **años** mostrados en la UI deben basarse en esos periodos (más el año del periodo seleccionado), no en una lista fija arbitraria.

## DataGrids y periodo seleccionado

En [`parametros.page.ts`](../../../../src/app/pages/parametros.page.ts) las filas de los catálogos mostrados en **DataGrids** se acotan al **periodo seleccionado** arriba:

- Filas con **`periodo`** (`tramo_carga`, `tramo_impuesto`): coinciden exactamente con `YYYY-MM` actual.
- Tablas con **`vigenciaInicio` / `vigenciaFin`**: se incluyen solo si el rango intersecta el mes del periodo seleccionado.
- Listas maestras sin vigencia por mes (p. ej. **APV instituciones**) se mantienen completas.
