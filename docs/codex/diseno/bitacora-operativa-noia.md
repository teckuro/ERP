# Bitacora Operativa NOIA

## Estado

Fase: `ERP-NOIA-BITACORA-OPERATIVA-00`.

Tipo: documental, decision de producto y diseno UX. No implementa cambios de codigo, rutas, estilos globales, servicios, SQL, motor ni persistencia.

## 1. Que es NOIA

`NOIA` significa `No parecer IA`.

No rechaza el uso de IA como herramienta. Define una regla de producto: la interfaz no debe sentirse generica, decorativa, artificial ni como plantilla administrativa producida sin criterio de negocio.

NOIA exige que cada pantalla tenga una razon operativa clara:

- que esta pasando;
- que falta;
- que esta listo;
- que no aplica;
- que accion sigue;
- que queda trazado.

## 2. Que es Bitacora Operativa

La identidad global del ERP queda definida como:

```txt
ERP de remuneraciones como Bitacora Operativa del periodo
```

Frase guia:

```txt
Registrar, revisar, preparar y cerrar remuneraciones con trazabilidad.
```

La aplicacion debe sentirse como una herramienta que acompana el ciclo mensual de remuneraciones, no como una coleccion de modulos CRUD.

## Gramatica de maquetacion

La Bitacora Operativa no se construye con cards repetidas. Se construye con estado visible, fuente de verdad clara, accion recomendada, riesgo explicito, decision confirmada y registros contextualizados.

Antes de agregar un bloque visual, evaluar si corresponde franja operativa, registro de bitacora, panel dividido, linea de estado, lista de revision, bloque editorial, tabla contextual, MessageBox, disclosure o card justificada.

Regla: no todo necesita una card.
## 3. Principios de diseno

- Estado antes que decoracion.
- Accion siguiente antes que dashboard estetico.
- Pendientes claros antes que listas largas.
- Trazabilidad secundaria antes que ruido tecnico.
- Lenguaje RRHH antes que lenguaje de sistema.
- Densidad compacta, pero respirable.
- Color funcional, no ornamental.
- Una accion principal por zona.
- Modulos conectados por el ciclo del periodo.

## 4. Personalidad visual

El ERP debe sentirse:

- claro;
- sobrio;
- administrativo;
- chileno;
- confiable;
- trazable;
- guiado;
- compacto;
- profesional;
- humano.

No debe sentirse:

- generico;
- futurista;
- infantil;
- excesivamente corporativo;
- decorativo;
- tecnico para el usuario final;
- como plantilla de dashboard.

## 5. Paleta recomendada

Esta paleta es recomendacion documental. No se aplica globalmente en esta fase.

```css
--erp-bg: #F6F7F4;
--erp-surface: #FFFFFF;
--erp-surface-soft: #FAFAF7;
--erp-border: #DADFD7;
--erp-border-strong: #C7D0C4;

--erp-ink: #172033;
--erp-muted: #647084;
--erp-subtle: #8A94A6;

--erp-primary: #2563EB;
--erp-primary-hover: #1D4ED8;
--erp-primary-soft: #EFF6FF;
--erp-primary-border: #BFDBFE;

--erp-review: #A16207;
--erp-review-soft: #FFFBEB;
--erp-review-border: #FDE68A;

--erp-ok: #166534;
--erp-ok-soft: #F0FDF4;
--erp-ok-border: #BBF7D0;

--erp-danger: #B91C1C;
--erp-danger-soft: #FEF2F2;
--erp-danger-border: #FECACA;

--erp-info: #1E40AF;
--erp-info-soft: #EFF6FF;
--erp-info-border: #BFDBFE;
```

## 6. Tipografia recomendada

Mantener por ahora la fuente de sistema ya documentada en `ui-form-guidelines.md`.

No cambiar fuente en esta fase.

Escala recomendada para fases futuras:

| Elemento | Tamano |
|---|---:|
| Titulo principal | 20px - 22px |
| Titulo de vista o paso | 17px - 18px |
| Titulo de seccion | 14px - 15px |
| Texto base | 13px - 14px |
| Label | 12px |
| Ayuda | 12px |
| Badge | 11px |
| Tabla | 12px - 13px |
| Boton | 13px |

