import { describe, expect, it, beforeEach } from 'vitest';

import { ShellPageContextService, type ShellPageContext } from './shell-page-context.service';

const ctxA: ShellPageContext = {
  breadcrumbs: [{ label: 'A' }],
  pageTitle: 'Página A',
};

const ctxB: ShellPageContext = {
  breadcrumbs: [{ label: 'B' }],
  pageTitle: 'Página B',
};

describe('ShellPageContextService — tokens de ownership', () => {
  let service: ShellPageContextService;

  beforeEach(() => {
    service = new ShellPageContextService();
  });

  it('claimOwnership devuelve tokens monótonos y activa el binding', () => {
    const t1 = service.claimOwnership();
    const t2 = service.claimOwnership();
    expect(t2).toBeGreaterThan(t1);
    expect(service.isBindingActive()).toBe(true);
  });

  it('setContextWithToken sólo aplica si el token es el dueño actual', () => {
    const tA = service.claimOwnership();
    service.setContextWithToken(tA, ctxA);
    expect(service.context()).toEqual(ctxA);

    const tB = service.claimOwnership();
    service.setContextWithToken(tA, { breadcrumbs: [{ label: 'intento de A' }] });
    expect(service.context()).toEqual(ctxA);

    service.setContextWithToken(tB, ctxB);
    expect(service.context()).toEqual(ctxB);
  });

  it('releaseOwnership es no-op si otro container ya tomó el shell (race A→B)', () => {
    const tA = service.claimOwnership();
    service.setContextWithToken(tA, ctxA);

    const tB = service.claimOwnership();
    service.setContextWithToken(tB, ctxB);

    expect(service.releaseOwnership(tA)).toBe(false);
    expect(service.context()).toEqual(ctxB);
    expect(service.isBindingActive()).toBe(true);
  });

  it('releaseOwnership del dueño actual vacía contexto y desactiva binding', () => {
    const tA = service.claimOwnership();
    service.setContextWithToken(tA, ctxA);

    expect(service.releaseOwnership(tA)).toBe(true);
    expect(service.context().breadcrumbs).toEqual([]);
    expect(service.context().pageTitle).toBeUndefined();
    expect(service.isBindingActive()).toBe(false);
  });

  it('handler primario sólo se registra si el token es el dueño actual', () => {
    let calls = 0;
    const tA = service.claimOwnership();
    service.registerPrimaryActionHandlerWithToken(tA, () => {
      calls += 1;
    });
    service.invokePrimaryAction();
    expect(calls).toBe(1);

    service.claimOwnership();
    // token A ya no es dueño, ignorado
    service.registerPrimaryActionHandlerWithToken(tA, () => {
      calls += 10;
    });
    service.invokePrimaryAction();
    // sigue igual: handler antiguo se invalidó al claim de B (currentToken cambió y el de A ya no aplica)
    expect(calls).toBe(1);
  });
});

describe('ShellPageContextService — transición de navegación', () => {
  let service: ShellPageContextService;

  beforeEach(() => {
    service = new ShellPageContextService();
  });

  it('si nadie reclama nuevo dueño durante la navegación, libera al stale y aplica fallback', () => {
    const tA = service.claimOwnership();
    service.setContextWithToken(tA, ctxA);

    service.beginNavigationTransition();
    service.resolveNavigationTransition('/empleados');

    // ctxA fue liberado (stale) y se aplicó fallback de ruta.
    expect(service.context().pageTitle).toBeUndefined();
    expect(service.context().breadcrumbs.map((b) => b.label)).toEqual(['Empleados']);
    expect(service.isBindingActive()).toBe(false);
  });

  it('si alguien reclamó nuevo dueño durante la navegación, mantiene su contexto', () => {
    const tA = service.claimOwnership();
    service.setContextWithToken(tA, ctxA);

    service.beginNavigationTransition();
    const tB = service.claimOwnership();
    service.setContextWithToken(tB, ctxB);
    service.resolveNavigationTransition('/empleados');

    expect(service.context()).toEqual(ctxB);
    expect(service.isBindingActive()).toBe(true);
  });

  it('navegación sin dueño previo aplica fallback directamente', () => {
    service.beginNavigationTransition();
    service.resolveNavigationTransition('/empleados');
    expect(service.context().breadcrumbs.map((b) => b.label)).toEqual(['Empleados']);
  });
});

describe('ShellPageContextService — API legacy compatible', () => {
  let service: ShellPageContextService;

  beforeEach(() => {
    service = new ShellPageContextService();
  });

  it('setContext directo sigue funcionando (con token legacy interno)', () => {
    service.setContext(ctxA);
    expect(service.context()).toEqual(ctxA);
    expect(service.isBindingActive()).toBe(true);
  });

  it('clearContext directo vacía y resetea el dueño', () => {
    service.setContext(ctxA);
    service.clearContext();
    expect(service.context().breadcrumbs).toEqual([]);
    expect(service.isBindingActive()).toBe(false);
  });

  it('applyRouteFallback respeta bindingActive', () => {
    service.setContext(ctxA);
    service.applyRouteFallback('/empleados');
    // como el binding está activo (A es dueño), el fallback NO debe pisar.
    expect(service.context()).toEqual(ctxA);
  });
});
