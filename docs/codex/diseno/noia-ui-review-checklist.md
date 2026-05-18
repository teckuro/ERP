# NOIA — checklist de revisión UI

Fase: `ERP-NOIA-UI-GUARDRAILS-01`  
Usar **antes de cerrar** cualquier tarea que toque HTML/CSS/copy visible.

## Lectura previa (agente)

- [ ] `docs/codex/diseno/noia-ui-manual.md`
- [ ] `docs/codex/diseno/noia-ui-guardrails.md`
- [ ] `docs/codex/diseno/noia-antipatrones-ia.md`
- [ ] `docs/codex/diseno/bitacora-operativa-noia.md`
- [ ] Documento de fase del módulo (si existe)
- [ ] `docs/codex/peticiones-estilos.md` (registrar cambio visual)

## Comprensión en 10 segundos

- [ ] Hay breadcrumb operativo arriba a la izquierda con dominio/flujo/vista en lenguaje de negocio.
- [ ] Se entiende qué pantalla es y qué período/entidad aplica.
- [ ] El estado actual es visible en lenguaje RRHH.
- [ ] Hay **una** acción principal clara.
- [ ] Se ve qué falta o qué sigue sin leer párrafos largos.

## Estructura

- [ ] Tipo de pantalla definido (revisión / cierre / ficha / listado / etc.).
- [ ] El breadcrumb no reemplaza al titulo, no funciona como CTA y no muestra rutas tecnicas.
- [ ] No hay cards innecesarias (regla anti-card aplicada).
- [ ] No hay diagnóstico duplicado en header + centro + bandeja + acta.
- [ ] El layout usa el ancho con intención (sin columnas muertas).

## Reutilización (no inventar)

- [ ] Se usó [`noia-bases-sistema-referencia.md`](./noia-bases-sistema-referencia.md): Creación avanzada (expediente) o Preparar nómina (mesa), según arquetipo.
- [ ] Prefijo CSS del módulo respetado; no paleta ni espaciado “nuevo” sin documentar.

## Tipografía y color

- [ ] Fuente del ERP; sin fuentes nuevas ni títulos tipo landing.
- [ ] Paleta existente; azul solo en foco/CTA (un dominante por zona).
- [ ] Sin colores extravagantes (púrpura, neón, varios azules, `bg-[#…]` arbitrarios).
- [ ] Sin `border-left` grueso genérico, gradientes ni sombras fuertes.

## Espacio

- [ ] Padding/gap en rango compacto (panel ≤16px; sin p-8/gap-12 rutinarios).
- [ ] Sin columnas vacías ni héroes decorativos.
- [ ] Estado + CTA principal visibles sin scroll innecesario en laptop estándar.
- [ ] Sin duplicar el mismo párrafo en varias zonas.

## Copy y datos

- [ ] Sin nombres de tablas, RPC, enums ni errores crudos visibles para RRHH.
- [ ] Códigos técnicos solo en modal/detalle de soporte, si aplica.
- [ ] Sin textos repetidos con la misma intención.

## Acciones

- [ ] Un solo CTA principal por zona para la misma intención.
- [ ] Secundarias agrupadas y visualmente subordinadas.
- [ ] Modales/MessageBox explican qué pasó, qué revisar y qué hacer.

## Técnico / alcance

- [ ] Sin cambios en estilos globales protegidos ni `angular.json` (salvo fase explícita).
- [ ] Sin cambios de `formControlName`, servicios, persistencia o rutas si la fase es solo UI.
- [ ] CSS en componente local; budget respetado o tratado como fase propia.

## Cierre documental

- [ ] Entrada en `peticiones-estilos.md` si hubo cambio visual.
- [ ] Respuesta al usuario indica qué se contrastó con `docs/codex`.
- [ ] Lista de archivos tocados y declaración de no tocados (global, SQL, motor).

## Resultado

Marcar **aprobada** solo si todas las secciones críticas (comprensión, estructura, copy, acciones, técnico) están cubiertas.
