import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  ETIQUETAS_MODULO_PERMISO,
  MODULOS_PERMISO,
  type ModuloPermiso,
} from '../../../../core/auth/erp-permisos-modulos.rules';
import {
  MessageBoxComponent,
  type MessageBoxAction,
} from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import type { PerfilAcceso, RolBasePerfil } from '../../models/administracion.model';
import { etiquetaRolBase, validarFormularioPerfil } from '../../rules/administracion.rules';

export interface PerfilEditorState {
  idPerfil: number | null;
  nombre: string;
  descripcion: string;
  rolBase: RolBasePerfil;
  permisos: Record<string, { ver?: boolean; editar?: boolean }>;
  activo: boolean;
  fechaCreacion?: string | null;
}

@Component({
  selector: 'app-admin-perfil-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, MessageBoxComponent],
  templateUrl: './admin-perfil-drawer.component.html',
  styleUrl: './admin-perfil-drawer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AdminPerfilDrawerComponent {
  @Input({ required: true }) editor!: PerfilEditorState;
  @Input() permisoEfectivoFn!: (modulo: ModuloPermiso, tipo: 'ver' | 'editar') => boolean;
  @Input() perfilesExistentes: readonly PerfilAcceso[] = [];
  @Input() guardando = false;
  /** Bloquea cerrar el drawer mientras hay un MessageBox de error encima. */
  @Input() bloquearCierre = false;

  @Output() cerrar = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<void>();
  @Output() editorChange = new EventEmitter<Partial<PerfilEditorState>>();
  @Output() alternarPermiso = new EventEmitter<{ modulo: ModuloPermiso; tipo: 'ver' | 'editar' }>();

  readonly modulosPermiso = MODULOS_PERMISO;
  readonly etiquetasModulo = ETIQUETAS_MODULO_PERMISO;
  readonly rolesBase: readonly RolBasePerfil[] = [
    'admin_sistema',
    'admin_remuneraciones',
    'operador_remuneraciones',
    'consulta_remuneraciones',
  ];

  readonly formTocado = signal(false);

  readonly tituloModal = computed(() =>
    this.editor.nombre.trim() || (this.editor.idPerfil ? 'Editar perfil de acceso' : 'Nuevo perfil de acceso'),
  );

  readonly subtituloModal = computed(() =>
    this.editor.idPerfil
      ? 'Configure el nivel base y los permisos por módulo.'
      : 'Defina nombre, nivel base y permisos para asignar a usuarios.',
  );

  readonly resumenPermisos = computed(() => {
    let ver = 0;
    let editar = 0;
    for (const modulo of this.modulosPermiso) {
      if (this.permisoEfectivoFn(modulo, 'ver')) ver += 1;
      if (this.permisoEfectivoFn(modulo, 'editar')) editar += 1;
    }
    return { ver, editar, total: this.modulosPermiso.length };
  });

  readonly validacion = computed(() =>
    validarFormularioPerfil({
      nombre: this.editor.nombre,
      descripcion: this.editor.descripcion,
      idPerfil: this.editor.idPerfil,
      perfilesExistentes: this.perfilesExistentes,
      modulosVisibles: this.resumenPermisos().ver,
    }),
  );

  readonly puedeGuardar = computed(() => this.validacion().valido);

  readonly accionesModal = computed<MessageBoxAction[]>(() => [
    { label: 'Cancelar', role: 'ghost', value: 'cancelar' },
    {
      label: this.guardando ? 'Guardando…' : 'Guardar perfil',
      role: 'primary',
      value: 'guardar',
      disabled: this.guardando || !this.puedeGuardar(),
    },
  ]);

  formatearFecha(iso: string | null | undefined): string {
    return iso ? new Date(iso).toLocaleString('es-CL') : '—';
  }

  etiquetaRol(rolBase: string): string {
    return etiquetaRolBase(rolBase);
  }

  mostrarError(campo: 'nombre' | 'descripcion' | 'permisos' | 'general'): string | null {
    if (!this.formTocado()) return null;
    return this.validacion().errores[campo];
  }

  marcarTocado(): void {
    this.formTocado.set(true);
  }

  onAccionModal(valor: string): void {
    if (valor === 'cancelar') {
      this.cerrar.emit();
      return;
    }
    if (valor === 'guardar') {
      this.emitirGuardar();
    }
  }

  emitirGuardar(): void {
    this.formTocado.set(true);
    if (!this.puedeGuardar()) return;
    this.guardar.emit();
  }

  emitirCambio(partial: Partial<PerfilEditorState>): void {
    this.editorChange.emit(partial);
  }
}
