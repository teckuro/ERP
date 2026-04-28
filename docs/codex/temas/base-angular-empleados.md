# Base Angular Tecnica Paso A Paso

Esta guia explica como crear un modulo nuevo en este proyecto Angular tomando `empleados` como referencia, pero partiendo desde un flujo tecnico mas concreto con Angular CLI.

La idea no es copiar literalmente `empleados`, sino usarlo como patron de arquitectura.

## 1. Antes de crear un modulo nuevo

En este proyecto ya existe una base:

- Angular standalone
- `src/app/app.routes.ts` como entrada de rutas
- `src/app/layout/` como shell global
- `src/app/shared/components/ui/` como libreria visual interna
- `src/app/features/empleados/` como mejor ejemplo de feature completa

Regla importante:

- no crear un proyecto Angular nuevo
- no crear un layout paralelo
- no meter logica de dominio en `pages/` si el modulo va a crecer

## 2. Que tipo de modulo vas a crear

Antes de escribir comandos, decidir esto:

- si sera una vista simple: usar `src/app/pages`
- si sera un modulo con listado, alta, ficha, servicios y modelos: usar `src/app/features/<modulo>`

Si quieres replicar el estilo de `empleados`, normalmente estas en el segundo caso.

## 3. Comandos base con Angular CLI

Puedes usar Angular CLI para generar la base y luego adaptar los archivos al patron del repo.

### 3.1 Crear una feature manualmente

En este proyecto conviene crear carpetas de feature manualmente y usar `ng generate` solo para componentes o servicios.

Ejemplo para un modulo `centros-costos`:

```powershell
New-Item -ItemType Directory -Force src/app/features/centros-costos
New-Item -ItemType Directory -Force src/app/features/centros-costos/containers
New-Item -ItemType Directory -Force src/app/features/centros-costos/components
New-Item -ItemType Directory -Force src/app/features/centros-costos/services
New-Item -ItemType Directory -Force src/app/features/centros-costos/models
```

### 3.2 Crear un container standalone con Angular CLI

Para un container de listado:

```powershell
ng generate component features/centros-costos/containers/listado-centros-costos-container --standalone --skip-tests
```

Para un container de creacion:

```powershell
ng generate component features/centros-costos/containers/crear-centro-costo-container --standalone --skip-tests
```

Para un container de ficha:

```powershell
ng generate component features/centros-costos/containers/ficha-centro-costo-container --standalone --skip-tests
```

### 3.3 Crear componentes internos

Ejemplo:

```powershell
ng generate component features/centros-costos/components/tabla-centros-costos --standalone --skip-tests
ng generate component features/centros-costos/components/form-centro-costo --standalone --skip-tests
```

### 3.4 Crear un servicio

```powershell
ng generate service features/centros-costos/services/centros-costos --skip-tests
```

### 3.5 Que ajustar despues de `ng generate`

Angular CLI te crea una base valida, pero en este repo normalmente hay que ajustar:

- nombres de clases
- imports compartidos
- rutas lazy
- mover la logica a `containers`
- dejar los componentes visuales en `components`
- adaptar selectores y nombres al estilo del proyecto

## 4. Estructura esperada del modulo

Despues de generar y ordenar, deberias quedar cerca de algo asi:

```text
src/app/features/centros-costos/
  centros-costos.routes.ts
  containers/
    listado-centros-costos-container/
      listado-centros-costos-container.ts
      listado-centros-costos-container.html
      listado-centros-costos-container.css
    crear-centro-costo-container/
      crear-centro-costo-container.ts
      crear-centro-costo-container.html
      crear-centro-costo-container.css
    ficha-centro-costo-container/
      ficha-centro-costo-container.ts
      ficha-centro-costo-container.html
      ficha-centro-costo-container.css
  components/
    tabla-centros-costos/
      tabla-centros-costos.ts
      tabla-centros-costos.html
      tabla-centros-costos.css
    form-centro-costo/
      form-centro-costo.ts
      form-centro-costo.html
      form-centro-costo.css
  services/
    centros-costos.service.ts
  models/
    centro-costo.model.ts
```

