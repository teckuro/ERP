import { Component, DestroyRef, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { bindShellPageContext } from './shell-page-context.binding';
import { ShellPageContextService } from './shell-page-context.service';

@Component({
  standalone: true,
  template: '',
})
class HostWithBindingComponent {
  private readonly destroyRef = inject(DestroyRef);
  readonly shell = inject(ShellPageContextService);

  constructor() {
    bindShellPageContext(this.destroyRef, () => ({
      breadcrumbs: [{ label: 'Prueba explícita' }],
    }));
  }
}

describe('bindShellPageContext', () => {
  it('publica contexto y restaura fallback al destruir el host', async () => {
    await TestBed.configureTestingModule({
      imports: [HostWithBindingComponent],
      providers: [provideRouter([{ path: 'empleados', component: HostWithBindingComponent }]), ShellPageContextService],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const shell = TestBed.inject(ShellPageContextService);

    await router.navigateByUrl('/empleados');
    const fixture = TestBed.createComponent(HostWithBindingComponent);
    fixture.detectChanges();

    expect(shell.breadcrumbs().map((b) => b.label)).toEqual(['Prueba explícita']);

    fixture.destroy();
    await new Promise((r) => setTimeout(r, 0));

    expect(shell.breadcrumbs().map((b) => b.label)).toEqual(['Empleados']);
  });
});
