# Integración Modo Básico - ERP Empleados

## Objetivo

Integrar el modo básico dentro del sistema actual SIN romper:

- layout ERP
- reglas de UI existentes
- reglas de `ui-form-guidelines.md`

Este archivo complementa las reglas existentes, no las reemplaza.

---

## 📚 Dependencias obligatorias

Antes de aplicar este modo, respetar:

- `AGENTS.md`
- `README.md` (índice en `docs/codex/`)
- `ui-form-guidelines.md`

---

## �  Concepto

El modo básico NO es una pantalla nueva.

Es el mismo flujo existente, pero:

👉 con secciones ocultas  
👉 con validaciones reducidas  
👉 con UI simplificada

---

## 1. Variable de control

Debe existir:

modo: 'basico' | 'avanzado'

---

## 2. Regla principal

👉 El layout NO cambia

Se mantiene:

- breadcrumb izquierda
- título centrado
- botonera arriba derecha
- contenido en card

Implementacion de referencia (fuente de verdad):

- `src/app/features/empleados/components/form-empleado/form-empleado.html`
- Estilos globales para este flujo viven en `src/styles.css` bajo `app-form-empleado { ... }`

---

## 3. Aplicación del modo básico

### 3.1 Bloque protagonista

Respetar la regla de un solo bloque protagonista definida en `ui-form-guidelines.md`.

En modo básico:

👉 el único foco es:
Datos personales

---

## 4. Ocultamiento de secciones

En modo básico:

NO renderizar:

- tabs
- wizard
- sidebar de pasos
- datos laborales
- previsión
- salud
- banco
- remuneración

---

## 5. Formularios

Seguir `ui-form-guidelines.md`.

Pero aplicar:

### En modo básico:

- 1 columna preferente
- máximo 2 columnas si aplica
- sin agrupaciones innecesarias
- sin cards múltiples

👉 una sola card principal

Referencia visual (modo basico):

- El modo basico usa el mismo shell visual del alta completa:
  - `editor-frame` + `content-shell--basic`
  - `summary-identity` (header dentro de card)
  - `app-page-actions` como botonera principal (no duplicar)

---

## 5.1 Patrón de grilla (captura, sin ruido)

En **modo básico**, el objetivo es capturar datos esenciales sin “ruido” visual.
Por defecto **no usar grillas de 8 columnas** para formularios normales de captura.

Reglas:

- **Desktop**: máximo **4 columnas**.
- **Tablet**: **2 columnas**.
- **Móvil**: **1 columna**.
- Mantener el **orden DOM** de los campos (no reordenar por CSS).
- Usar **spans** solo para jerarquía (p.ej. RUT más ancho), sin forzar que una sección “rellene” la pantalla.
- Secciones con pocos campos (2) deben tener **ancho contenido** (`max-width`) y no ocupar todo el ancho disponible.
- Evitar overrides “globales” por contexto (ej. `:host-context(.step-panel--basic) .employee-grid { ... }`) que afecten otras secciones; preferir clases explícitas por bloque/capa (ver `docs/codex/estilos/README.md`).

Referencia de implementación:

- `src/app/features/empleados/components/secciones/datos-personales/datos-personales.css`

Asignación sugerida:

- Identificación legal (4 campos): RUT más ancho; el resto compacto y sin estirar.
- Nombre (3 campos): 3 columnas en desktop, 2 en tablet, 1 en móvil.
- Datos personales (2 campos): 2 columnas y **contenida**.
- Contacto (2 campos): 2 columnas y **contenida** (email puede ocupar 2 cols si aporta legibilidad).

---

## 6. Validaciones

Respetar regla base:

- error en campo
- resumen opcional

Pero limitar a:

✔ required  
✔ formato RUT  
✔ email válido

NO validar:

❌ contrato  
❌ previsión  
❌ remuneración

---

## 7. Botonera

Respetar:

- ubicación: arriba derecha :contentReference[oaicite:6]{index=6}
- no duplicar botones :contentReference[oaicite:7]{index=7}

---

## 8. Guardado

En modo básico:

- solo crear persona
- no crear entidades relacionadas

---

## Estados

estado = 'EN_PROCESO'  
estado_ficha = 'INCOMPLETO'  
apto_para_remuneraciones = false

---

## 9. Post guardado

Redirigir a:

→ ficha completa (modo avanzado)

Mostrar mensaje:

"Empleado creado. Completa la información restante."

---

## 10. Implementación Angular

NO duplicar componentes.

Usar condiciones:

```html
<div *ngIf="modo === 'basico'">
  <!-- datos personales -->
</div>

<div *ngIf="modo === 'avanzado'">
  <!-- flujo completo -->
</div>
```

---

## Cambios de estilos (registro)

Las mejoras visuales aplicadas por petición se registran en:

- [`../../peticiones-estilos.md`](../../peticiones-estilos.md)