## 5. Crear el archivo de rutas de la feature

Este archivo normalmente se crea manualmente.

Archivo:

`src/app/features/centros-costos/centros-costos.routes.ts`

Contenido base:

```ts
import { Routes } from '@angular/router';

export const centrosCostosRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./containers/listado-centros-costos-container/listado-centros-costos-container').then(
        (m) => m.ListadoCentrosCostosContainer,
      ),
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./containers/crear-centro-costo-container/crear-centro-costo-container').then(
        (m) => m.CrearCentroCostoContainer,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./containers/ficha-centro-costo-container/ficha-centro-costo-container').then(
        (m) => m.FichaCentroCostoContainer,
      ),
  },
];
```

Este patron sale directamente de `src/app/features/empleados/empleados.routes.ts`.

## 6. Registrar la feature en `app.routes.ts`

Despues registrar la feature en:

`src/app/app.routes.ts`

Ejemplo:

```ts
{
  path: 'centros-costos',
  loadChildren: () =>
    import('./features/centros-costos/centros-costos.routes').then(
      (m) => m.centrosCostosRoutes,
    ),
}
```

Si no haces este paso, aunque exista el modulo, Angular no podra navegar a el.

## 7. Convertir el container de listado al patron del proyecto

El container maneja:

- carga
- error
- señales
- navegacion
- breadcrumb
- paso de datos al componente presentacional

Ejemplo tecnico:

```ts
import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import {
  RecordBreadcrumbComponent,
  RecordBreadcrumbItem,
} from '../../../../shared/components/ui/record-breadcrumb.component';
import { TablaCentrosCostosComponent } from '../../components/tabla-centros-costos/tabla-centros-costos';
import { CentroCosto } from '../../models/centro-costo.model';
import { CentrosCostosService } from '../../services/centros-costos.service';

@Component({
  selector: 'app-listado-centros-costos-container',
  standalone: true,
  imports: [CommonModule, RecordBreadcrumbComponent, TablaCentrosCostosComponent],
  templateUrl: './listado-centros-costos-container.html',
  styleUrl: './listado-centros-costos-container.css',
})
export class ListadoCentrosCostosContainer {
  private readonly service = inject(CentrosCostosService);
  private readonly router = inject(Router);

  readonly breadcrumbItems: readonly RecordBreadcrumbItem[] = [{ label: 'Centros de costos' }];
  readonly rows = signal<CentroCosto[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.loadRows();
  }

  async loadRows(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      this.rows.set(await this.service.listar());
    } catch {
      this.errorMessage.set('No fue posible cargar los centros de costos.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async goToCreate(): Promise<void> {
    await this.router.navigate(['/centros-costos/nuevo']);
  }
}
```

## 8. Crear el HTML del container

Este HTML normalmente queda muy simple porque delega la vista al componente hijo:

```html
<section class="space-y-4">
  <app-record-breadcrumb
    [items]="breadcrumbItems"
    title="Centros de costos"
  ></app-record-breadcrumb>

  <app-tabla-centros-costos
    [rows]="rows()"
    [loading]="isLoading()"
    [errorMessage]="errorMessage() ?? ''"
    (createRequested)="goToCreate()"
    (refresh)="loadRows()"
  ></app-tabla-centros-costos>
</section>
```

## 9. Convertir el componente de tabla al patron del proyecto

El componente hijo recibe `@Input()` y emite `@Output()`. No deberia hablar directo con el backend si el modulo sigue el patron de `empleados`.

Ejemplo:

