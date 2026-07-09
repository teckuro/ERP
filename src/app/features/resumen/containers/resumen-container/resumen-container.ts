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
import { Router } from '@angular/router';
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
import { ParametrosGeneralesService } from '../../../parametros-generales/services/parametros-generales.service';
import type { ParametroGeneral } from '../../../parametros-generales/models/parametro-general.model';
import { WorkspaceLoadingComponent } from '../../../../shared/components/ui/feedback/workspace-loading/workspace-loading.component';
import { MessageBoxComponent } from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import {
  construirResumenOperativo,
  formatearValorEconomico,
  formatearValorKpi,
  type ResumenEconomicoFormato,
  type ResumenKpiTone,
  type ResumenParametrosEconomicos,
} from '../../rules/resumen-operativo.rules';

@Component({
  selector: 'app-resumen-container',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, WorkspaceLoadingComponent, MessageBoxComponent],
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
  private readonly parametrosService = inject(ParametrosGeneralesService);
  private readonly destroyRef = inject(DestroyRef);
  private pantallaInicializada = false;

  readonly loading = signal(true);
  readonly erroresCarga = signal<string[]>([]);
  readonly nominas = signal<NominaPeriodoResumen[] | null>(null);
  readonly empleados = signal<EmpleadoListado[] | null>(null);
  readonly licenciasPendientes = signal<LicenciaMedica[] | null>(null);
  readonly novedades = signal<NovedadMensual[] | null>(null);
  readonly parametros = signal<ResumenParametrosEconomicos | null>(null);

  readonly formatearValorKpi = formatearValorKpi;
  readonly formatearValorEconomico = formatearValorEconomico;

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
      parametros: this.parametros(),
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

  claseEconomico(tone: ResumenKpiTone, disponible: boolean): string {
    return `res-eco res-eco--${tone}${disponible ? '' : ' is-missing'}`;
  }

  formatearEconomico(value: number | null, formato: ResumenEconomicoFormato): string {
    return formatearValorEconomico(value, formato);
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

    const [nominasR, empleadosR, licenciasR, novedadesR, parametrosR] = await Promise.allSettled([
      this.nominaService.listarResumenes(),
      this.empleadosService.listar(),
      this.licenciasService.listar({ estado: 'pendiente_revision' }),
      this.novedadesService.listarNovedadesPeriodo(periodo),
      this.parametrosService.obtenerUltimoHastaPeriodo(periodo),
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
    if (parametrosR.status === 'rejected') {
      errores.push('parámetros económicos');
    }
    this.erroresCarga.set(errores);

    this.nominas.set(nominasR.status === 'fulfilled' ? nominasR.value : null);
    this.empleados.set(empleadosR.status === 'fulfilled' ? empleadosR.value : null);
    this.licenciasPendientes.set(licenciasR.status === 'fulfilled' ? licenciasR.value : null);
    this.novedades.set(novedadesR.status === 'fulfilled' ? novedadesR.value : null);
    this.parametros.set(
      parametrosR.status === 'fulfilled' ? mapearParametrosEconomicos(parametrosR.value) : null,
    );
    this.loading.set(false);
  }

  reintentarCarga(): void {
    void this.cargar();
  }
}

function mapearParametrosEconomicos(
  parametro: ParametroGeneral | null,
): ResumenParametrosEconomicos | null {
  if (!parametro) {
    return null;
  }
  return {
    uf: parametro.uf,
    utm: parametro.utm,
    uta: parametro.uta,
    sueldoMinimo: parametro.sueldoMinimo,
    dolarObservado: null,
  };
}
