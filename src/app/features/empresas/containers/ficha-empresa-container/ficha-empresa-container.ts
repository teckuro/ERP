/**
 * Ficha de empresa (alta y edición).
 *
 * Pantalla de configuración interna. El shell publica título dinámico
 * (razón social cuando ya existe; "Nueva empresa" en alta), breadcrumb,
 * subtítulo con RUT y CTA "Guardar" vía `bindShellPageContext`. No hay
 * header local: la página se concentra en el formulario.
 *
 * Alineada con `administrador-plantillas-container` (F03).
 */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { MessageBoxComponent } from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import { WorkspaceLoadingComponent } from '../../../../shared/components/ui/feedback/workspace-loading/workspace-loading.component';
import { bindShellPageContext } from '../../../../layout/shell-page-context.binding';
import { mensajeErrorSupabaseParaUsuario } from '../../../../core/errors/erp-supabase-user-message';
import type { ShellPageContext } from '../../../../layout/shell-page-context.service';
import { formatRutParts } from '../../../empleados/utils/empleado-rut';
import { EmpresaFormComponent } from '../../components/empresa-form/empresa-form.component';
import type {
  EmpresaFormPayload,
  EmpresaFormValidation,
  OrganismoMutualCatalogo,
} from '../../models/empresa.model';
import {
  crearEmpresaFormVacio,
  mapDetalleToFormPayload,
  validarEmpresaForm,
} from '../../rules/empresa-form.rules';
import { EmpresasService } from '../../services/empresas.service';

@Component({
  selector: 'app-ficha-empresa-container',
  standalone: true,
  imports: [
    CommonModule,
    MessageBoxComponent,
    WorkspaceLoadingComponent,
    EmpresaFormComponent,
  ],
  templateUrl: './ficha-empresa-container.html',
  styleUrl: './ficha-empresa-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FichaEmpresaContainer implements OnInit {
  private readonly empresasService = inject(EmpresasService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly idEmpresa = signal<number | null>(null);
  readonly esNueva = computed(() => this.idEmpresa() == null);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);
  readonly validacion = signal<EmpresaFormValidation | null>(null);
  readonly organismos = signal<OrganismoMutualCatalogo[]>([]);

  readonly model = signal<EmpresaFormPayload>(crearEmpresaFormVacio());
  readonly rutCompleto = signal('');

  /** Título visible en el header del shell: razón social en edición, label fijo en alta. */
  readonly tituloShell = computed(() => {
    if (this.esNueva()) return 'Nueva empresa';
    const razon = this.model().razonSocial?.trim();
    return razon || 'Ficha de empresa';
  });

  /** Subtítulo: RUT formateado o copy operativo según el contexto. */
  readonly subtituloShell = computed(() => {
    if (this.esNueva()) {
      return 'Registra los datos mínimos. La mutual se configura solo si la empresa cotiza.';
    }
    return this.rutCompleto() ? `RUT ${this.rutCompleto()}` : 'Revisa y actualiza los datos operativos.';
  });

  /** Mensaje único agrupado de validación (varios campos → una línea). */
  readonly mensajeValidacion = computed(() => {
    const v = this.validacion();
    if (!v || v.valido || !v.errores?.length) return null;
    return v.errores.join(' · ');
  });

  constructor() {
    bindShellPageContext(this.destroyRef, () => this.computeShellContext(), {
      onPrimaryAction: () => void this.guardar(),
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'nueva') {
      const parsed = Number(idParam);
      if (Number.isFinite(parsed) && parsed > 0) {
        this.idEmpresa.set(parsed);
      }
    }
    void this.inicializar();
  }

  private computeShellContext(): ShellPageContext {
    const breadcrumbs = this.esNueva()
      ? [{ label: 'Empresas', path: '/empresas' }, { label: 'Nueva empresa' }]
      : [{ label: 'Empresas', path: '/empresas' }, { label: this.tituloShell() }];
    return {
      breadcrumbs,
      pageTitle: this.tituloShell(),
      pageSubtitle: this.subtituloShell(),
      primaryAction: {
        label: this.guardando() ? 'Guardando…' : 'Guardar',
        disabled: this.guardando() || this.cargando(),
        loading: this.guardando(),
        actionId: 'empresas-guardar',
      },
    };
  }

  async inicializar(): Promise<void> {
    this.cargando.set(true);
    this.mensajeError.set(null);
    try {
      const [organismos, detalle] = await Promise.all([
        this.empresasService.listarOrganismosMutual(),
        this.idEmpresa() != null
          ? this.empresasService.obtenerPorId(this.idEmpresa()!)
          : Promise.resolve(null),
      ]);
      this.organismos.set(organismos);
      if (detalle) {
        this.model.set(mapDetalleToFormPayload(detalle));
        this.rutCompleto.set(formatRutParts({ rut: detalle.rut, dv: detalle.dv }));
      }
    } catch (error) {
      this.mensajeError.set(
        mensajeErrorSupabaseParaUsuario(error, 'cargar la ficha de empresa'),
      );
    } finally {
      this.cargando.set(false);
    }
  }

  onModelChange(value: EmpresaFormPayload): void {
    this.model.set(value);
    this.validacion.set(null);
    this.mensajeExito.set(null);
  }

  onRutChange(value: string): void {
    this.rutCompleto.set(value);
    this.validacion.set(null);
    this.mensajeExito.set(null);
  }

  volver(): void {
    void this.router.navigate(['/empresas']);
  }

  async guardar(): Promise<void> {
    if (this.guardando() || this.cargando()) return;
    const payload = this.model();
    const validacion = validarEmpresaForm(payload, this.rutCompleto());
    this.validacion.set(validacion);
    if (!validacion.valido) {
      return;
    }

    this.guardando.set(true);
    this.mensajeError.set(null);
    this.mensajeExito.set(null);
    try {
      const guardada = await this.empresasService.guardar(
        this.idEmpresa(),
        payload,
        this.rutCompleto(),
      );
      this.mensajeExito.set('Cambios guardados.');
      if (this.esNueva()) {
        void this.router.navigate(['/empresas', guardada.idEmpresa]);
        return;
      }
      this.model.set(mapDetalleToFormPayload(guardada));
      this.rutCompleto.set(formatRutParts({ rut: guardada.rut, dv: guardada.dv }));
    } catch (error) {
      this.mensajeError.set(
        mensajeErrorSupabaseParaUsuario(error, 'guardar la empresa'),
      );
    } finally {
      this.guardando.set(false);
    }
  }
}
