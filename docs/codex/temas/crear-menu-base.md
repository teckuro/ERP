# Crear Menu Base

Este archivo explica como agregar una nueva opcion al menu lateral del ERP.

La referencia actual es:

- `src/app/layout/sidebar.component.ts`
- `src/app/app.routes.ts`

## 1. Como funciona hoy el menu

El sidebar tiene un array local:

```ts
type MenuItem = {
  path: string;
  label: string;
  icon: string;
  exact?: boolean;
};

readonly menuItems: MenuItem[] = [
  { path: '/', label: 'Dashboard', icon: 'layout-dashboard', exact: true },
  { path: '/empleados', label: 'Empleados', icon: 'users' },
];
```

Cada item necesita:

- `path`
- `label`
- `icon`
- `exact` solo si aplica

## 2. Regla importante

No basta con agregar el item al menu.

Tambien hay que asegurarse de que exista una ruta valida en `src/app/app.routes.ts` o en una feature cargada desde ahi.

## 3. Ejemplo simple

Si quieres agregar `Centros de Costos`, editar `src/app/layout/sidebar.component.ts`:

```ts
readonly menuItems: MenuItem[] = [
  { path: '/', label: 'Dashboard', icon: 'layout-dashboard', exact: true },
  { path: '/empleados', label: 'Empleados', icon: 'users' },
  { path: '/centros-costos', label: 'Centros de Costos', icon: 'building-2' },
];
```

Luego registrar la ruta en `src/app/app.routes.ts`.

## 4. Si la vista es una page simple

Agregar una ruta asi:

```ts
{
  path: 'centros-costos',
  loadComponent: () =>
    import('./pages/centros-costos.page').then((m) => m.CentrosCostosPage),
}
```

## 5. Si la vista es una feature

Agregar una ruta asi:

```ts
{
  path: 'centros-costos',
  loadChildren: () =>
    import('./features/centros-costos/centros-costos.routes').then(
      (m) => m.centrosCostosRoutes,
    ),
}
```

## 6. Orden correcto para agregar un modulo al menu

1. Crear la pantalla o feature
2. Registrar la ruta
3. Agregar el item en `sidebar.component.ts`
4. Verificar que el `routerLinkActive` marque el item correcto

## 7. Recomendaciones practicas

- usar labels cortos
- mantener consistencia con los nombres de rutas
- no crear menus duplicados para la misma feature
- usar iconos Lucide ya alineados con el estilo actual
- usar `exact: true` solo para rutas raiz como `/`

## 8. Referencia real

Tomar como ejemplo estos items actuales:

```ts
{ path: '/', label: 'Dashboard', icon: 'layout-dashboard', exact: true },
{ path: '/empleados', label: 'Empleados', icon: 'users' },
{ path: '/haberes-descuentos', label: 'Haberes y Descuentos', icon: 'dollar-sign' },
{ path: '/proceso-remuneraciones', label: 'Proceso Remuneraciones', icon: 'file-text' },
```
