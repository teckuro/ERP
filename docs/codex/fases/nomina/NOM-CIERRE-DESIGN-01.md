# NOM-CIERRE-DESIGN-01 - Diseno funcional y tecnico del cierre operativo de nomina

Fecha: 2026-05-10

Tipo: fase documental / diseno funcional y tecnico.

Estado: cerrada documentalmente.

## Objetivo

Cerrar las decisiones funcionales y tecnicas necesarias para implementar despues:

```txt
NOM-CIERRE-01 - Implementar cierre operativo controlado
```

Esta fase no implementa cierre operativo. Solo deja el contrato listo para que la implementacion posterior no improvise reglas, persistencia ni copy visible.

## Punto de partida validado

El ERP ya tiene validado el flujo real authenticated de nomina mensual:

```txt
Preparar nomina
-> validar periodo
-> generar base
-> calcular resultado preliminar
-> guardar resultado preliminar por RPC real
-> consultar snapshot desde BD
-> aprobar operativamente
-> recargar
-> recuperar snapshot/aprobacion desde BD
```

Evidencia consolidada:

- comando: `npx playwright test tests/nomina-mensual.e2e.spec.ts --workers=1`;
- resultado: OK, 1 passed / 1 skipped;
- periodo: `2026-04`;
- snapshot activo: `id_calculo_periodo=11`;
- detalle: 2 trabajadores, 16 conceptos, 12 observaciones, 72 trazas;
- aprobacion: `aprobado_operativamente`;
- duplicados activos: 0.

## Definicion de cierre operativo

El cierre operativo es la accion que congela el snapshot de nomina aprobado operativamente para un periodo, impidiendo recalcular, reemplazar o aprobar otro resultado para ese mismo periodo mientras el cierre este vigente.

El cierre operativo v1 es un estado del snapshot activo aprobado. No es cierre legal ni liquidacion oficial.

## Que no significa

El cierre operativo no:

- emite liquidaciones oficiales;
- genera PDF;
- genera Previred;
- genera LRE;
- genera archivo banco;
- genera asiento contable;
- firma ni envia documentos;
- implementa cierre legal;
- implementa reapertura;
- implementa aprobacion jerarquica;
- implementa roles avanzados.

## Decisiones cerradas

| Decision | Opcion vigente para NOM-CIERRE-01 | Razon |
|---|---|---|
| Persistencia del cierre operativo | Agregar columnas en `nomina_calculo_periodo` | El cierre v1 es un estado del snapshot activo aprobado y sigue el patron `aprobacion_operativa_*`. |
| `periodo_remuneracion.estado` | No tocar en v1 | Ese estado pertenece al contexto de periodo/parametros/carga mensual; el cierre operativo pertenece al snapshot de nomina. |
| Advertencias | No bloquean por defecto; se muestran y registran | El flujo ya separa bloqueos y advertencias. RRHH puede cerrar con advertencias reconocidas si no hay bloqueos impeditivos. |
| Reapertura | No implementar en v1 | Requiere reglas, auditoria, autorizacion y efectos sobre liquidaciones futuras. Debe tener fase propia. |
| Mecanismo de cierre | RPC atomica | La transicion debe validar en BD snapshot activo, aprobado, no reemplazado y no cerrado para evitar condiciones de carrera. |
| Nombre visible | `Cerrar nomina del periodo` | Es claro para RRHH y no promete liquidacion oficial ni salidas legales. |

## Precondiciones funcionales para cerrar

Debe cumplirse todo:

- existe periodo seleccionado valido;
- existe snapshot activo guardado en BD;
- el snapshot activo no esta reemplazado;
- el snapshot activo tiene aprobacion operativa persistida;
- la aprobacion corresponde al `id_calculo_periodo` activo;
- no existe resultado actualizado sin guardar;
- no existen bloqueos impeditivos;
- no existe cierre operativo vigente;
- el usuario tiene sesion Supabase `authenticated`.

Advertencias:

- no bloquean por defecto;
- deben mostrarse antes de confirmar;
- deben quedar registradas en metadata del cierre.

## Acciones bloqueadas despues de cerrar

Mientras exista cierre operativo vigente para el snapshot activo, NOM-CIERRE-01 debe bloquear:

- recalcular nomina del periodo;
- guardar nuevo resultado preliminar;
- reemplazar snapshot activo;
- aprobar otro resultado;
- editar la preparacion como si estuviera abierta.

## Acciones permitidas despues de cerrar

El cierre operativo permite:

