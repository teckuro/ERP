# Datos semilla del ERP

Para facilitar la puesta en marcha del ERP y las pruebas iniciales, se definen conjuntos de datos semilla (seeds) que se cargan en la base de datos antes de la explotación en producción.  Los seeds se dividen en categorías para separar la información global, normativa y específica de cada empresa.

## Categorías

| Categoría | Descripción | Ejemplos |
|---------|-------------|---------|
| **SEED_GLOBAL** | Datos permanentes que rara vez cambian. | Bancos, tipos de cuenta, catálogo de mutuales, Cajas de Compensación (CCAF), tabla de tipos de contrato, tipos de jornada, conceptos base de remuneración. |
| **SEED_NORMATIVO** | Datos normativos con vigencia, que se actualizan periódicamente. | Catálogo LRE, AFP y sus vigencias, salud (Isapres/Fonasa), indicadores previsionales, topes de gratificación, tramos de impuesto único. |
| **CARGA_MENSUAL** | Datos cargados mes a mes en función de vigencias y montos. | Tasas de AFP, salud, AFC, SIS, SANNA; indicadores económicos; actualizaciones de IMM; tramos del impuesto único; valores de asignación familiar. |
| **CONFIG_EMPRESA** | Datos propios de cada empresa, cargados una sola vez o modificados ocasionalmente. | Datos de la empresa, parámetros internos, definición de haberes recurrentes por defecto, convenios colectivos. |

Separar los datos de esta manera ayuda a evitar mezclar información permanente con parámetros mensuales.  Los procesos de carga (`carga-parametros-python.md`) deben respetar estas categorías para mantener la consistencia del sistema.
