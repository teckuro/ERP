import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Edit3,
  Save,
  X,
} from 'lucide-angular/src/icons';

import { EmpleadoEstado, EmpleadoListado } from '../../models/empleado-listado.model';
import { EmpleadosService } from '../../services/empleados.service';

type EmployeeFileTab =
  | 'general'
  | 'laboral'
  | 'remuneracion'
  | 'prevision'
  | 'pago'
  | 'documentos'
  | 'historial';

interface EmployeeFileTabItem {
  id: EmployeeFileTab;
  label: string;
}

interface EmployeeDetailItem {
  label: string;
  value: string;
}

@Component({
  selector: 'app-ficha-empleado-container',
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
  ],
  templateUrl: './ficha-empleado-container.html',
  styleUrl: './ficha-empleado-container.css',
})
export class FichaEmpleadoContainer implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly empleadosService = inject(EmpleadosService);

  readonly empleadoId = Number(this.route.snapshot.paramMap.get('id'));
  readonly empleado = signal<EmpleadoListado | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly activeTab = signal<EmployeeFileTab>('general');
  readonly editingTab = signal<EmployeeFileTab | null>(null);

  readonly arrowLeftIcon = ArrowLeft;
  readonly alertIcon = AlertCircle;
  readonly checkIcon = CheckCircle2;
  readonly clockIcon = Clock3;
  readonly editIcon = Edit3;
  readonly saveIcon = Save;
  readonly cancelIcon = X;

  readonly tabs: EmployeeFileTabItem[] = [
    { id: 'general', label: 'General' },
    { id: 'laboral', label: 'Laboral' },
    { id: 'remuneracion', label: 'Remuneracion' },
    { id: 'prevision', label: 'Prevision y Salud' },
    { id: 'pago', label: 'Pago' },
    { id: 'documentos', label: 'Documentos' },
    { id: 'historial', label: 'Historial' },
  ];

  async ngOnInit(): Promise<void> {
    if (!Number.isInteger(this.empleadoId) || this.empleadoId <= 0) {
      this.errorMessage.set('Identificador de empleado invalido.');
      this.isLoading.set(false);
      return;
    }

    try {
      this.empleado.set(await this.empleadosService.obtenerPorId(this.empleadoId));

      if (!this.empleado()) {
        this.errorMessage.set('No se encontro la ficha solicitada.');
      }
    } catch {
      this.errorMessage.set('No fue posible cargar la ficha del empleado.');
    } finally {
      this.isLoading.set(false);
    }
  }

  selectTab(tabId: EmployeeFileTab): void {
    this.activeTab.set(tabId);
    this.editingTab.set(null);
  }

  startEditing(): void {
    this.editingTab.set(this.activeTab());
  }

  cancelEditing(): void {
    this.editingTab.set(null);
  }

  saveSection(): void {
    this.editingTab.set(null);
  }

  isEditingCurrentTab(): boolean {
    return this.editingTab() === this.activeTab();
  }

  statusLabel(estado: EmpleadoEstado): string {
    switch (estado) {
      case 'borrador':
        return 'Borrador';
      case 'en_proceso':
        return 'En proceso';
      case 'activo':
        return 'Activo';
      case 'suspendido':
        return 'Suspendido';
      case 'inactivo':
        return 'Inactivo';
      case 'desvinculado':
        return 'Desvinculado';
      case 'bloqueado':
        return 'Bloqueado';
    }
  }

  statusClass(estado: EmpleadoEstado): string {
    switch (estado) {
      case 'activo':
        return 'is-active';
      case 'borrador':
        return 'is-draft';
      case 'en_proceso':
        return 'is-progress';
      case 'suspendido':
        return 'is-warning';
      case 'desvinculado':
      case 'bloqueado':
        return 'is-danger';
      default:
        return 'is-neutral';
    }
  }

  completionValue(empleado: EmpleadoListado): number {
    switch (empleado.estado) {
      case 'borrador':
        return 35;
      case 'en_proceso':
        return 68;
      case 'activo':
        return 100;
      default:
        return 88;
    }
  }

  pendingItems(empleado: EmpleadoListado): string[] {
    if (empleado.estado === 'activo') {
      return ['Sin pendientes criticos'];
    }

    if (empleado.estado === 'borrador') {
      return ['Contrato y jornada', 'Prevision y salud', 'Datos de pago'];
    }

    return ['Validar remuneracion', 'Cerrar documentos'];
  }

  primaryActionLabel(empleado: EmpleadoListado): string {
    return empleado.estado === 'borrador' ? 'Continuar alta' : 'Editar seccion';
  }

  activeTabLabel(): string {
    return this.tabs.find((tab) => tab.id === this.activeTab())?.label ?? 'General';
  }

  detailItems(empleado: EmpleadoListado): EmployeeDetailItem[] {
    switch (this.activeTab()) {
      case 'general':
        return [
          { label: 'Nombre completo', value: empleado.nombre },
          { label: 'RUT', value: empleado.rut },
          { label: 'Estado de ficha', value: this.statusLabel(empleado.estado) },
          { label: 'Fecha de ingreso', value: empleado.fechaIngreso },
        ];
      case 'laboral':
        return [
          { label: 'Cargo', value: this.capitalize(empleado.cargo) },
          { label: 'Sucursal', value: 'Sucursal asociada' },
          { label: 'Departamento', value: empleado.departamento },
          { label: 'Tipo de contrato', value: 'Por definir en detalle' },
        ];
      case 'remuneracion':
        return [
          { label: 'Sueldo base', value: `$ ${empleado.sueldoBase.toLocaleString('es-CL')}` },
          { label: 'Jornada', value: 'Segun contrato vigente' },
          { label: 'Gratificacion', value: 'Pendiente de consolidar' },
          { label: 'Semana corrida', value: 'Segun configuracion' },
        ];
      case 'prevision':
        return [
          { label: 'Regimen previsional', value: 'Pendiente de detalle' },
          { label: 'Salud', value: 'Pendiente de detalle' },
          { label: 'APV/APVI', value: 'Sin informacion visible' },
          { label: 'Vigencia', value: empleado.fechaIngreso },
        ];
      case 'pago':
        return [
          { label: 'Banco', value: 'Pendiente de detalle' },
          { label: 'Tipo de cuenta', value: 'Pendiente de detalle' },
          { label: 'Numero de cuenta', value: 'No visible en resumen' },
          { label: 'Estado pago', value: empleado.estado === 'activo' ? 'Operativo' : 'Por completar' },
        ];
      case 'documentos':
        return [
          { label: 'Contrato', value: empleado.estado === 'activo' ? 'Disponible' : 'Pendiente' },
          { label: 'Anexos', value: 'Sin anexos registrados' },
          { label: 'Certificados', value: 'Sin documentos asociados' },
          { label: 'Pendientes', value: `${this.pendingItems(empleado).length}` },
        ];
      case 'historial':
        return [
          { label: 'Ultimo cambio', value: 'Ficha consultada' },
          { label: 'Estado actual', value: this.statusLabel(empleado.estado) },
          { label: 'Origen', value: 'Modulo empleados' },
          { label: 'Auditoria', value: 'Preparada para eventos' },
        ];
    }
  }

  private capitalize(value: string): string {
    return value
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
