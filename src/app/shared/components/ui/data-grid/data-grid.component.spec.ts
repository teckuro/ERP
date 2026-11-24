import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { DataGridComponent } from './data-grid.component';
import { DataGridRowDetailDirective } from './data-grid.directives';
import type { DataGridColumn } from './data-grid.types';

interface TestRow {
  id: number;
  name: string;
}

const columns: DataGridColumn<TestRow>[] = [
  { id: 'name', header: 'Nombre', field: 'name' },
];

const rows: TestRow[] = Array.from({ length: 30 }, (_item, index) => ({
  id: index + 1,
  name: `Item ${index + 1}`,
}));

describe('DataGridComponent toolbar operativa', () => {
  it('renderiza barra operativa y oculta footer', () => {
    const fixture = TestBed.createComponent(DataGridComponent<TestRow>);
    fixture.componentInstance.columns = columns;
    fixture.componentInstance.rows = rows;
    fixture.componentInstance.toolbarLayout = 'operativa';
    fixture.componentInstance.maxItems = 10;
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.data-grid-toolbar--operativa')).not.toBeNull();
    expect(el.textContent).toContain('Página');
    expect(el.textContent).toContain('Registros por página');
    expect(el.querySelector('.data-grid-footer')).toBeNull();
  });

  it('modo default conserva footer de paginacion', () => {
    const fixture = TestBed.createComponent(DataGridComponent<TestRow>);
    fixture.componentInstance.columns = columns;
    fixture.componentInstance.rows = rows;
    fixture.componentInstance.toolbarLayout = 'default';
    fixture.componentInstance.maxItems = 10;
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.data-grid-toolbar--operativa')).toBeNull();
    expect(el.querySelector('.data-grid-footer')).not.toBeNull();
  });

  it('firstPage y lastPage navegan al inicio y al final', () => {
    const fixture = TestBed.createComponent(DataGridComponent<TestRow>);
    const component = fixture.componentInstance;
    component.columns = columns;
    component.rows = rows;
    component.toolbarLayout = 'operativa';
    component.maxItems = 10;
    fixture.detectChanges();

    component.goToPage(3);
    expect(component.currentPage).toBe(3);

    component.firstPage();
    expect(component.currentPage).toBe(1);

    component.lastPage();
    expect(component.currentPage).toBe(3);
  });

  it('modo servidor usa totalRowCount para paginar sin recortar filas', () => {
    const fixture = TestBed.createComponent(DataGridComponent<TestRow>);
    const component = fixture.componentInstance;
    component.columns = columns;
    component.rows = rows.slice(0, 5);
    component.serverSide = true;
    component.totalRowCount = 120;
    component.toolbarLayout = 'operativa';
    component.maxItems = 10;
    fixture.detectChanges();

    expect(component.pagedRows.length).toBe(5);
    expect(component.totalPages).toBe(12);
    expect(component.rangeEnd).toBe(10);
  });

  it('modo servidor emite serverQueryChange al cambiar de página', () => {
    const fixture = TestBed.createComponent(DataGridComponent<TestRow>);
    const component = fixture.componentInstance;
    component.columns = columns;
    component.rows = rows.slice(0, 10);
    component.serverSide = true;
    component.totalRowCount = 120;
    component.maxItems = 10;
    fixture.detectChanges();

    const emitted: unknown[] = [];
    component.serverQueryChange.subscribe((query) => emitted.push(query));

    component.nextPage();

    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toMatchObject({ page: 2, pageSize: 10 });
  });
});

// ---------------------------------------------------------------------------
// Filas expandibles (opt-in)
// ---------------------------------------------------------------------------

@Component({
  standalone: true,
  imports: [DataGridComponent, DataGridRowDetailDirective],
  template: `
    <app-data-grid
      [columns]="columns"
      [rows]="rows"
      [expandableRows]="true"
      [rowExpansionKey]="rowKeyFn"
    >
      <ng-template appDataGridRowDetail let-row let-i="index">
        <div class="detalle-test" [attr.data-row-id]="row.id">
          Detalle de {{ row.name }} (índice {{ i }})
        </div>
      </ng-template>
    </app-data-grid>
  `,
})
class HostExpandableComponent {
  columns = columns;
  rows = rows.slice(0, 5);
  rowKeyFn = (row: TestRow) => row.id;
  @ViewChild(DataGridComponent) grid!: DataGridComponent<TestRow>;
}

