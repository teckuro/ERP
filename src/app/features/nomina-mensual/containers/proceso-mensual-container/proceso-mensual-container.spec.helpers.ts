import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { vi } from 'vitest';

import { ShellPageContextService } from '../../../../layout/shell-page-context.service';
import { PeriodoActivoService } from '../../../../core/services/periodo-activo.service';
import { NominaMensualCapabilitiesService } from '../../services/nomina-mensual-capabilities.service';
import { ProcesoMensualContainer } from './proceso-mensual-container';
import { ProcesoMensualPeriodoStore } from './store/proceso-mensual-periodo.store';

/** Evita cadena AuthService → Supabase en specs del contenedor. */
export function provideNominaMensualCapabilitiesMock() {
  return {
    provide: NominaMensualCapabilitiesService,
    useValue: {
      esAdmin: () => false,
      modoPruebas: () => true,
      puedeAccionesAdminNomina: () => false,
    },
  };
}

export function storeDe(fixture: ComponentFixture<ProcesoMensualContainer>): ProcesoMensualPeriodoStore {
  return (fixture.componentInstance as unknown as { store: ProcesoMensualPeriodoStore }).store;
}

export const PERIODO_TEST = '2026-05';

/** Limpia snapshots y liquidaciones del período en BD local (pruebas manuales / E2E). */
export const COMANDO_LIMPIAR_NOMINAS_PERIODO =
  `psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -v periodo=${PERIODO_TEST} -f bd/scripts/limpiar-nominas-mensuales.sql`;

export function textoIncluye(haystack: string, needle: string): boolean {
  const fold = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  return fold(haystack).includes(fold(needle));
}

export function expectTexto(haystack: string, needle: string): void {
  expect(textoIncluye(haystack, needle)).toBe(true);
}

export function expectTextoNo(haystack: string, needle: string): void {
  expect(textoIncluye(haystack, needle)).toBe(false);
}

export function botonPorTexto(root: ParentNode, fragmento: string): HTMLButtonElement | undefined {
  return [...root.querySelectorAll('button')].find((b) =>
    textoIncluye(b.textContent ?? '', fragmento),
  ) as HTMLButtonElement | undefined;
}

export function fijarPeriodoActivo(periodo = PERIODO_TEST): void {
  TestBed.inject(PeriodoActivoService).setPeriodoYm(periodo);
}

export async function montarContainer(): Promise<ComponentFixture<ProcesoMensualContainer>> {
  fijarPeriodoActivo();
  const fixture = TestBed.createComponent(ProcesoMensualContainer);
  fixture.detectChanges();
  await esperarRehidratacion(fixture);
  return fixture;
}

export async function esperarRehidratacion(fixture: ComponentFixture<ProcesoMensualContainer>): Promise<void> {
  await vi.waitFor(() => expect(fixture.componentInstance.rehidratandoPeriodo()).toBe(false), {
    timeout: 3000,
    interval: 20,
  });
  fixture.detectChanges();
}

export async function esperarSnapshotActivo(
  fixture: ComponentFixture<ProcesoMensualContainer>,
): Promise<void> {
  await vi.waitFor(() => expect(fixture.componentInstance.snapshotActivo()).not.toBeNull(), {
    timeout: 3000,
    interval: 20,
  });
  fixture.detectChanges();
}

async function esperarFlag(
  fixture: ComponentFixture<ProcesoMensualContainer>,
  lectura: () => boolean,
): Promise<void> {
  await vi.waitFor(() => expect(lectura()).toBe(false), { timeout: 3000, interval: 20 });
  await fixture.whenStable();
  fixture.detectChanges();
}

export function clickCtaPrincipal(fixture: ComponentFixture<ProcesoMensualContainer>): void {
  const btn = fixture.nativeElement.querySelector('.payroll-focus__primary') as HTMLButtonElement | null;
  expect(btn).toBeTruthy();
  btn!.click();
  fixture.detectChanges();
}

/** CTA de la barra superior vía ShellPageContextService (mismo cable que producción). */
export async function invocarCtaShell(
  fixture: ComponentFixture<ProcesoMensualContainer>,
): Promise<void> {
  TestBed.inject(ShellPageContextService).invokePrimaryAction();
  await fixture.whenStable();
  fixture.detectChanges();
}

export async function confirmarOverlayDecision(
  fixture: ComponentFixture<ProcesoMensualContainer>,
): Promise<void> {
  const c = fixture.componentInstance;
  expect(c.overlay().kind).toBe('decision');
  c.confirmarAccionProceso();
  await fixture.whenStable();
  fixture.detectChanges();
}

export type FlujoHasta = 'prevalidado' | 'base' | 'calculo' | 'guardado' | 'aprobado';

export async function avanzarFlujo(
  fixture: ComponentFixture<ProcesoMensualContainer>,
  hasta: FlujoHasta,
): Promise<ProcesoMensualContainer> {
  const c = fixture.componentInstance;

  if (hasta === 'prevalidado') {
    c.validarPeriodo();
    await esperarFlag(fixture, () => c.validando());
    await vi.waitFor(() => expect(c.resultado()).not.toBeNull(), { timeout: 3000, interval: 20 });
    return c;
  }

  await avanzarFlujo(fixture, 'prevalidado');

  if (hasta === 'base') {
    c.generarPreNomina();
    await esperarFlag(fixture, () => c.generandoPreNomina());
    await vi.waitFor(
      () => expect(storeDe(fixture).snapshotActivo()?.estado).toBe('preliminar'),
      { timeout: 5000, interval: 20 },
    );
    return c;
  }

  await avanzarFlujo(fixture, 'base');

  if (hasta === 'calculo') {
    if (!c.calculo()) {
      await invocarCtaShell(fixture);
      storeDe(fixture).calcularPreliminar();
      await esperarFlag(fixture, () => c.calculandoPreliminar());
      await vi.waitFor(() => expect(c.calculo()).not.toBeNull(), { timeout: 3000, interval: 20 });
    }
    return c;
  }

  await avanzarFlujo(fixture, 'calculo');

  if (hasta === 'guardado') {
    if (!c.snapshotActivo()) {
      c.guardarSnapshotPreliminar();
      fixture.detectChanges();
      if (c.overlay().kind === 'decision') {
        await confirmarOverlayDecision(fixture);
      }
      await esperarFlag(fixture, () => c.guardandoSnapshot());
    }
    await vi.waitFor(() => expect(c.snapshotActivo()).not.toBeNull(), { timeout: 3000, interval: 20 });
    return c;
  }

  await avanzarFlujo(fixture, 'guardado');

  if (hasta === 'aprobado') {
    if (c.revisionAprobacion().puedeAprobar) {
      await invocarCtaShell(fixture);
      if (c.overlay().kind === 'decision') {
        await confirmarOverlayDecision(fixture);
      }
    } else {
      storeDe(fixture).ejecutarAprobacionOperativa([]);
    }
    await esperarFlag(fixture, () => c.aprobandoResultado());
  }

  return c;
}
