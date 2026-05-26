import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { DataGridComponent } from './data-grid.component';
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
});
