# Parámetros generales: campos del formulario y listas (catálogos)

Referencia alineada al modelo en [`parametro-general.model.ts`](../../src/app/features/parametros-generales/models/parametro-general.model.ts) y a la carga vía `ParametrosGeneralesService`.

## Formulario editable por periodo (`ParametroGeneral`)

Campos persistidos con el periodo seleccionado (pestañas **Valores**, **Remuneraciones**, **CCAF y Mutual** donde aplica):

| Control / API | Notas |
|---------------|--------|
| `periodo` | `YYYY-MM`; fijado por el selector superior del listado. |
| `uf`, `utm`, `uta` | Indicadores. |
| `gratificacion`, `immGratificacion` | Gratificación y factor IMM. |
| `descuentosBasePorDia` | Método de descuento de ausencias (radio). |
| `sueldoMinimo18a65`, `sueldoMinimoMenor18Mayor65`, `sueldoMinimoCasaParticular`, `ingresoMinimoNoRemuneracional` | Rentas mínimas imponibles. |
| `afcTrabajadorIndefinido`, `afcEmpleadorIndefinido`, `afcEmpleadorPlazo`, `afcEmpleadorIndefinidoOnceAnosMas`, `afcEmpleadorCasaParticular` | Tasas AFC (%). |
| `sis`, `sanna`, `seguroSocialExpectativaVida`, `aporteEmpleadorAfp` | Cotizaciones empleador (%). |
| `topeAfpUf`, `topeAfp`, `topeIpsUf`, `topeIps`, `topeCesantiaUf`, `topeCesantia` | Topes AFP/IPS/Cesantía. |
| `topeApvMensualUf`, `topeApvMensual`, `topeApvAnualUf`, `topeApvAnual`, `topeDepositoConvenidoAnualUf`, `topeDepositoConvenidoAnual`, `topeAfpVoluntario` | Topes APV y afines. |
| `saludObligatoria`, `saludCcaf`, `saludFonasaConCcaf` | Salud (%). |
| `trabajoPesadoEmpleador`, `trabajoPesadoTrabajador`, `trabajoMenosPesadoEmpleador`, `trabajoMenosPesadoTrabajador` | Trabajo pesado (%). |
| `fechaActualizacion` | Metadato de última actualización. |

> El payload de guardado puede mapear nombres legacy (p. ej. `sueldoMinimo` desde `sueldoMinimo18a65`); ver `guardar` en `parametros.page.ts`.

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
