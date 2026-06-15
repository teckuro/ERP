import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  BarChart3,
  Building2,
  CalendarDays,
  CalendarPlus,
  ClipboardList,
  FileCheck2,
  FileText,
  HeartPulse,
  LayoutDashboard,
  MessageCircle,
  Repeat,
  Settings,
  Tags,
  Users,
} from 'lucide-angular/src/icons';
import { signal } from '@angular/core';
import { AuthService } from '../core/auth/auth.service';
import { PeriodoActivoService } from '../core/services/periodo-activo.service';
import { SidebarComponent } from './sidebar.component';
import { SHELL_HEADER_HEIGHT_PX, SHELL_NAV_WIDTH_PX } from './shell-navigation.config';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SidebarComponent,
        LucideAngularModule.pick({
          BarChart3,
          Building2,
          CalendarDays,
          CalendarPlus,
          ClipboardList,
          FileCheck2,
          FileText,
          HeartPulse,
          LayoutDashboard,
          MessageCircle,
          Repeat,
          Settings,
          Tags,
          Users,
        }),
      ],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            currentUser: () =>
              ({
                email: 'rrhh@empresa.cl',
                user_metadata: { full_name: 'RRHH Demo' },
                app_metadata: { role: 'admin' },
              }) as never,
            currentEmail: () => 'rrhh@empresa.cl',
          },
        },
        {
          provide: PeriodoActivoService,
          useValue: {
            periodoYm: signal('2026-05'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
  });

  it('usa ancho 220px y grupos Principal y Gestión', () => {
    const aside = fixture.nativeElement.querySelector('.erp-sidebar') as HTMLElement;
    expect(aside.style.width).toBe(`${SHELL_NAV_WIDTH_PX}px`);
    const brand = fixture.nativeElement.querySelector('.erp-sidebar__brand') as HTMLElement;
    expect(getComputedStyle(brand).height).toBe(`${SHELL_HEADER_HEIGHT_PX}px`);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Principal');
    expect(text).toContain('Gestión');
    expect(text).toContain('Administrador de nóminas');
    expect(text).not.toContain('Trabajadores');
  });

  it('marca activo con borde completo sin active-dot', () => {
    expect(fixture.nativeElement.querySelector('.active-dot')).toBeNull();
    const link = fixture.nativeElement.querySelector('.erp-sidebar__link.is-active') as HTMLElement | null;
    if (link) {
      const border = getComputedStyle(link).borderWidth;
      expect(border).not.toBe('0px');
    }
  });
});