```ts
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import {
  CardComponent,
  CardContentComponent,
  CardHeaderComponent,
} from '../../../../shared/components/ui/card.component';
import { ButtonComponent } from '../../../../shared/components/ui/button.component';
import { CentroCosto } from '../../models/centro-costo.model';

@Component({
  selector: 'app-tabla-centros-costos',
  standalone: true,
  imports: [CommonModule, CardComponent, CardContentComponent, CardHeaderComponent, ButtonComponent],
  templateUrl: './tabla-centros-costos.html',
  styleUrl: './tabla-centros-costos.css',
})
export class TablaCentrosCostosComponent {
  @Input() rows: CentroCosto[] = [];
  @Input() loading = false;
  @Input() errorMessage = '';

  @Output() readonly refresh = new EventEmitter<void>();
  @Output() readonly createRequested = new EventEmitter<void>();
}
```

HTML base:

```html
<app-card>
  <app-card-header className="flex items-center justify-between">
    <div>
      <h2 class="text-sm font-semibold text-gray-900">Listado</h2>
      <p class="text-sm text-gray-500">Administracion de centros de costos</p>
    </div>

    <div class="flex items-center gap-2">
      <app-button variant="outline" (click)="refresh.emit()">Actualizar</app-button>
      <app-button variant="primary" (click)="createRequested.emit()">Nuevo</app-button>
    </div>
  </app-card-header>

  <app-card-content>
    @if (loading) {
      <p class="text-sm text-gray-500">Cargando informacion...</p>
    } @else if (errorMessage) {
      <p class="text-sm text-red-600">{{ errorMessage }}</p>
    } @else if (rows.length === 0) {
      <p class="text-sm text-gray-500">No hay registros.</p>
    } @else {
      <div class="space-y-2">
        @for (row of rows; track row.id) {
          <div class="rounded-md border border-gray-200 px-3 py-2">
            <p class="text-sm font-semibold text-gray-900">{{ row.nombre }}</p>
            <p class="text-xs text-gray-500">{{ row.codigo }}</p>
          </div>
        }
      </div>
    }
  </app-card-content>
</app-card>
```

## 10. Crear un formulario base

Si el modulo tiene creacion o edicion, puedes generar un componente standalone o dejar el formulario dentro del container.

Comando posible:

```powershell
ng generate component features/centros-costos/components/form-centro-costo --standalone --skip-tests
```

Si el formulario sera reutilizado entre crear y editar, conviene extraerlo como hace `empleados` con `form-empleado`.

Ejemplo base de formulario simple:

```ts
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  CardComponent,
  CardContentComponent,
} from '../../../../shared/components/ui/card.component';
import { PageActionsComponent } from '../../../../shared/components/ui/page-actions.component';
import {
  RecordBreadcrumbComponent,
  RecordBreadcrumbItem,
} from '../../../../shared/components/ui/record-breadcrumb.component';

@Component({
  selector: 'app-crear-centro-costo-container',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardComponent,
    CardContentComponent,
    PageActionsComponent,
    RecordBreadcrumbComponent,
  ],
  template: `
    <form class="space-y-4" [formGroup]="form" (ngSubmit)="save()">
      <app-record-breadcrumb
        [items]="breadcrumbItems"
        title="Nuevo centro de costo"
      ></app-record-breadcrumb>

      <app-page-actions
        [showBack]="true"
        [showSave]="true"
        [saveDisabled]="form.invalid"
        [backLink]="'/centros-costos'"
        (saveClick)="save()"
      ></app-page-actions>

      <app-card>
        <app-card-content className="grid gap-4 md:grid-cols-2">
          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium text-gray-700">Codigo</span>
            <input
              formControlName="codigo"
              class="h-10 rounded-md border border-gray-200 px-3 text-sm"
            />
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium text-gray-700">Nombre</span>
            <input
              formControlName="nombre"
              class="h-10 rounded-md border border-gray-200 px-3 text-sm"
            />
          </label>
        </app-card-content>
      </app-card>
    </form>
  `,
})
export class CrearCentroCostoContainer {
  private readonly fb = inject(FormBuilder);

  readonly breadcrumbItems: readonly RecordBreadcrumbItem[] = [
    { label: 'Centros de costos', link: '/centros-costos' },
    { label: 'Nuevo' },
  ];

  readonly form = this.fb.group({
    codigo: ['', Validators.required],
    nombre: ['', Validators.required],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
  }
}
```

