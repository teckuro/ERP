import { Injector, afterNextRender } from '@angular/core';

const FOCUSABLE_SELECTOR =
  'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const INVALID_CONTROL_SELECTOR =
  '.step-panel input.ng-invalid:not([type="hidden"]), .step-panel select.ng-invalid, .step-panel textarea.ng-invalid, .step-panel [formControlName].ng-invalid, .step-panel [formcontrolname].ng-invalid';

export function esCampoFormularioEnfocable(element: HTMLElement): boolean {
  return (
    element.matches('input:not([type="hidden"]):not([disabled])') ||
    element.matches('select:not([disabled])') ||
    element.matches('textarea:not([disabled])') ||
    element.matches('button:not([disabled])') ||
    element.matches('[tabindex]:not([tabindex="-1"])')
  );
}

export function obtenerCampoEnfocable(
  controlHost: HTMLElement | null,
): HTMLElement | null {
  if (!controlHost) {
    return null;
  }

  if (esCampoFormularioEnfocable(controlHost)) {
    return controlHost;
  }

  return controlHost.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
}

export function buscarControlPorRuta(
  host: HTMLElement,
  controlPath: string | undefined,
): HTMLElement | null {
  const path = controlPath?.trim();
  if (!path) {
    return null;
  }

  const byDataPath = host.querySelector<HTMLElement>(
    `[data-field-path="${path}"]`,
  );
  if (byDataPath) {
    return obtenerCampoEnfocable(byDataPath);
  }

  const segments = path.split('.');
  const controlName = segments.at(-1);
  if (!controlName) {
    return null;
  }

  const groupSelector =
    segments.length > 1 ? `[formGroupName="${segments[0]}"] ` : '';
  const controlHost = host.querySelector<HTMLElement>(
    `${groupSelector}[formControlName="${controlName}"], ${groupSelector}[formcontrolname="${controlName}"]`,
  );
  return obtenerCampoEnfocable(controlHost);
}

export function buscarPrimerControlNgInvalido(host: HTMLElement): HTMLElement | null {
  const invalidHost = host.querySelector<HTMLElement>(INVALID_CONTROL_SELECTOR);
  return obtenerCampoEnfocable(invalidHost);
}

export function enfocarElemento(element: HTMLElement): void {
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  element.focus({ preventScroll: true });
}

export function enfocarRutaControl(
  injector: Injector,
  host: HTMLElement,
  controlPath: string,
  options?: {
    onFallback?: () => void;
    attempt?: number;
  },
): void {
  const attempt = options?.attempt ?? 0;
  const maxAttempts = 16;

  const run = (): void => {
    const control = buscarControlPorRuta(host, controlPath);
    if (control) {
      enfocarElemento(control);
      return;
    }

    if (attempt < maxAttempts) {
      window.setTimeout(
        () =>
          enfocarRutaControl(injector, host, controlPath, {
            ...options,
            attempt: attempt + 1,
          }),
        50,
      );
      return;
    }

    options?.onFallback?.();
  };

  if (attempt === 0) {
    afterNextRender(run, { injector });
    return;
  }

  run();
}
