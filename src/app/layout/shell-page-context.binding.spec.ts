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
class HostAComponent {
  private readonly destroyRef = inject(DestroyRef);
  readonly shell = inject(ShellPageContextService);

  constructor() {
    bindShellPageContext(this.destroyRef, () => ({
      breadcrumbs: [{ label: 'Host A' }],
      pageTitle: 'Página A',
    }));
  }
}

@Component({
  standalone: true,
  template: '',
})
class HostBComponent {
  private readonly destroyRef = inject(DestroyRef);
  readonly shell = inject(ShellPageContextService);

  constructor() {
    bindShellPageContext(this.destroyRef, () => ({
      breadcrumbs: [{ label: 'Host B' }],
      pageTitle: 'Página B',
    }));
  }
}

describe('bindShellPageContext', () => {
  it('publica contexto y, al destruir, deja al shell sin dueño', async () => {
    await TestBed.configureTestingModule({
      imports: [HostAComponent],
      providers: [provideRouter([{ path: 'empleados', component: HostAComponent }]), ShellPageContextService],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const shell = TestBed.inject(ShellPageContextService);

    await router.navigateByUrl('/empleados');
    const fixture = TestBed.createComponent(HostAComponent);
    fixture.detectChanges();

    expect(shell.breadcrumbs().map((b) => b.label)).toEqual(['Host A']);

    fixture.destroy();
    await new Promise((r) => setTimeout(r, 0));

    // El helper liberó el token; el shell queda sin dueño (binding inactivo).
    // LayoutShellComponent es quien aplica el fallback de ruta en NavigationEnd;
    // aquí no hay router activo simulando la transición, así que el contexto
    // queda vacío.
    expect(shell.isBindingActive()).toBe(false);
  });

  it('si B se crea antes de que A se destruya, el contexto de B sobrevive (race resuelta)', async () => {
    await TestBed.configureTestingModule({
      imports: [HostAComponent, HostBComponent],
      providers: [
        provideRouter([
          { path: 'a', component: HostAComponent },
          { path: 'b', component: HostBComponent },
        ]),
        ShellPageContextService,
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const shell = TestBed.inject(ShellPageContextService);

    await router.navigateByUrl('/a');
    const fixA = TestBed.createComponent(HostAComponent);
    fixA.detectChanges();
    expect(shell.pageTitle()).toBe('Página A');

    // Simulamos el orden conflictivo del router-outlet: B se crea, luego A se destruye.
    const fixB = TestBed.createComponent(HostBComponent);
    fixB.detectChanges();
    expect(shell.pageTitle()).toBe('Página B');

    fixA.destroy();
    await new Promise((r) => setTimeout(r, 0));

    // El releaseOwnership de A debió ser no-op porque B ya es dueño.
    expect(shell.pageTitle()).toBe('Página B');
    expect(shell.breadcrumbs().map((b) => b.label)).toEqual(['Host B']);
  });

  it('handler primario sólo se invoca mientras el host vive', async () => {
    let invocaciones = 0;

    @Component({ standalone: true, template: '' })
    class HostConHandlerComponent {
      private readonly destroyRef = inject(DestroyRef);
      constructor() {
        bindShellPageContext(
          this.destroyRef,
          () => ({ breadcrumbs: [{ label: 'host' }] }),
          { onPrimaryAction: () => (invocaciones += 1) },
        );
      }
    }

    await TestBed.configureTestingModule({
      imports: [HostConHandlerComponent],
      providers: [provideRouter([]), ShellPageContextService],
    }).compileComponents();

    const shell = TestBed.inject(ShellPageContextService);
    const fixture = TestBed.createComponent(HostConHandlerComponent);
    fixture.detectChanges();

    shell.invokePrimaryAction();
    expect(invocaciones).toBe(1);

    fixture.destroy();
    await new Promise((r) => setTimeout(r, 0));
    shell.invokePrimaryAction();
    // tras destruir, el handler fue limpiado por releaseOwnership.
    expect(invocaciones).toBe(1);
  });
});
