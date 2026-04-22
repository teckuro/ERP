# 🧠 Codex Agent Instructions — ERP UI System

Este proyecto sigue un sistema de diseño ERP enterprise (tipo SAP / Fiori / SaaS profesional).

Codex DEBE leer y respetar estas reglas antes de generar cualquier código HTML/UI.

---

## 📂 Archivos de referencia obligatorios

Antes de generar código, SIEMPRE revisar:

- ./docs/ui-principles.md
- ./docs/form-patterns.md
- ./docs/ui-checklist.md

Estas reglas tienen prioridad sobre cualquier decisión automática.

---

## 🎯 Objetivo de UI

Construir interfaces:
- Claras
- Jerárquicas
- Profesionales
- Sin ruido visual
- Consistentes entre pantallas

---

## 🧱 Layout obligatorio

HEADER (acciones + título)
RESUMEN (contexto del registro)
CONTENIDO PRINCIPAL | SIDEBAR

---

## 📌 Reglas críticas (NO negociables)

### 1. Bloque protagonista
Solo UN foco principal.
El formulario domina.

### 2. Formularios
- 1 columna por defecto
- Máximo 2 columnas si mejora UX
- Labels SIEMPRE arriba
- Prohibido placeholder como label

### 3. Agrupación
- Inputs en cards
- Cada card con título
- No formularios largos sin separación

### 4. Espaciado
Solo usar:
4 / 8 / 12 / 16 / 24 / 32 px

### 5. Jerarquía visual
Nivel 1: contenido
Nivel 2: secciones
Nivel 3: labels

### 6. Sidebar
- Secundario
- Sin protagonismo

### 7. Botones
- Guardar arriba derecha
- No duplicar

### 8. Validaciones
- Error en campo
- Resumen arriba

---

## 🧠 Flujo obligatorio

1. Analizar
2. Proponer layout
3. Generar HTML
4. Refinar

---

## 🚫 Anti-patrones

- Formularios complejos en columnas
- Inputs sin label
- Sidebar dominante
- Cards innecesarias
- Layout plano

---

## ✅ Checklist

- Bloque protagonista ✔
- Jerarquía ✔
- Espaciado ✔
- Formularios claros ✔

---

## ⚡ Reglas del proyecto

- Angular standalone
- Tailwind
- Componentes reutilizables

---

## 🧠 Instrucción final

No improvisar diseño.
Priorizar claridad, orden y jerarquía.
