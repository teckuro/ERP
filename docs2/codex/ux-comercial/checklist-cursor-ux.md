# Checklist y tips para Cursor - UX Comercial

## Objetivo

Dar instrucciones practicas a Cursor para mejorar UI/UX sin romper logica ni contratos del ERP.

## Antes de tocar UI

Cursor debe responder internamente:

```txt
1. Que pantalla exacta voy a tocar?
2. Es solo visual/copy/layout o cambia logica?
3. Que estado principal tiene la pantalla?
4. Cual es la siguiente accion del usuario?
5. Que botones estan bloqueados y por que?
6. Que documentos debo leer?
7. Que tests debo actualizar o ejecutar?
```

## Lectura minima

```txt
AGENTS.md
ui-form-guidelines.md
ui-button-guidelines.md
ui-tables.md
estilos/README.md
peticiones-estilos.md
ux-comercial/contrato-diseno-comercial.md
ux-comercial/patrones-pantallas-erp.md
ux-comercial/sistema-estados-acciones.md
```

## Tips concretos

### 1. Mejorar por capas, no redisenar todo

Orden correcto:

```txt
estado principal
-> siguiente accion
-> resumen
-> bloqueos/advertencias
-> detalle
-> tecnico secundario
```

No partir cambiando colores, sombras o padding sin resolver jerarquia.

### 2. Un CTA primario

Cada pantalla debe tener un CTA principal segun estado.

Mal:

```txt
[Validar] [Generar] [Calcular] [Guardar] [Aprobar] todos visibles igual
```

Bien:

```txt
CTA principal: Guardar resultado preliminar
Secundarios: Revisar base, Recalcular, Ver detalle
```

### 3. Mostrar razon de bloqueo

Si un boton esta deshabilitado, debe existir texto cercano:

```txt
No puedes cerrar porque el resultado guardado aun no esta aprobado operativamente.
```

### 4. No ocultar lo tecnico, bajarlo de prioridad

El ERP necesita trazabilidad. No eliminar:

```txt
version calculo
identificador tecnico
fecha generacion
id_calculo_periodo
```

Moverlo a detalle secundario.

### 5. Diseñar empty states reales

Diferenciar:

```txt
sin datos iniciales
sin resultados por filtro
error de carga
estado futuro no implementado
```

### 6. Mantener layout estable

No inflar tarjetas internas para llenar altura.
Resolver altura en contenedor padre.

### 7. Registrar cambios visuales

Si cambia UI/copy visible:

```txt
actualizar docs/codex/peticiones-estilos.md
```

## Errores comunes de Cursor

| Error | Correccion |
|---|---|
| Tocar servicios por una mejora visual | Separar fase UI de fase logica. |
| Poner todos los botones con igual peso | Definir CTA primario. |
| Ocultar bloqueos para que se vea limpio | Mantener bloqueos visibles y accionables. |
| Usar copy tecnico | Traducir a lenguaje RRHH. |
| Redisenar sin tests | Ejecutar minimo build/tests indicados. |
| Crear pantalla compleja en `pages` | Usar feature/container segun contrato. |

## Formato recomendado para pedir cambios a Cursor

```txt
OBJETIVO
Mejorar la jerarquia visual de [pantalla] sin cambiar logica.

ALCANCE
Tocar solo [archivos].

NO TOCAR
Servicios, SQL, RPC, RLS, motor, tests no relacionados.

REGLAS UX
Aplicar estado principal, siguiente accion, resumen, bloqueos y trazabilidad secundaria.

VALIDACION
npx ng test --watch=false
npm run build
Actualizar peticiones-estilos.md si hay cambio visible.
```