Exploracion futura permitida: evaluar `IBM Plex Sans` como fuente institucional/tecnica. No implementarla sin fase explicita.

## 7. Reglas de color

- Azul: accion principal, foco, navegacion activa.
- Ambar: revision administrativa, advertencias, pendiente relevante.
- Verde: listo, apto, coherente, cerrado correctamente.
- Rojo: bloqueo real, error o accion destructiva.
- Gris: estructura, separadores, fondos, texto secundario.

No usar color solo para decorar. No usar azul para todos los estados.

## 8. Reglas de cards

Usar cards solo si agrupan informacion real o una accion operativa.

Evitar:

- cards decorativas;
- cards dentro de cards;
- cards para cada dato pequeno;
- muchas cards con el mismo peso;
- sombras fuertes;
- barras laterales fuertes como `border-left: 3px solid #2563EB`.

Preferir:

- superficies con borde neutro;
- cabeceras compactas;
- separacion por jerarquia;
- secciones con proposito;
- densidad equilibrada.

## 9. Reglas de botones

Regla:

```txt
Una accion principal clara por zona.
```

| Tipo | Uso |
|---|---|
| Primario | Accion principal del momento. |
| Secundario | Volver, revisar, refrescar, navegar. |
| Peligro | Anular, eliminar, rechazar. |
| Fantasma/texto | Acciones menores o detalle. |

Evitar botones azules para acciones secundarias, CTAs duplicados y acciones futuras como primarias.

## 10. Reglas de badges

Usar badges para estados relevantes, no para llenar espacio.

Estados recomendados:

```txt
En edicion
Requiere datos
Listo
Revisar
Solo si aplica
No requerido
Pendiente de cierre
Cerrado
Apto
Bloqueado
```

Evitar estados planos sin contexto: `Actual`, `Completado`, `No disponible`, `OK`, `Error`.

## 11. Reglas de empty states

Un empty state debe responder:

- que no hay;
- por que no hay;
- que puede hacer el usuario.

Ejemplo:

```txt
No hay movimientos registrados.

Todavia no se han registrado bonos, descuentos, anticipos, ausencias o ajustes para el periodo activo.

Registrar movimiento
```

## 12. Reglas de tablas

Las tablas deben mostrar informacion operativa, no estructura tecnica.

Reglas:

- columnas utiles para RRHH;
- estados humanos;
- acciones visibles y acotadas;
- filtros compactos;
- empty states utiles;
- no mostrar IDs tecnicos salvo que sean referencia funcional;
- diferenciar catalogo de aplicacion.

## 13. Plantillas de pantalla

### A. Mesa operativa

Para Dashboard y Preparar nomina.

```txt
Contexto del periodo
Titulo operativo
Estado actual
Siguiente accion recomendada
Pendientes para avanzar
Datos clave del periodo
Accesos relevantes
Trazabilidad secundaria
```

Objetivo: ayudar al usuario a decidir que hacer ahora.

### B. Registro / listado

Para Empleados, Movimientos de remuneracion, Conceptos y Licencias medicas.

```txt
Titulo
Descripcion operativa
Accion principal
Filtros
Resumen
Listado
Empty state / tabla
Acciones por fila
```

Objetivo: buscar, registrar, revisar y actuar.

### C. Expediente

Para Ficha empleado y Creacion avanzada.

```txt
Identidad del trabajador
Estado de ficha
Registros
Pendientes
Datos principales
Historial / revision
Acciones
```

Objetivo: entender el estado completo de una persona o alta.

### D. Registro normativo

Para Parametros.

```txt
Periodo activo
Estado de datos oficiales
Referencia / fuente
Tabs por tipo de parametro
Edicion controlada
Ultima actualizacion
Alertas de faltantes
```

Objetivo: mantener trazables los datos que habilitan el calculo.

### E. Salida / acta

Para Liquidaciones oficiales y Reportes.

```txt
Estado de salida
Condicion requerida
Resumen ejecutivo
Trabajadores incluidos
Bloqueos / advertencias
Trazabilidad interna
Acciones disponibles
```

Objetivo: mostrar que salida existe, que falta para generarla y que trazabilidad queda.

## 14. Gramatica por modulo

