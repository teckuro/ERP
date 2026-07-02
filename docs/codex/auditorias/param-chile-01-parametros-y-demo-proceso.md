# PARAM-CHILE-01 - Auditoria de parametros y limpieza de datos demo

Fecha cierre entrega: 2026-05-03. Alcance: lectura de `docs/codex`, modulo Parametros en Angular (`src/app/features/parametros-generales`), pagina `proceso-remuneraciones.page.ts`, manifest de claves. Sin motor, sin liquidaciones, sin Python nuevo, sin migraciones, sin Supabase remoto, sin SQL destructivo, sin rediseno visual profundo.

## 1. Resumen ejecutivo

Se cerro la fase **PARAM-CHILE-01** para mitigar **QA-CHILE-01-ALTO-004**: la pantalla Proceso mensual ya **no** muestra UF, sueldo minimo, tabla 2026, totales de nomina ni montos bancarios literales como si fueran datos oficiales del periodo. Queda aviso explicito de que **no calcula** y enlace a **`/parametros`** como fuente de parametros.

Se documento cobertura **declarativa** de parametros chilenos en codigo (manifest + tabs) frente a uso futuro en proceso mensual: la mayoria de conceptos estan **modelados en Parametros** pero el **Proceso mensual no los consume** aun (estado **PENDIENTE** de integracion).

## 2. Alcance revisado

| Area | Profundidad |
|------|---------------|
| Informe QA-CHILE-01 ALTO-004 | Actualizacion seguimiento |
| `proceso-remuneraciones.page.ts` | Cambio de template y estado local |
| `parametros-generales.manifest.ts` y tabs TS | Muestreo de claves y catalogos |
| Docs modulo Parametros | Referencia cruzada |
| BD v11 / Python | Solo mencion como fuente futura esperada (sin ejecucion) |

## 3. Parametros revisados

Fuente principal de inventario en repo: `src/app/features/parametros-generales/models/parametros-generales.manifest.ts` (`PARAMETRO_GENERAL_FORM_KEYS`, `PARAMETROS_CATALOGO_ARRAY_KEYS`) y pestanas bajo `components/tabs/`.

- Valores mensuales y topes en formulario unificado: UF, UTM, UTA, sueldos minimos, topes AFP/IPS/cesantia/APV, SIS, tasas AFC, salud, tramos impuesto, reforma, Ley 16.744, CCAF, LRE-related catalogos en arrays.

## 4. Matriz de cobertura

Formato: estado respecto a **pantalla Proceso mensual** y motor futuro, no respecto a existencia en modulo Parametros.

```txt
Parametro: UF (valor periodo)
Estado: PARCIAL
Fuente repo: Parametros generales (clave uf) + carga Python documentada en modulos/parametros
Fuente normativa esperada: fuente oficial del periodo
Uso futuro: calculos diarios, topes, Isapre
Riesgo: mostrar UF demo en proceso confunde al operador
Accion sugerida: en proceso mensual solo leer desde API/servicio; bloquear si falta periodo -> hecho mitigacion UI (sin cifras demo)

Parametro: UTM / UTA
Estado: PARCIAL
Fuente repo: mismo modulo
Fuente normativa esperada: oficial mensual
Uso futuro: multas, tasas, algunos topes
Riesgo: igual que UF
Accion sugerida: integracion 9.5A

Parametro: sueldo minimo (general y variantes etarias / casa particular)
Estado: PARCIAL
Fuente repo: claves sueldoMinimo* en manifest
Fuente normativa esperada: DT / ley
Uso futuro: bases, minimo imponible
Riesgo: demo en proceso (removido en PARAM-CHILE-01)
Accion sugerida: validar vigencia por fecha en motor

Parametro: tope AFP / tope IPS / tope cesantia / APV
Estado: PARCIAL
Fuente repo: claves tope* en manifest
Fuente normativa esperada: UF x tope, actualizacion legal
Uso futuro: cotizaciones
Riesgo: error de tope si periodo desalineado
Accion sugerida: snapshot por liquidacion (futuro)

Parametro: SIS, AFC trabajador/empleador, mutualidad Ley 16.744
Estado: PARCIAL
Fuente repo: sis, afc*, ley16744*, tabs dedicados
Fuente normativa esperada: leyes y decreto
Uso futuro: cotizaciones y costo empleador
Riesgo: complejidad plazo fijo vs indefinido
Accion sugerida: reglas motor + tests

Parametro: salud Fonasa / Isapre
Estado: PARCIAL
Fuente repo: tab salud, catalogos isapres
Fuente normativa esperada: porcentajes y tablas
Uso futuro: descuentos y cotizaciones
Riesgo: mediano
Accion sugerida: mantener Parametros como fuente unica

Parametro: tabla impuesto unico
Estado: PARCIAL
Fuente repo: tablaImpuestoUnico en catalogos
Fuente normativa esperada: SII
Uso futuro: retenciones
Riesgo: alto si tabla desactualizada
Accion sugerida: bloqueo proceso si sin tramos para periodo (futuro)

Parametro: AFP vigencias
Estado: PARCIAL
Fuente repo: catalogo afp + parametros por AFP en tabs
Fuente normativa esperada: SP / reforma
Uso futuro: cotizacion
Riesgo: reforma y tasa mixta
Accion sugerida: documentado en modulos/parametros; motor debe versionar

Parametro: reforma previsional / trabajos pesados
Estado: PARCIAL
Fuente repo: reformaPensiones, reformaPrevisional, trabajosPesados
Fuente normativa esperada: ley y tablas
Uso futuro: tasas mixtas
Riesgo: alto en anos de transicion
Accion sugerida: fase dedicada en motor

Parametro: LRE catalogos / Previred empresa
Estado: PENDIENTE
Fuente repo: catalogos en PARAMETROS_CATALOGO_ARRAY_KEYS parcialmente orientados a carga masiva; no hay generador Previred/LRE en proceso mensual
Fuente normativa esperada: Previred, DT
Uso futuro: archivos mensuales
Riesgo: expectativa de boton real -> mitigado con "No disponible" y copy
Accion sugerida: LIQ-CHILE u otra fase exportaciones

Parametro: IPS tasas (institucional)
Estado: NO_REVISADO
Fuente repo: no mapeado linea a linea en esta auditoria
Fuente normativa esperada: segun rol IPS
Uso futuro: salud y otros
Riesgo: desconocido sin leer tab SQL
Accion sugerida: revision BD v11 cuando haya motor

Parametro: CCAF (entidades)
Estado: PARCIAL
Fuente repo: ccafEntidades, tab CCAF/mutuales
Uso futuro: descuentos y cotizaciones
Riesgo: mediano
Accion sugerida: enlazar motor a mismas tablas que UI Parametros
```