- consultar resultado cerrado;
- ver snapshot desde BD;
- ver trabajadores, conceptos, observaciones y trazabilidad;
- ver aprobacion operativa;
- ver cierre operativo;
- continuar a futuras liquidaciones oficiales.

## Contrato tecnico propuesto

Columnas futuras en `nomina_calculo_periodo`:

```sql
cierre_operativo_estado text null,
cierre_operativo_fecha timestamptz null,
cierre_operativo_usuario_id uuid null,
cierre_operativo_usuario_label text null,
cierre_operativo_observacion text null,
cierre_operativo_metadata jsonb not null default '{}'::jsonb
```

CHECK sugerido:

```sql
cierre_operativo_estado is null
or cierre_operativo_estado in ('cerrado_operativamente')
```

RPC propuesta:

```txt
cerrar_nomina_operativa
```

Validaciones atomicas minimas:

- `id_calculo_periodo` existe;
- `periodo` coincide;
- `activo = true`;
- `reemplazado_por is null`;
- `aprobacion_operativa_estado = 'aprobado_operativamente'`;
- `cierre_operativo_estado is null`;
- usuario `authenticated` existe.

Debe fallar si:

- no esta aprobado;
- ya esta cerrado;
- el snapshot fue reemplazado;
- el periodo no coincide;
- no hay sesion `authenticated`.

Permisos esperados:

```sql
REVOKE EXECUTE ON FUNCTION cerrar_nomina_operativa FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION cerrar_nomina_operativa FROM anon;
GRANT EXECUTE ON FUNCTION cerrar_nomina_operativa TO authenticated;
```

No usar `service_role` desde frontend.

## Metadata de cierre

La metadata debe congelar el contexto de decision. Ejemplo:

```json
{
  "periodo": "2026-04",
  "idCalculoPeriodo": 11,
  "versionCalculo": "...",
  "identificadorTecnico": "...",
  "totalTrabajadores": 2,
  "totalHaberes": 0,
  "totalDescuentos": 0,
  "totalLiquido": 0,
  "advertencias": [],
  "notaAlcance": "Cierre operativo. No emite liquidaciones ni genera archivos legales."
}
```

## Contrato UI para NOM-CIERRE-01

Bloque visible futuro:

```txt
Cierre operativo
```

Ubicacion recomendada:

```txt
Despues de Aprobacion operativa y antes de cualquier salida futura.
```

Estados visibles:

- `No disponible`;
- `Disponible para cierre`;
- `Cerrada operativamente`;
- `Cerrada con advertencias`.

Accion visible:

```txt
Cerrar nomina del periodo
```

Helper obligatorio:

```txt
El cierre operativo congela este resultado para continuar con etapas posteriores. No emite liquidaciones ni genera archivos legales.
```

Confirmacion sugerida:

```txt
Vas a cerrar operativamente la nomina de 2026-04.

Esta accion congelara el resultado aprobado y bloqueara nuevos calculos o reemplazos para el periodo mientras no exista un flujo de reapertura.

No se emitiran liquidaciones oficiales.
No se generaran archivos Previred, LRE, banco ni PDF.

Deseas continuar?
```

Botones:

- `Cancelar`;
- `Cerrar nomina del periodo`.

Mensaje de exito:

```txt
Nomina cerrada operativamente.
Este resultado queda congelado para continuar con etapas posteriores. No se emitieron liquidaciones ni archivos legales.
```

## Fuera de alcance respetado

Esta fase no modifica:

- codigo Angular;
- tests;
- SQL;
- RPC;
- RLS;
- migraciones;
- `package.json`;
- configuracion;
- scripts.

No implementa:

- cierre operativo;
- reapertura;
- liquidaciones oficiales;
- PDF;
- Previred;
- LRE;
- banco;
- contabilidad;
- roles avanzados;
- aprobacion jerarquica.

## Criterios de cierre de esta fase

- Definicion de cierre operativo documentada.
- Separacion explicita entre cierre operativo, cierre legal y liquidacion oficial.
- Decisiones 1 a 6 cerradas.
- Contrato tecnico propuesto para NOM-CIERRE-01.
- Contrato UI propuesto para NOM-CIERRE-01.
- `periodo_remuneracion.estado` fuera de alcance de v1.
- Reapertura fuera de alcance de v1.
- Advertencias no bloquean por defecto.
- Cierre recomendado por RPC atomica.
- Roadmap deja siguiente fase como `NOM-CIERRE-01`.

## Siguiente fase

```txt
NOM-CIERRE-01 - Implementar cierre operativo controlado
```