## 11. Crear modelos

Los modelos normalmente se crean manualmente.

Archivo:

`src/app/features/centros-costos/models/centro-costo.model.ts`

```ts
export interface CentroCosto {
  id: number;
  codigo: string;
  nombre: string;
}
```

Si el modulo crece, separar:

- `centro-costo.model.ts`
- `centro-costo-listado.model.ts`
- `centro-costo-form.model.ts`
- `centro-costo-payload.model.ts`

Ese patron tambien viene de `empleados`.

## 12. Crear servicios

Comando:

```powershell
ng generate service features/centros-costos/services/centros-costos --skip-tests
```

Ejemplo base:

```ts
import { Injectable } from '@angular/core';

import { CentroCosto } from '../models/centro-costo.model';

@Injectable({ providedIn: 'root' })
export class CentrosCostosService {
  async listar(): Promise<CentroCosto[]> {
    return [
      { id: 1, codigo: 'ADM', nombre: 'Administracion' },
      { id: 2, codigo: 'VEN', nombre: 'Ventas' },
    ];
  }
}
```

Si despues conectas backend, la evolucion natural es:

- `services/` para orquestacion
- `data-access/` para llamadas directas a API o Supabase

## 13. Componentes shared que debes revisar antes de reinventar UI

Antes de crear algo nuevo, revisar:

- `src/app/shared/components/ui/button.component.ts`
- `src/app/shared/components/ui/card.component.ts`
- `src/app/shared/components/ui/page-actions.component.ts`
- `src/app/shared/components/ui/record-breadcrumb.component.ts`
- `src/app/shared/components/ui/data-grid.component.ts`

Regla practica:

- si el componente sirve para varias features, va en `shared`
- si sirve solo para un modulo, queda en la feature

## 14. Checklist tecnico completo

1. Crear carpetas del modulo
2. Generar containers y components con `ng generate`
3. Crear archivo `*.routes.ts`
4. Registrar la feature en `app.routes.ts`
5. Crear modelos
6. Crear servicio
7. Adaptar los componentes generados al patron standalone del repo
8. Reutilizar `shared/components/ui`
9. Agregar el menu si el modulo debe ser navegable desde sidebar
10. Probar navegacion y compilacion

## 15. Comandos utiles juntos

Ejemplo rapido para partir un modulo:

```powershell
New-Item -ItemType Directory -Force src/app/features/centros-costos
New-Item -ItemType Directory -Force src/app/features/centros-costos/containers
New-Item -ItemType Directory -Force src/app/features/centros-costos/components
New-Item -ItemType Directory -Force src/app/features/centros-costos/services
New-Item -ItemType Directory -Force src/app/features/centros-costos/models
ng generate component features/centros-costos/containers/listado-centros-costos-container --standalone --skip-tests
ng generate component features/centros-costos/containers/crear-centro-costo-container --standalone --skip-tests
ng generate component features/centros-costos/components/tabla-centros-costos --standalone --skip-tests
ng generate service features/centros-costos/services/centros-costos --skip-tests
```

## 16. Referencias reales del proyecto

Usar estos archivos como referencia directa:

- `src/app/features/empleados/empleados.routes.ts`
- `src/app/features/empleados/containers/listado-empleados-container/listado-empleados-container.ts`
- `src/app/features/empleados/containers/crear-empleado-container/crear-empleado-container.ts`
- `src/app/features/empleados/containers/ficha-empleado-container/ficha-empleado-container.ts`
- `src/app/features/empleados/components/form-empleado/form-empleado.ts`

Si el modulo nuevo es simple, no copies toda la complejidad de `ficha-empleado` ni de `form-empleado`. Parte desde la base y escala solo cuando el caso lo exija.