## 5. Datos demo detectados (antes de PARAM-CHILE-01)

En `proceso-remuneraciones.page.ts` (version previa):

- Lista amarilla con **UF** monto literal, **sueldo minimo** literal, texto **tabla impuesto 2026**.
- Paso calculo: contadores **42** empleados, totales **$ 16.2M**, haberes/descuentos/costo con **montos literales**.
- Texto **impuesto unico segun tabla 2026**.
- Paso exportacion: **Total $ 16.200.000**, **vencimiento 10/05/2026**, textos que sugerian archivos reales generados.
- Tabla de **incidencias** con nombres y montos en CLP (demo operativo falso).

## 6. Cambios aplicados en proceso mensual

- Tarjeta informativa superior: proceso **no calcula**; parametros en **`/parametros`**; sin cifras normativas desde servidor en esta vista.
- Paso 1: caja neutra de **revision** (lista generica sin numeros); boton marcador local; **sin tabla** de incidencias con montos; estado **No conectado**.
- Paso 2: mensaje de **no disponible**; boton deshabilitado; sin simulacion de totales.
- Paso 3: tarjetas Previred / banco / LRE con **No disponible**; sin montos ni fechas de vencimiento literales.
- Paso 4: cierre **no disponible**; checklist generico sin afirmar archivos generados.
- `RouterLink` a `/parametros` para navegacion real.
- **PARAM-CHILE-01 v4 + contrato `frontend-interfaces`:** UI movida a `src/app/features/nomina-mensual/containers/proceso-mensual-container/` (html, css, ts, spec); `src/app/pages/proceso-remuneraciones.page.ts` queda solo como wrapper con `<app-proceso-mensual-container />`.

## 7. Brechas pendientes

- Proceso mensual **lee** `ParametrosGeneralesService` en **9.5A** (`obtenerUltimoHastaPeriodo`, `obtenerPeriodoRemuneracion`) dentro de `ProcesoMensualService`; sin mostrar valores normativos en UI.
- Motor de calculo y liquidaciones: fuera de alcance.
- Validacion cruzada Python vs filas UI Parametros: auditoria separada si se pide.
- Liquidaciones y snapshots: ver recomendaciones QA LIQ / CHILE-FIX-02.

## 8. Riesgo Chile

Sin PARAM-CHILE-01 el operador podria **tomar decisiones** de cotizacion o impuesto basadas en **numeros demo**. Con la limpieza, el riesgo principal pasa a ser **falta de integracion** (proceso no avisa aun de parametros incompletos desde datos reales) -> mitigar en **9.5A** con prevalidaciones.

## 9. Recomendaciones por fase

1. **9.5A** - Contrato proceso mensual chileno: leer parametros del periodo, estados de periodo, prevalidaciones, sin motor completo hasta checklist.
2. **CHILE-FIX-02** - Flag catalogo recurrente vs variable (ALTO-003).
3. **LIQ-CHILE-01** - Contrato liquidacion snapshot (ALTO-005).

## 10. Seguimiento QA-CHILE-01 ALTO-004

- Estado: **Cerrado** en alcance PARAM-CHILE-01 (UI sin cifras normativas demo como reales; copy honesto; arquitectura wrapper + container v4).
- Fecha: 2026-05-03 (limpieza demo); 2026-05-04 (migracion a container segun brief v4).
- Evidencia: `proceso-remuneraciones.page.ts` (wrapper), `proceso-mensual-container/*`, este informe.
- Fase: PARAM-CHILE-01 cerrada; lectura declarativa en proceso mensual cubierta en **9.5A** (prevalidaciones); refinamiento posible en 9.5B.

## 11. Arquitectura (brief v4)

Cumple `docs/codex/arquitectura/frontend-interfaces.md`: la pantalla de proceso mensual **no** se implementa como pagina inline extensa. El contenedor `ProcesoMensualContainer` orquesta UI; la logica de prevalidacion vive en `ProcesoMensualService` + reglas puras (9.5A).

## 12. Post-9.5A

- `ProcesoMensualService` usa `ParametrosGeneralesService` solo para prerequisitos (existencia de filas, estado de `periodo_remuneracion`), no para pintar montos en proceso mensual.
- Detalle de reglas: [`../modulos/nomina-mensual/prevalidaciones/prevalidaciones-9-5A.md`](../modulos/nomina-mensual/prevalidaciones/prevalidaciones-9-5A.md).