describe('DataGridComponent · filas expandibles', () => {
  it('expansionEnabled es false cuando no se proyecta appDataGridRowDetail', () => {
    const fixture = TestBed.createComponent(DataGridComponent<TestRow>);
    const cmp = fixture.componentInstance;
    cmp.columns = columns;
    cmp.rows = rows.slice(0, 3);
    cmp.expandableRows = true;
    fixture.detectChanges();
    expect(cmp.expansionEnabled).toBe(false);
  });

  it('expansionEnabled es true cuando se habilita el flag Y se proyecta el template', () => {
    const fixture = TestBed.createComponent(HostExpandableComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.grid.expansionEnabled).toBe(true);
  });

  it('toggleRowExpansion alterna estado y emite evento', () => {
    const fixture = TestBed.createComponent(HostExpandableComponent);
    fixture.detectChanges();
    const grid = fixture.componentInstance.grid;
    const eventos: Array<{ row: TestRow; expanded: boolean }> = [];
    grid.rowExpandToggle.subscribe((evt) => eventos.push(evt));

    const fila = fixture.componentInstance.rows[0];
    expect(grid.isRowExpanded(fila)).toBe(false);

    grid.toggleRowExpansion(fila);
    expect(grid.isRowExpanded(fila)).toBe(true);
    expect(eventos.at(-1)).toEqual({ row: fila, expanded: true });

    grid.toggleRowExpansion(fila);
    expect(grid.isRowExpanded(fila)).toBe(false);
    expect(eventos.at(-1)).toEqual({ row: fila, expanded: false });
  });

  it('collapseRowExpansion no emite si la fila no estaba expandida', () => {
    const fixture = TestBed.createComponent(HostExpandableComponent);
    fixture.detectChanges();
    const grid = fixture.componentInstance.grid;
    const eventos: Array<{ row: TestRow; expanded: boolean }> = [];
    grid.rowExpandToggle.subscribe((evt) => eventos.push(evt));

    grid.collapseRowExpansion(fixture.componentInstance.rows[0]);
    expect(eventos).toHaveLength(0);
  });

  it('collapseAllExpansions vacía el estado para todas las filas', () => {
    const fixture = TestBed.createComponent(HostExpandableComponent);
    fixture.detectChanges();
    const grid = fixture.componentInstance.grid;
    const filas = fixture.componentInstance.rows;

    grid.toggleRowExpansion(filas[0]);
    grid.toggleRowExpansion(filas[1]);
    expect(grid.isRowExpanded(filas[0])).toBe(true);
    expect(grid.isRowExpanded(filas[1])).toBe(true);

    grid.collapseAllExpansions();
    expect(grid.isRowExpanded(filas[0])).toBe(false);
    expect(grid.isRowExpanded(filas[1])).toBe(false);
  });

  it('rowExpansionKey personalizada permite preservar expansión entre datasets', () => {
    const fixture = TestBed.createComponent(HostExpandableComponent);
    fixture.detectChanges();
    const grid = fixture.componentInstance.grid;

    grid.toggleRowExpansion(fixture.componentInstance.rows[2]);
    expect(grid.isRowExpanded(fixture.componentInstance.rows[2])).toBe(true);

    // Otro objeto con el mismo `id` se considera la misma fila gracias a rowExpansionKey: row.id.
    const filaConMismoId: TestRow = { id: 3, name: 'Item 3 (otra ref)' };
    expect(grid.isRowExpanded(filaConMismoId)).toBe(true);
  });

  it('rowDetailContext provee row, índice y closure collapse', () => {
    const fixture = TestBed.createComponent(HostExpandableComponent);
    fixture.detectChanges();
    const grid = fixture.componentInstance.grid;
    const fila = fixture.componentInstance.rows[0];

    grid.toggleRowExpansion(fila);
    expect(grid.isRowExpanded(fila)).toBe(true);

    const ctx = grid.rowDetailContext(fila, 0);
    expect(ctx.$implicit).toBe(fila);
    expect(ctx.row).toBe(fila);
    expect(ctx.index).toBe(0);

    ctx.collapse();
    expect(grid.isRowExpanded(fila)).toBe(false);
  });

  it('colspan del detalle considera numeración + chevron + columnas', () => {
    const fixture = TestBed.createComponent(HostExpandableComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.grid.rowDetailColspan).toBe(3);
  });
});

@Component({
  standalone: true,
  imports: [DataGridComponent, DataGridRowDetailDirective],
  template: `
    <app-data-grid
      [columns]="columns"
      [rows]="rows"
      [expandableRows]="true"
      [expandAnchorColumnId]="'name'"
      [rowExpansionKey]="rowKeyFn"
      [expandHint]="{ text: 'Hint de prueba', visible: true }"
      (expandHintDismiss)="onHintDismiss()"
    >
      <ng-template appDataGridRowDetail let-row>
        <div class="detalle-test">{{ row.name }}</div>
      </ng-template>
    </app-data-grid>
  `,
})
class HostExpandableMergedComponent {
  columns = columns;
  rows = rows.slice(0, 5);
  rowKeyFn = (row: TestRow) => row.id;
  hintDismissed = false;
  @ViewChild(DataGridComponent) grid!: DataGridComponent<TestRow>;

  onHintDismiss(): void {
    this.hintDismissed = true;
  }
}

