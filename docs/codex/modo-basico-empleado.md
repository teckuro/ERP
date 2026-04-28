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
- `ui-form-guidelines.md`

---

## 🧠 Concepto

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
