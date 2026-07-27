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
import { MessageBoxComponent, type MessageBoxAction } from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import {
  construirResumenOperativo,
  formatearValorEconomico,
  formatearValorKpi,
  periodoAnteriorYm,
  type ResumenAtencionItem,
  type ResumenEconomicoFormato,
  type ResumenKpiTone,
  type ResumenParametrosEconomicos,
} from '../../rules/resumen-operativo.rules';

const BANDEJA_PREVIEW = 3;

interface ResumenAccesoRapido {
  id: string;
  label: string;
  ruta: string;
  icon: string;
}

const ACCESOS_RELEVANTES: readonly ResumenAccesoRapido[] = [
  { id: 'empleados', label: 'Empleados', ruta: '/empleados', icon: 'users' },
  {
    id: 'nominas',
    label: 'Nóminas',
    ruta: '/remuneraciones/nominas',
    icon: 'clipboard-list',
  },
  { id: 'licencias', label: 'Licencias', ruta: '/licencias-medicas', icon: 'heart-pulse' },
  { id: 'parametros', label: 'Parámetros', ruta: '/parametros', icon: 'settings-2' },
];

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
  readonly parametrosAnterior = signal<ResumenParametrosEconomicos | null>(null);
  readonly ultimaActualizacion = signal('');
  readonly modalTareasAbierto = signal(false);

  readonly accesos = ACCESOS_RELEVANTES;
  readonly formatearValorKpi = formatearValorKpi;
  readonly formatearValorEconomico = formatearValorEconomico;

  readonly accionesModalTareas: MessageBoxAction[] = [
    { label: 'Cerrar', value: 'cerrar', role: 'secondary' },
  ];

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

  readonly saludoCompleto = computed(() => `${prefijoSaludo()} ${this.saludo()}`);

  readonly snapshot = computed(() =>
    construirResumenOperativo({
      periodoYm: this.periodoActivo.periodoYm(),
      nominas: this.nominas(),
      empleados: this.empleados(),
      licenciasPendientes: this.licenciasPendientes(),
      novedades: this.novedades(),
      parametros: this.parametros(),
      parametrosAnterior: this.parametrosAnterior(),
    }),
  );

  readonly atencionPreview = computed(() => this.snapshot().atencion.slice(0, BANDEJA_PREVIEW));

  readonly tieneMasTareas = computed(() => this.snapshot().atencion.length > BANDEJA_PREVIEW);

  readonly puedeAbrirTareas = computed(() => this.snapshot().atencion.length > 0);

  readonly dotacion = computed(() => {
    const activos = this.snapshot().kpis.find((kpi) => kpi.id === 'empleados-activos');
    return activos?.value ?? null;
  });

  readonly costoLabel = computed(() => {
    const costo = this.snapshot().kpis.find((kpi) => kpi.id === 'costo-esperado');
    return formatearValorKpi(costo?.value ?? 0, 'clp-entero');
  });

  readonly chartVista = computed(() => construirVistaGrafico(this.snapshot().evolucion));

  readonly donutStyle = computed(() => {
    const comp = this.snapshot().composicion;
    const haberes = comp.segmentos.find((s) => s.id === 'haberes');
    const descuentos = comp.segmentos.find((s) => s.id === 'descuentos');
    if (!comp.hayDatos || !haberes || !descuentos) {
      return { background: '#e2e8f0' };
    }
    const hastaHaberes = haberes.porcentaje;
    return {
      background: `conic-gradient(${haberes.color} 0 ${hastaHaberes}%, ${descuentos.color} ${hastaHaberes}% 100%)`,
    };
  });

  readonly notaEvolucion = computed(() => {
    const evo = this.snapshot().evolucion;
    const ultimo = evo.puntos[evo.puntos.length - 1];
    if (!ultimo) {
      return 'Sin períodos para comparar.';
    }
    if (!evo.hayDatos) {
      return 'Sin costo registrado en los últimos meses ($0).';
    }
    if (evo.variacionPct == null) {
      return `Costo del período: ${formatearValorKpi(ultimo.valorActual, 'clp-entero')}. Sin base del año anterior.`;
    }
    const signo = evo.variacionPct > 0 ? 'mayor' : evo.variacionPct < 0 ? 'menor' : 'igual';
    const abs = Math.abs(evo.variacionPct).toFixed(1).replace('.', ',');
    if (evo.variacionPct === 0) {
      return `El costo de ${this.periodoActivo.etiqueta()} es igual al mismo período de ${evo.anioAnterior}.`;
    }
    return `El costo de ${this.periodoActivo.etiqueta()} es ${abs}% ${signo} que el mismo período de ${evo.anioAnterior}.`;
  });

  readonly mensajeModalTareas = computed(() => {
    const n = this.snapshot().atencion.length;
    if (n === 0) {
      return 'No hay pendientes en el período activo.';
    }
    return `${n} pendiente${n === 1 ? '' : 's'} del período ${this.periodoActivo.etiqueta()}.`;
  });

  readonly contextoEmpresa = computed(() => {
    const snap = this.snapshot();
    if (snap.empresaNombre) {
      return snap.empresaNombre;
    }
    if (snap.estadoNominaDominante) {
      return snap.estadoNominaDominante;
    }
    return 'Sin nómina del período';
  });

  constructor() {
    bindShellPageContext(this.destroyRef, () => this.computeShellContext());

    effect(() => {
      const periodo = this.periodoActivo.periodoYm();
      if (!this.pantallaInicializada) {
        return;
      }
      untracked(() => {
        this.modalTareasAbierto.set(false);
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

  iconoTendencia(tendencia: 'up' | 'down' | 'flat' | 'unknown'): string {
    if (tendencia === 'up') {
      return 'trending-up';
    }
    if (tendencia === 'down') {
      return 'trending-down';
    }
    return 'minus-circle';
  }

  etiquetaCta(tone: 'primary' | 'warning', etiquetaAccion: string): string {
    if (tone === 'warning') {
      return 'Revisar ahora';
    }
    if (etiquetaAccion.toLowerCase().includes('preparar')) {
      return 'Abrir nóminas';
    }
    return 'Continuar';
  }

  etiquetaPrioridad(prioridad: 'alta' | 'media' | 'critica' | 'info'): string {
    switch (prioridad) {
      case 'alta':
        return 'Alta';
      case 'media':
        return 'Media';
      case 'critica':
        return 'Crítica';
      default:
        return 'Info';
    }
  }

  iconoAccion(ruta: string): string {
    if (ruta.includes('licencias')) {
      return 'clipboard-plus';
    }
    if (ruta.includes('novedades')) {
      return 'list-checks';
    }
    if (ruta.includes('empleados')) {
      return 'users';
    }
    if (ruta.includes('parametros')) {
      return 'settings-2';
    }
    return 'clipboard-list';
  }

  formatearEconomico(value: number | null, formato: ResumenEconomicoFormato): string {
    return formatearValorEconomico(value ?? 0, formato);
  }

  formatearMonto(value: number): string {
    return formatearValorKpi(value, 'clp-entero');
  }

  abrirModalTareas(): void {
    if (!this.puedeAbrirTareas()) {
      return;
    }
    this.modalTareasAbierto.set(true);
  }

  cerrarModalTareas(): void {
    this.modalTareasAbierto.set(false);
  }

  irDesdeTarea(item: ResumenAtencionItem): void {
    this.modalTareasAbierto.set(false);
    this.ir(item.ruta);
  }

  ir(ruta: string): void {
    void this.router.navigateByUrl(ruta);
  }

  actualizarResumen(): void {
    void this.cargar();
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
    const periodoPrev = periodoAnteriorYm(periodo);

    const [nominasR, empleadosR, licenciasR, novedadesR, parametrosR, parametrosPrevR] =
      await Promise.allSettled([
        this.nominaService.listarResumenes(),
        this.empleadosService.listar(),
        this.licenciasService.listar({ estado: 'pendiente_revision' }),
        this.novedadesService.listarNovedadesPeriodo(periodo),
        this.parametrosService.obtenerUltimoHastaPeriodo(periodo),
        this.parametrosService.obtenerUltimoHastaPeriodo(periodoPrev),
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

    let previos: ResumenParametrosEconomicos | null =
      parametrosPrevR.status === 'fulfilled'
        ? mapearParametrosEconomicos(parametrosPrevR.value)
        : null;
    const actualRaw = parametrosR.status === 'fulfilled' ? parametrosR.value : null;
    const prevRaw = parametrosPrevR.status === 'fulfilled' ? parametrosPrevR.value : null;
    if (actualRaw && prevRaw && actualRaw.periodo === prevRaw.periodo) {
      try {
        const earlier = await this.parametrosService.obtenerUltimoHastaPeriodo(
          periodoAnteriorYm(periodoPrev),
        );
        previos =
          earlier && earlier.periodo !== actualRaw.periodo
            ? mapearParametrosEconomicos(earlier)
            : null;
      } catch {
        previos = null;
      }
    }
    this.parametrosAnterior.set(previos);
    this.ultimaActualizacion.set(formatearMarcaTiempo(new Date()));
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

function prefijoSaludo(ahora: Date = new Date()): string {
  const hora = ahora.getHours();
  if (hora < 12) {
    return 'Buenos días,';
  }
  if (hora < 19) {
    return 'Buenas tardes,';
  }
  return 'Buenas noches,';
}

function formatearMarcaTiempo(fecha: Date): string {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(fecha);
}

interface ResumenChartVista {
  maxLabel: string;
  midLabel: string;
  pointsActual: string;
  pointsAnterior: string;
  areaActual: string;
  dots: { x: number; y: number; title: string }[];
  dotsPrev: { x: number; y: number; title: string }[];
  labels: { x: number; text: string }[];
  gridY: number[];
}

function construirVistaGrafico(evolucion: {
  puntos: {
    etiquetaMes: string;
    valorActual: number;
    valorAnterior: number;
    periodoYm: string;
  }[];
  maxValor: number;
  anioActual: number;
  anioAnterior: number;
}): ResumenChartVista {
  const left = 58;
  const right = 700;
  const top = 18;
  const bottom = 228;
  const n = Math.max(evolucion.puntos.length, 1);
  const span = right - left;
  const step = n > 1 ? span / (n - 1) : 0;
  const max = Math.max(evolucion.maxValor, 1);

  const yOf = (valor: number) => bottom - (valor / max) * (bottom - top);
  const xOf = (i: number) => left + i * step;

  const coordsActual = evolucion.puntos.map((p, i) => ({ x: xOf(i), y: yOf(p.valorActual) }));
  const coordsAnterior = evolucion.puntos.map((p, i) => ({
    x: xOf(i),
    y: yOf(p.valorAnterior),
  }));

  const pointsActual = coordsActual.map((c) => `${c.x},${c.y}`).join(' ');
  const pointsAnterior = coordsAnterior.map((c) => `${c.x},${c.y}`).join(' ');

  const areaActual =
    coordsActual.length > 0
      ? [
          `M ${coordsActual[0].x} ${bottom}`,
          ...coordsActual.map((c) => `L ${c.x} ${c.y}`),
          `L ${coordsActual[coordsActual.length - 1].x} ${bottom}`,
          'Z',
        ].join(' ')
      : '';

  const dots = evolucion.puntos.map((p, i) => ({
    x: coordsActual[i].x,
    y: coordsActual[i].y,
    title: `${p.etiquetaMes} ${evolucion.anioActual}: ${formatearValorKpi(p.valorActual, 'clp-entero')} · ${evolucion.anioAnterior}: ${formatearValorKpi(p.valorAnterior, 'clp-entero')}`,
  }));
  const dotsPrev = evolucion.puntos.map((p, i) => ({
    x: coordsAnterior[i].x,
    y: coordsAnterior[i].y,
    title: `${p.etiquetaMes} ${evolucion.anioAnterior}: ${formatearValorKpi(p.valorAnterior, 'clp-entero')}`,
  }));
  const labels = evolucion.puntos.map((p, i) => ({ x: xOf(i), text: p.etiquetaMes }));
  const gridY = [top, (top + bottom) / 2, bottom];

  return {
    maxLabel: formatearEje(max),
    midLabel: formatearEje(max / 2),
    pointsActual,
    pointsAnterior,
    areaActual,
    dots,
    dotsPrev,
    labels,
    gridY,
  };
}

function formatearEje(valor: number): string {
  if (valor >= 1_000_000) {
    const m = valor / 1_000_000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (valor >= 1_000) {
    return `$${Math.round(valor / 1000)}k`;
  }
  return `$${Math.round(valor)}`;
}
