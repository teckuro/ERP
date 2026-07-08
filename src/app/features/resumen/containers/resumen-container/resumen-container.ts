import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '../../../../core/auth/auth.service';
import { PeriodoActivoService } from '../../../../core/services/periodo-activo.service';
import { bindShellPageContext } from '../../../../layout/shell-page-context.binding';
import type { ShellPageContext } from '../../../../layout/shell-page-context.service';
import { EmpleadosService } from '../../../empleados/services/empleados.service';
import type { EmpleadoListado } from '../../../empleados/models/empleado-listado.model';
import { LicenciasMedicasService } from '../../../licencias-medicas/services/licencias-medicas.service';
import type { LicenciaMedica } from '../../../licencias-medicas/models/licencia-medica.model';
import { NominaPeriodoService } from '../../../nomina-mensual/services/nomina-periodo.service';
import type { NominaPeriodoResumen } from '../../../nomina-mensual/models/nomina-periodo.models';
import { NovedadesMensualesService } from '../../../nomina-mensual/novedades/services/novedades-mensuales.service';
import type { NovedadMensual } from '../../../nomina-mensual/novedades/models/novedad-mensual.model';
import { WorkspaceLoadingComponent } from '../../../../shared/components/ui/feedback/workspace-loading/workspace-loading.component';
import { MessageBoxComponent } from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import {
  RESUMEN_MODULOS,
  construirResumenOperativo,
  formatearValorKpi,
  type ResumenKpiTone,
} from '../../rules/resumen-operativo.rules';

@Component({
  selector: 'app-resumen-container',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, WorkspaceLoadingComponent, MessageBoxComponent],
  templateUrl: './resumen-container.html',
  styleUrl: './resumen-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumenContainer implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  readonly periodoActivo = inject(PeriodoActivoService);
  private readonly nominaService = inject(NominaPeriodoService);
  private readonly empleadosService = inject(EmpleadosService);
  private readonly licenciasService = inject(LicenciasMedicasService);
  private readonly novedadesService = inject(NovedadesMensualesService);
  private readonly destroyRef = inject(DestroyRef);
  private pantallaInicializada = false;

  readonly loading = signal(true);
  readonly erroresCarga = signal<string[]>([]);
  readonly nominas = signal<NominaPeriodoResumen[] | null>(null);
  readonly empleados = signal<EmpleadoListado[] | null>(null);
  readonly licenciasPendientes = signal<LicenciaMedica[] | null>(null);
  readonly novedades = signal<NovedadMensual[] | null>(null);

  readonly modulos = RESUMEN_MODULOS;
  readonly formatearValorKpi = formatearValorKpi;

  readonly mensajeErrorCarga = computed(() => {
    const errores = this.erroresCarga();
    if (!errores.length) {
      return null;
    }
    const lista =
      errores.length === 1
        ? errores[0]
        : `${errores.slice(0, -1).join(', ')} y ${errores[errores.length - 1]}`;
    return `No pudimos cargar ${lista}. Revise su conexión y reintente.`;
  });

  readonly saludo = computed(() => {
    const user = this.auth.currentUser();
    const meta = user?.user_metadata as Record<string, unknown> | undefined;
    if (typeof meta?.['full_name'] === 'string' && meta['full_name'].trim()) {
      return meta['full_name'].trim().split(' ')[0] ?? 'equipo';
    }
    const email = this.auth.currentEmail();
    if (email) {
      return email.split('@')[0] ?? 'equipo';
    }
    return 'equipo';
  });

  readonly snapshot = computed(() =>
    construirResumenOperativo({
      periodoYm: this.periodoActivo.periodoYm(),
      nominas: this.nominas(),
      empleados: this.empleados(),
      licenciasPendientes: this.licenciasPendientes(),
      novedades: this.novedades(),
    }),
  );

  constructor() {
    bindShellPageContext(this.destroyRef, () => this.computeShellContext());

    effect(() => {
      const periodo = this.periodoActivo.periodoYm();
      if (!this.pantallaInicializada) {
        return;
      }
      untracked(() => {
        void this.cargar();
      });
    });
  }

  ngOnInit(): void {
    void this.cargar().finally(() => {
      this.pantallaInicializada = true;
    });
  }

  claseKpi(tone: ResumenKpiTone): string {
    return `res-kpi res-kpi--${tone}`;
  }

  claseAtencion(tone: 'warning' | 'danger' | 'info'): string {
    return `res-atencion-item res-atencion-item--${tone}`;
  }

  ir(ruta: string): void {
    void this.router.navigateByUrl(ruta);
  }

  private computeShellContext(): ShellPageContext {
    return {
      breadcrumbs: [{ label: 'Resumen' }],
      pageTitle: 'Resumen',
      pageSubtitle: `Período ${this.periodoActivo.etiqueta()}`,
    };
  }

  private async cargar(): Promise<void> {
    this.loading.set(true);
    this.erroresCarga.set([]);
    const periodo = this.periodoActivo.periodoYm();

    const [nominasR, empleadosR, licenciasR, novedadesR] = await Promise.allSettled([
      this.nominaService.listarResumenes(),
      this.empleadosService.listar(),
      this.licenciasService.listar({ estado: 'pendiente_revision' }),
      this.novedadesService.listarNovedadesPeriodo(periodo),
    ]);

    const errores: string[] = [];
    if (nominasR.status === 'rejected') {
      errores.push('nóminas');
    }
    if (empleadosR.status === 'rejected') {
      errores.push('empleados');
    }
    if (licenciasR.status === 'rejected') {
      errores.push('licencias médicas');
    }
    if (novedadesR.status === 'rejected') {
      errores.push('novedades del período');
    }
    this.erroresCarga.set(errores);

    this.nominas.set(nominasR.status === 'fulfilled' ? nominasR.value : null);
    this.empleados.set(empleadosR.status === 'fulfilled' ? empleadosR.value : null);
    this.licenciasPendientes.set(licenciasR.status === 'fulfilled' ? licenciasR.value : null);
    this.novedades.set(novedadesR.status === 'fulfilled' ? novedadesR.value : null);
    this.loading.set(false);
  }

  reintentarCarga(): void {
    void this.cargar();
  }
}