describe('DataGridComponent · expand anclado e hint', () => {
  it('expandColumnMerged oculta columna dedicada y reduce colspan', () => {
    const fixture = TestBed.createComponent(HostExpandableMergedComponent);
    fixture.detectChanges();
    const grid = fixture.componentInstance.grid;
    expect(grid.expandColumnMerged).toBe(true);
    expect(grid.expandColumnDedicated).toBe(false);
    expect(grid.rowDetailColspan).toBe(2);
  });

  it('expandHintDismiss emite al cerrar el callout', () => {
    const fixture = TestBed.createComponent(HostExpandableMergedComponent);
    fixture.detectChanges();
    const grid = fixture.componentInstance.grid;
    grid.onExpandHintDismiss(new Event('click'));
    expect(fixture.componentInstance.hintDismissed).toBe(true);
  });

  it('shouldShowExpandHint solo en la primera fila', () => {
    const fixture = TestBed.createComponent(HostExpandableMergedComponent);
    fixture.detectChanges();
    const grid = fixture.componentInstance.grid;
    expect(grid.shouldShowExpandHint(0)).toBe(true);
    expect(grid.shouldShowExpandHint(1)).toBe(false);
  });

  it('expandHint renderiza un solo callout con chevron anclado en varias filas', () => {
    const fixture = TestBed.createComponent(HostExpandableMergedComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const hints = root.querySelectorAll('.data-grid-table-view .data-grid-expand-hint');
    expect(hints.length).toBe(1);
  });
});

describe('DataGridComponent selección bloqueada (opt-in)', () => {
  interface Row {
    id: number;
    locked: boolean;
  }

  const columns: DataGridColumn<Row>[] = [{ id: 'id', header: 'Id', field: 'id' }];
  const rows: Row[] = [
    { id: 1, locked: false },
    { id: 2, locked: true },
  ];

  it('no permite seleccionar filas bloqueadas y las muestra marcadas', () => {
    const fixture = TestBed.createComponent(DataGridComponent<Row>);
    const component = fixture.componentInstance;
    component.columns = columns;
    component.rows = rows;
    component.selectable = true;
    component.isRowSelectionDisabled = (row) => row.locked;
    component.isRowSelectionLockedChecked = (row) => row.locked;
    fixture.detectChanges();

    const locked = rows[1]!;
    const enabled = rows[0]!;

    expect(component.isRowSelectionCheckboxChecked(locked)).toBe(true);
    expect(component.isRowSelectionCheckboxDisabled(locked)).toBe(true);

    component.toggleRowSelection(locked, { target: { checked: false } } as unknown as Event);
    expect(component.isRowSelected(locked)).toBe(false);
    expect(component.isRowSelectionCheckboxChecked(locked)).toBe(true);

    component.toggleRowSelection(enabled, { target: { checked: true } } as unknown as Event);
    expect(component.selectedRows).toEqual([enabled]);
  });

  it('seleccionar página ignora filas bloqueadas', () => {
    const fixture = TestBed.createComponent(DataGridComponent<Row>);
    const component = fixture.componentInstance;
    component.columns = columns;
    component.rows = rows;
    component.selectable = true;
    component.isRowSelectionDisabled = (row) => row.locked;
    component.isRowSelectionLockedChecked = (row) => row.locked;
    fixture.detectChanges();

    component.togglePageSelection({ target: { checked: true } } as unknown as Event);
    expect(component.selectedRows.map((row) => row.id)).toEqual([1]);
  });
});

describe('DataGridComponent barra masiva', () => {
  interface Row {
    id: number;
  }

  const columns: DataGridColumn<Row>[] = [{ id: 'id', header: 'Id', field: 'id' }];
  const rows: Row[] = [{ id: 1 }, { id: 2 }];

  it('resume selección con copy singular y plural', () => {
    const fixture = TestBed.createComponent(DataGridComponent<Row>);
    const component = fixture.componentInstance;
    component.columns = columns;
    component.rows = rows;
    component.selectable = true;
    component.selectionLabel = 'trabajadores';
    fixture.detectChanges();

    component.toggleRowSelection(rows[0]!, { target: { checked: true } } as unknown as Event);
    expect(component.bulkSelectionSummary).toBe('trabajador seleccionado en esta página');

    component.toggleRowSelection(rows[1]!, { target: { checked: true } } as unknown as Event);
    expect(component.bulkSelectionSummary).toBe('2 trabajadores seleccionados en esta página');
  });

  it('emite bulkAction sin confirmación cuando skipConfirm es true', () => {
    const fixture = TestBed.createComponent(DataGridComponent<Row>);
    const component = fixture.componentInstance;
    component.columns = columns;
    component.rows = rows;
    component.selectable = true;
    component.bulkActions = [
      { id: 'custom', label: 'Asignar', skipConfirm: true },
    ];
    fixture.detectChanges();

    const emitSpy = vi.spyOn(component.bulkAction, 'emit');
    component.toggleRowSelection(rows[0]!, { target: { checked: true } } as unknown as Event);
    component.requestBulkAction({ id: 'custom', label: 'Asignar', skipConfirm: true });

    expect(component.pendingBulkAction).toBeNull();
    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'custom',
        rows: [rows[0]],
        label: 'Asignar',
        scope: 'page',
      }),
    );
  });
});
