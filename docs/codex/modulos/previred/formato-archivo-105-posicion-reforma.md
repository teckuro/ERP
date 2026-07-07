# Formato Previred — largo fijo por posición (105 campos, Reforma 2025)

Referencia oficial: [FormatoLargoFijoPorPosicion-Reforma-1.pdf](https://www.previred.com/wp-content/uploads/2025/07/FormatoLargoFijoPorPosicion-Reforma-1.pdf) (Previred, julio 2025; rige desde remuneraciones **agosto 2025**). Versión posterior equivalente: Reforma-4 del mismo mes.

Implementación motor de líneas: `previred-archivo-105-posicion.rules.ts`.

## Qué es distinto de PREVIRED-REM-v1

| Aspecto | `PREVIRED-REM-v1` (PREVIRED-01c) | Archivo oficial Previred |
|--------|-----------------------------------|---------------------------|
| Estructura | Registros `H\|T\|M\|C` separados por `\|` | **Una línea por trabajador**, 861 caracteres fijos |
| Campos | Movimientos codificados por línea | **105 campos** en posiciones fijas |
| Subida portal | No compatible | Formato aceptado en carga electrónica |
| Reforma pensión | No aplica | Campos **92–95** obligatorios desde ago-2025 |

`PREVIRED-REM-v1` se mantiene como trazabilidad/auditoría interna ERP. La descarga **subible a Previred** corresponde a fase **PREVIRED-02**.

## Reglas de formato (PDF)

- Extensión: `.txt` (también aceptan CSV/ZIP en portal; generamos `.txt`).
- **Numéricos**: enteros, alineados a la derecha, relleno con ceros a la izquierda.
- **Alfanuméricos**: alineados a la izquierda, relleno con espacios a la derecha.
- **Tasas** `99,99`: 5 caracteres con coma decimal (ej. `04,11`).
- **Fechas** mov. personal: `dd-mm-aaaa` o `dd/mm/aaaa` dentro del período.
- **Período** campos 9–10: `mmaaaa` (ej. `072026`).
- **Ningún campo omitido**: si no aplica → ceros (numérico) o blancos (alfanumérico).

Longitud total por registro: **861** posiciones (campo 105 termina en 861).

## Campos nuevos Reforma (desde ago-2025)

| Campo | Posición | Contenido |
|------:|----------|-----------|
| 27 | 175–182 | Renta imponible AFP **/ Seguro Social** (misma base para planilla SS) |
| 28 | 183–190 | Cotización obligatoria AFP = 10% + comisión AFP + **% adicional reforma** |
| 92 | 741–748 | **RIMA** — renta imponible mes anterior proporcional a días con licencia (mov. personal 3 o 6) |
| 93 | 749–756 | **Tipo jornada**: `1` completa, `2` parcial (obligatorio) |
| 94 | 757–764 | Cotización **expectativa de vida** (0,9% empleador, activos régimen AFP) |
| 95 | 765–784 | **Rentabilidad protegida** — uso futuro (blancos hasta ago-2026) |

## Mapeo ERP → archivo (PREVIRED-02)

### Datos trabajador (campos 1–25)

| Campo Previred | Fuente ERP prevista |
|----------------|---------------------|
| 1–2 RUT/DV | Liquidación (`rut`) o ficha persona |
| 3–5 Apellidos/nombres | Ficha empleado (`persona`) — hoy liquidación solo trae nombre completo |
| 6 Sexo | Ficha persona |
| 7 Nacionalidad | Ficha persona |
| 8 Tipo pago | Nómina (`01` remuneraciones mes) |
| 9–10 Período | `nomina_periodo.periodo` → `mmaaaa` |
| 11 Régimen | Contrato / previsión (`AFP`, `INP`, …) |
| 12 Tipo trabajador | Contrato (tabla equivalencia N°5) |
| 13 Días trabajados | `nomina_liquidacion_trabajador.dias_trabajados` |
| 14 Tipo línea | `00` línea principal |
| 15 Mov. personal | Novedades mes (tabla N°7; `0` sin movimiento) |
| 18–25 Asignación familiar | Motor / cargas familiares |
| 93 Tipo jornada | Contrato empleado (`tipo_jornada`) |

### Montos previsionales (campos 26–105)

No van como “líneas de movimiento”. Cada concepto liquidado se agrega al **campo numérico** correspondiente según catálogo ampliado (`campo_archivo_previred`, no solo `codigo_previred`).

Ejemplos:

| Campo | Concepto típico |
|------:|-----------------|
| 27 | Renta imponible AFP |
| 28 | Cotización obligatoria AFP + adicional reforma |
| 29 | SIS (empleador) |
| 70 | Fonasa |
| 75–81 | Isapre |
| 94 | Expectativa de vida |
| 100–102 | Seguro cesantía |

Catálogo `catalogo_previred` actual (PREVIRED-01b) mapea `codigo_lre → codigo_previred` para borrador CSV; **PREVIRED-02b** debe extenderlo a `campo_archivo` (1–105).

## Fases propuestas

| ID | Entregable |
|----|------------|
| **02a** | Motor 105 posiciones + tests longitud/padding (`previred-archivo-105-posicion.rules.ts`) | ✅ |
| **02b** | Catálogo LRE → campo archivo + reglas agregación montos | ✅ |
| **02c** | Enriquecimiento datos trabajador (persona/contrato vía `vw_persona_factores`) | ✅ |
| **02d** | UI descarga `.txt` oficial + canal BD `archivo_oficial_105_posicion` | ✅ |
| **02e** | Validaciones reforma (RIMA, jornada, expectativa vida) + aptitud previa export | ✅ |

## 02e — Aptitud previa a export (personales y previsionales)

Antes de generar una línea de 105 posiciones, el motor evalúa cada trabajador liquidado con `previred-trabajador-validacion.rules.ts`. **No se rellenan defaults silenciosos** (sexo, AFP `00`, salud genérica).

### Bloqueos (impiden descarga)

| Campo / condición | Mensaje operativo |
|-------------------|-------------------|
| Sin `id_persona` en liquidación | Sin persona vinculada |
| Sin fila en `vw_persona_factores` | Ficha no disponible para Previred |
| RUT inválido | RUT no válido para archivo |
| Apellido paterno / nombres vacíos o placeholder | Falta identificación en ficha |
| Sexo distinto de `M` / `F` | Falta sexo registral |
| Régimen AFP con código `00` | AFP no reconocida |
| Sin `salud_tipo` o código salud `00` | Falta o no reconoce institución de salud |

### Regla de lote

`listoParaEnvio105` es `true` solo si **todos** los trabajadores liquidados generan registro válido (`registros.length === totalLiquidados` y sin advertencias de bloqueo).

### Relación con empleados

- Dotación nómina confía en `persona.apto_para_remuneraciones` (RPC elegibles).
- Aptitud Previred es **más estricta** y se evalúa al exportar desde Liquidaciones.
- El flag apto solo debe quedar `true` tras `evaluarCompletitudYAptitudEmpleado` o `validarFichaParaRemuneraciones` — no por activación masiva ni heurística de origen de creación.

Diagnóstico local: `node scripts/diag-previred-personales.mjs --periodo YYYY-MM`

## Fuera de alcance

- Envío API directo a Previred.
- Formato variable por separador (alternativa del portal; no prioritario).
- Reproceso motor de cálculo reforma (depende nómina/cierre operativo).