| Modulo actual | Concepto UX recomendado | Idea |
|---|---|---|
| Dashboard | Mesa del periodo | Vista de entrada para saber que hacer ahora. |
| Preparar nomina | Bitacora del periodo | Flujo operativo para validar, revisar y preparar. |
| Empleados | Registro laboral | Base de trabajadores y estado de sus fichas. |
| Creacion avanzada | Bitacora laboral | Alta guiada como expediente en construccion. Implementacion de referencia: [`noia-bases-sistema-referencia.md`](./noia-bases-sistema-referencia.md) (`form-empleado.css`, `--bitacora-*`). |
| Ficha empleado | Expediente del trabajador | Datos, estado y trazabilidad de la persona. |
| Movimientos del mes | Movimientos de remuneracion | Registros del periodo que impactan remuneracion. |
| Asignaciones recurrentes | Movimientos de remuneracion | Vista recurrente del mismo concepto funcional. |
| Conceptos de remuneracion | Catalogo maestro de conceptos | Que conceptos existen y como se clasifican. |
| Parametros | Registro normativo | Valores legales y configuracion por periodo/vigencia. |
| Liquidaciones oficiales | Acta de salida interna | Salida generada desde nomina cerrada. |
| Reportes | Vistas operativas | Consultas de trabajo, no salidas formales definitivas. |
| Licencias medicas | Control de ausencias | Seguimiento e impacto operativo. |

Estos nombres son primero conceptos internos/documentales. No cambiar textos visibles ni rutas sin fase de implementacion.

## 15. Decision sobre Movimientos de remuneracion

Problema actual:

```txt
Movimientos del mes
Asignaciones recurrentes
```

Ambos representan registros que impactan la remuneracion de un trabajador. La diferencia real es temporal:

| Alcance | Descripcion |
|---|---|
| Del periodo | Movimiento puntual que afecta solo el periodo activo. |
| Recurrente | Movimiento que se repite o tiene vigencia por rango. |

Decision recomendada:

```txt
Unificar ambos en una sola experiencia visible: Movimientos de remuneracion.
```

Vistas internas sugeridas:

```txt
Del periodo
Recurrentes
Todos
```

Regla de producto:

```txt
Todo registro aplicado a un trabajador que afecte remuneracion debe vivir en Movimientos de remuneracion.
```

La diferencia se modela como:

```txt
Alcance = Del periodo | Recurrente
```

No implementar esta unificacion en esta fase.

## 16. Diferencia entre conceptos y movimientos

Conceptos de remuneracion responde:

```txt
Que conceptos existen en el sistema?
```

Ejemplos: Sueldo base, Gratificacion, Horas extra, Colacion, Movilizacion, AFP, Salud, Seguro de Cesantia, Impuesto unico.

Caracteristicas:

- catalogo maestro;
- define tipo;
- define si es asignable;
- define si es automatico/manual;
- define vigencia;
- puede mapear a LRE;
- no representa un pago especifico a una persona.

Movimientos de remuneracion responde:

```txt
Que se aplicara o considerara para un trabajador en el periodo?
```

Ejemplos:

```txt
Juan Perez - Bono responsabilidad - $50.000 - Mayo 2026
Ana Torres - Colacion - $60.000 - Recurrente desde mayo
Pedro Rojas - Anticipo - $80.000 - Mayo 2026
```

Caracteristicas:

- aplica a trabajador;
- tiene periodo o vigencia;
- tiene monto, cantidad o regla;
- tiene estado;
- puede ser puntual o recurrente;
- puede requerir aprobacion;
- impacta preparacion de nomina.

Regla visual:

```txt
Catalogo = definicion del concepto
Movimiento = aplicacion del concepto
```

## 17. Menu recomendado

Menu actual:

```txt
Dashboard
Empleados
Preparar nomina
Movimientos del mes
Asignaciones recurrentes
Liquidaciones oficiales
Conceptos de remuneracion
Licencias medicas
Reportes
Parametros
```

Menu recomendado futuro:

```txt
Dashboard
Empleados
Preparar nomina
Movimientos de remuneracion
Liquidaciones oficiales
Conceptos de remuneracion
Licencias medicas
Reportes
Parametros
```

Menu conceptual futuro por bloques:

