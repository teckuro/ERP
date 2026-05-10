# Inconsistencias detectadas

Durante el análisis de los documentos originales se identificaron varias contradicciones, solapamientos o vacíos que deben resolverse en futuras fases del proyecto.  Este registro permite rastrear estos temas para que no se pierdan y ofrece sugerencias para su resolución.

## Parametros y vigencias

- **`trabajo_pesado_parametro` (híbrido):** el modelo actual usa un híbrido de `periodo` obligatorio y campos de vigencia (`vigencia_inicio`, `vigencia_fin`).  La UI trata estas filas como vigencias solapadas al periodo, pero el SQL de render obliga el periodo exacto en algunos contextos.  Se debe decidir si la dimensión principal es el mes (`PERIODO_MENSUAL`) o la vigencia y ajustar claves y filtros en consecuencia.  Hasta que producto defina, mantener el comportamiento híbrido documentado en `periodo-vigencia-catalogo.md` y marcar mensajes de UI como “pendiente definición final”.

- **`tabla_impuesto_unico`:** la tabla se versiona por vigencia (`vigencia_inicio` / `vigencia_fin`) pero en la BD se genera un campo `periodo` igual al mes de inicio.  Las interfaces la tratan como **PERIODO_MENSUAL** para efectos de filtrado, generando confusión.  La clasificación oficial es vigencia con un periodo generado; la UI debe clarificar esta ambigüedad, por ejemplo: “tabla versionada; filtro mostrado como mes derivado de vigencia”.

- **`afp` versus `afp_vigencia`:** algunos listados muestran solo la tabla plana `afp` ignorando `afp_vigencia`; en otros contextos se utiliza `afp_vigencia` para tasas.  Este desajuste puede llevar a que la UI muestre datos desalineados con el cálculo de cotizaciones.  Se sugiere evaluar si la grilla debe exponer `afp_vigencia` o si `afp` debe enriquecerse con la información vigente al periodo.

- **Catálogos con `periodo` opcional:** muchas tablas “globales” tienen un campo `periodo` solo para trazabilidad, pero las cargas reales lo poblaban con el mes.  Esto llevó a que la UI las tratara como mensuales cuando en realidad son catálogos globales.  Debe revisarse si los registros con `periodo` distinto de NULL en estos catálogos son un error de carga; de lo contrario, actualizar la clasificación y la lógica de filtrado.

## Estados y nomenclaturas

- **`BORRADOR` para empleados vs períodos:** la palabra “borrador” se usa en `persona.estado` (empleado) para representar una persona creada parcialmente por el wizard avanzado y en `periodo_remuneracion.estado` para registrar un mes creado pero no preparado.  Aunque son dominios distintos (empleados vs parámetros), es fácil confundirlos.  Se recomienda utilizar descriptores más claros para el estado del periodo (p.� ej. `pendiente`) y reservar “borrador” exclusivamente para datos parciales de alta avanzada.

- **`INCOMPLETO` y `VALIDO`:** en el módulo Empleados, estos valores significan “ficha incompleta” y “ficha completa y validada”.  En otros módulos se utilizan valores similares para estados diferentes (por ejemplo, `INVALIDO` en Conceptos).  El glosario unifica definiciones, pero se sugiere estandarizar enums y documentar su uso en cada contexto para evitar ambigüedad.

- **Mensajes de estado duplicados:** en Parametros, algunos mensajes de estado se repiten en cada pestaña (p.� ej. “vigente al periodo activo”), lo que satura la UI.  La actualización del 2026-05-01 propone mover esta explicación al encabezado y limpiar los tabs, pero algunos documentos antiguos siguen refiriendo a la convención anterior.  Se debe sincronizar todos los documentos con la política actual.

## Funcionalidades pendientes o con vacíos

- **Exposición de `afp_vigencia` y `salud_plan` en UI:** actualmente no existen vistas para estas tablas aunque las vigencias se gestionan en la BD.  El producto debe decidir si se exponen y, de ser así, crear las pantallas correspondientes.

- **Regla de dimensión para `trabajo_pesado_parametro`:** documentado como híbrido; la decisión final sigue pendiente (ver arriba).

- **Cierre de asignaciones recurrentes:** el flujo está descrito en el contrato de Haberes, pero la implementación de RLS, roles, auditoría y UI completa permanece pendiente.  Es un vacío que debe cerrarse en fases posteriores.

- **Liquidaciones y motor de cálculo:** los contratos de Nomina mensual declaran que el motor y las liquidaciones no están implementados.  La documentación actual se detiene en prevalidaciones; se debe redactar un contrato futuro cuando el motor esté en desarrollo.

## Inconsistencias menores

- **Uso de acentos y mayúsculas:** algunos documentos originales mezclan tildes (`á`, `é`, `í`, etc.) con versiones ASCII sin acentos, y mayúsculas en código (`HABER`, `Descuento`).  La base documental final adopta ASCII cuando se pueden omitir acentos y capitaliza de manera consistente los enums.
- **Rutas antiguas:** ciertos textos apuntan a rutas antiguas (p.� ej. `/haberes-descuentos` sin prefijo `/remuneraciones`).  Aunque existen redirecciones temporales, la versión final debería documentar solo las rutas oficiales.
- **Campos redundantes en payloads:** en algunos ejemplos de guardado de parámetros se usan nombres legacy (`sueldoMinimo` mapeado desde `sueldoMinimo18a65`).  Debe crearse un mapeo único o actualizar el modelado para evitar confusión.

Estas inconsistencias no son exhaustivas; la sección se actualizará conforme se descubran nuevos casos.  Las decisiones que resuelvan estas contradicciones deben reflejarse en el `CHANGELOG.md` y en las modificaciones pertinentes a los contratos.