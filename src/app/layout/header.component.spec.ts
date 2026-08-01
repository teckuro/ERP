import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Calendar, ChevronDown, Clock, Home, Menu, Play } from 'lucide-angular/src/icons';
import { signal } from '@angular/core';

import { AuthService } from '../core/auth/auth.service';
import { EmpresaActivaService } from '../core/services/empresa-activa.service';
import { PeriodoActivoService } from '../core/services/periodo-activo.service';
import { HeaderComponent } from './header.component';
import { SHELL_HEADER_HEIGHT_PX } from './shell-navigation.config';
import { ShellNavUiService } from './shell-nav-ui.service';
import { ShellPageContextService } from './shell-page-context.service';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let shellContext: ShellPageContextService;
  let navUi: ShellNavUiService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent, LucideAngularModule.pick({ Calendar, ChevronDown, Clock, Home, Menu, Play })],
      providers: [
        provideRouter([]),
        ShellPageContextService,
        ShellNavUiService,
        {
          provide: AuthService,
          useValue: {
            currentUser: () => ({ email: 'rrhh@empresa.cl' }) as never,
            currentEmail: () => 'rrhh@empresa.cl',
          },
        },
        {
          provide: EmpresaActivaService,
          useValue: {
            limpiar: () => undefined,
          },
        },
        {
          provide: PeriodoActivoService,
          useValue: {
            periodoYm: signal('2026-05'),
            etiqueta: () => 'Mayo 2026',
            setPeriodoYm: () => undefined,
          },
        },
      ],
    }).compileComponents();

    shellContext = TestBed.inject(ShellPageContextService);
    navUi = TestBed.inject(ShellNavUiService);
    fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
  });

  it('renderiza breadcrumb y chip de periodo desde contexto minimo', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Mayo 2026');
    const header = fixture.nativeElement.querySelector('.erp-shell-header') as HTMLElement;
    expect(header.style.height).toBe(`${SHELL_HEADER_HEIGHT_PX}px`);
    expect(fixture.nativeElement.querySelector('.erp-shell-header__period-trigger')).toBeTruthy();
  });

  it('cambia periodo activo al seleccionar mes', () => {
    const periodo = TestBed.inject(PeriodoActivoService) as {
      setPeriodoYm: (ym: string) => void;
    };
    const setSpy = vi.spyOn(periodo, 'setPeriodoYm');
    fixture.componentInstance.onMesChange('04');
    expect(setSpy).toHaveBeenCalledWith('2026-04');
  });

  it('muestra chip de estado y CTA cuando el contexto los registra', () => {
    shellContext.setContext({
      breadcrumbs: [
        { label: 'Remuneraciones', path: '/remuneraciones/nominas' },
        { label: 'Nómina mensual' },
      ],
      statusChip: { label: 'Sin generar', tone: 'neutral' },
      primaryAction: {
        label: 'Generar nómina',
        disabled: true,
        loading: false,
        actionId: 'validarPeriodo',
      },
    });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Remuneraciones');
    expect(text).toContain('Nómina mensual');
    expect(text).toContain('Sin generar');
    const cta = fixture.nativeElement.querySelector('.erp-shell-header__cta') as HTMLButtonElement;
    expect(cta).toBeTruthy();
    expect(cta.disabled).toBe(true);
  });

  it('muestra breadcrumb de fallback de ruta', () => {
    shellContext.applyRouteFallback('/reportes');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Reportes');
  });

  it('propaga el tooltip de la primaryAction como [title] y [aria-label] en el CTA', () => {
    shellContext.setContext({
      breadcrumbs: [{ label: 'Nómina mensual' }],
      primaryAction: {
        label: 'Continuar',
        disabled: true,
        loading: false,
        actionId: 'avanzarPaso',
        tooltip: 'Completa Dotación para continuar.',
      },
    });
    fixture.detectChanges();

    const cta = fixture.nativeElement.querySelector('.erp-shell-header__cta') as HTMLButtonElement;
    expect(cta).toBeTruthy();
    expect(cta.getAttribute('title')).toBe('Completa Dotación para continuar.');
    expect(cta.getAttribute('aria-label')).toBe('Completa Dotación para continuar.');
  });

  it('omite title/aria-label cuando primaryAction no tiene tooltip', () => {
    shellContext.setContext({
      breadcrumbs: [{ label: 'Nómina mensual' }],
      primaryAction: {
        label: 'Continuar',
        disabled: false,
        loading: false,
        actionId: 'avanzarPaso',
      },
    });
    fixture.detectChanges();

    const cta = fixture.nativeElement.querySelector('.erp-shell-header__cta') as HTMLButtonElement;
    expect(cta).toBeTruthy();
    expect(cta.getAttribute('title')).toBeNull();
  });

  it('el botón de menú alterna el drawer móvil vía ShellNavUiService', () => {
    const btn = fixture.nativeElement.querySelector('.erp-shell-header__menu-btn') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.getAttribute('aria-controls')).toBe('erp-shell-nav');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(navUi.mobileNavOpen()).toBe(false);

    btn.click();
    fixture.detectChanges();
    expect(navUi.mobileNavOpen()).toBe(true);
    expect(btn.getAttribute('aria-expanded')).toBe('true');

    btn.click();
    fixture.detectChanges();
    expect(navUi.mobileNavOpen()).toBe(false);
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });

  it('expone Salir en sesión inline y en menú compacto', () => {
    const logouts = fixture.nativeElement.querySelectorAll('.erp-shell-header__logout') as NodeListOf<HTMLButtonElement>;
    expect(logouts.length).toBeGreaterThanOrEqual(2);
    expect(fixture.nativeElement.querySelector('.erp-shell-header__session')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.erp-shell-header__user--inline')).toBeTruthy();
  });
});