```txt
Inicio
- Dashboard

Personas
- Empleados
- Licencias medicas

Remuneraciones
- Preparar nomina
- Movimientos de remuneracion
- Liquidaciones oficiales
- Conceptos de remuneracion

Administracion
- Parametros
- Reportes
```

No implementar este reordenamiento en esta fase.

## 18. Fases futuras

### NOM-MOVIMIENTOS-UNIFICADOS-UX-01

Crear experiencia visible `Movimientos de remuneracion` con tabs `Del periodo`, `Recurrentes` y `Todos`.

Restricciones sugeridas:

- sin motor;
- sin SQL destructivo;
- sin migracion de datos;
- sin cambiar calculo;
- conservar servicios internos si conviene.

### ERP-SHELL-BITACORA-OPERATIVA-01

Aplicar identidad global al marco comun: sidebar, header, breadcrumbs, titulos, botones, cards base, badges, empty states, tablas y estados.

No redisenar todos los modulos en una sola fase.

### NOM-BITACORA-PERIODO-UX-01

Aplicar Bitacora Operativa al corazon mensual: Dashboard, Preparar nomina, Movimientos de remuneracion y Liquidaciones oficiales.

### EMP-EXPEDIENTE-LABORAL-UX-01

Extender la logica de expediente a listado de empleados, ficha, creacion avanzada, errores de carga, estados y continuidad de alta.

## 19. Que no se debe hacer

No hacer en fases NOIA/Bitacora:

- cambiar rutas sin fase explicita;
- fusionar tablas sin contrato;
- mezclar Conceptos con Movimientos;
- activar motor o salidas legales;
- mostrar lenguaje tecnico a RRHH;
- usar dashboard decorativo sin accion real;
- agregar gradientes, sombras pesadas u orbs;
- usar cards repetidas sin jerarquia;
- usar azul para todo;
- crear modulos duplicados por nombre.

## 20. Checklist para futuras fases

Antes de implementar una fase visual, validar:

- La pantalla responde que pasa, que falta, que sigue y que queda trazado.
- Existe una accion principal clara.
- El lenguaje es RRHH/operativo.
- Los estados son humanos y derivados de negocio.
- Las cards tienen proposito.
- Los empty states indican causa y accion.
- Las tablas no muestran ruido tecnico.
- No se mezclan catalogo y aplicacion.
- No se agregan rutas, SQL, motor o persistencia fuera de alcance.
- El cambio queda documentado en `docs/codex`.

## 21. Restricciones de esta fase

Esta fase no modifica:

- Angular funcional;
- TypeScript funcional;
- HTML/CSS productivo;
- SQL/RPC/RLS;
- motor;
- nomina;
- liquidaciones;
- persistencia;
- rutas;
- guards;
- configuracion Angular/Tailwind/PostCSS;
- estilos globales protegidos.

## 22. Fuentes relacionadas

- `docs/codex/AGENTS.md`
- `docs/codex/ui-form-guidelines.md`
- `docs/codex/ui-button-guidelines.md`
- `docs/codex/ui-tables.md`
- `docs/codex/orquestador/contexto-proyecto.md`
- `docs/codex/orquestador/estado-fases.md`
- `docs/codex/modulos/empleados/README.md`
- `docs/codex/modulos/empleados/creacion-avanzada.md`
- `docs/codex/modulos/nomina-mensual/README.md`
- `docs/codex/modulos/movimientos-variables/README.md`
- `docs/codex/modulos/haberes-descuentos/README.md`
- `docs/codex/modulos/liquidaciones-oficiales/README.md`
- `docs/codex/modulos/parametros/README.md`


## Herramientas de contexto liviano

La fase `ERP-CONTEXT-OPTIMIZATION-01` agrega soporte para trabajar con menos tokens sin perder contrato visual:

- `docs/codex/contexto-rapido.md` resume fuente de verdad, restricciones y decisiones recientes.
- `.cursor/rules/erp-ui-noia.mdc` vuelve persistente el criterio NOIA para tareas UI.
- `.cursor/rules/erp-protected-files.mdc` protege estilos globales, configuraci�n, SQL, motor y persistencia cr�tica.
- `scripts/build-context-pack.ps1` permite generar paquetes peque�os de documentaci�n y archivos puntuales por fase.

Estas herramientas no reemplazan este documento rector; lo hacen m�s f�cil de aplicar en fases cortas.
