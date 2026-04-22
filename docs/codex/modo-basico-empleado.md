# Integración Modo Básico - ERP Empleados

## Objetivo

Integrar el modo básico dentro del sistema actual SIN romper:

- layout ERP
- reglas de UI existentes
- form-patterns
- ui-principles

Este archivo complementa las reglas existentes, no las reemplaza.

---

## 📚 Dependencias obligatorias

Antes de aplicar este modo, respetar:

- AGENTS.md :contentReference[oaicite:0]{index=0}
- ui-layout-erp.md :contentReference[oaicite:1]{index=1}
- form-patterns.md :contentReference[oaicite:2]{index=2}
- ui-checklist.md :contentReference[oaicite:3]{index=3}

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

---

## 3. Aplicación del modo básico

### 3.1 Bloque protagonista

Respetar regla:

"Solo un foco principal" :contentReference[oaicite:4]{index=4}

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

Seguir form-patterns.md :contentReference[oaicite:5]{index=5}

Pero aplicar:

### En modo básico:

- 1 columna preferente
- máximo 2 columnas si aplica
- sin agrupaciones innecesarias
- sin cards múltiples

👉 una sola card principal

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

estado = 'BORRADOR'  
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
