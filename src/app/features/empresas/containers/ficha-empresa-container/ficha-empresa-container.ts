import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ArrowLeft, Save } from 'lucide-angular/src/icons';

import { MessageBoxComponent } from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import { ButtonComponent } from '../../../../shared/components/ui/primitives/button.component';
import { formatRutParts } from '../../../empleados/utils/empleado-rut';
import { EmpresaFormComponent } from '../../components/empresa-form/empresa-form.component';
import type { EmpresaFormPayload, EmpresaFormValidation, OrganismoMutualCatalogo } from '../../models/empresa.model';
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
    LucideAngularModule,
    ButtonComponent,
    MessageBoxComponent,
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

  readonly backIcon = ArrowLeft;
  readonly saveIcon = Save;

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

  async inicializar(): Promise<void> {
    this.cargando.set(true);
    this.mensajeError.set(null);
    try {
      const [organismos, detalle] = await Promise.all([
        this.empresasService.listarOrganismosMutual(),
        this.idEmpresa() != null ? this.empresasService.obtenerPorId(this.idEmpresa()!) : Promise.resolve(null),
      ]);
      this.organismos.set(organismos);
      if (detalle) {
        this.model.set(mapDetalleToFormPayload(detalle));
        this.rutCompleto.set(formatRutParts({ rut: detalle.rut, dv: detalle.dv }));
      }
    } catch (error) {
      this.mensajeError.set(error instanceof Error ? error.message : 'No se pudo cargar la ficha de empresa.');
    } finally {
      this.cargando.set(false);
    }
  }

  onModelChange(value: EmpresaFormPayload): void {
    this.model.set(value);
    this.validacion.set(null);
  }

  onRutChange(value: string): void {
    this.rutCompleto.set(value);
    this.validacion.set(null);
  }

  volver(): void {
    void this.router.navigate(['/empresas']);
  }

  async guardar(): Promise<void> {
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
      const guardada = await this.empresasService.guardar(this.idEmpresa(), payload, this.rutCompleto());
      this.mensajeExito.set('Datos de empresa guardados.');
      if (this.esNueva()) {
        void this.router.navigate(['/empresas', guardada.idEmpresa]);
        return;
      }
      this.model.set(mapDetalleToFormPayload(guardada));
      this.rutCompleto.set(formatRutParts({ rut: guardada.rut, dv: guardada.dv }));
    } catch (error) {
      this.mensajeError.set(error instanceof Error ? error.message : 'No se pudo guardar la empresa.');
    } finally {
      this.guardando.set(false);
    }
  }
}
