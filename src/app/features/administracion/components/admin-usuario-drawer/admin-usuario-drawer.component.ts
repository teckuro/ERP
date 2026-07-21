import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewEncapsulation,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  MessageBoxComponent,
  type MessageBoxAction,
} from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import type { PerfilAcceso, UsuarioErp } from '../../models/administracion.model';
import {
  buscarPerfil,
  etiquetaEstadoUsuario,
  etiquetaRolBase,
  generarPasswordTemporal,
  nombrePerfil,
  resumenAccesoUsuario,
  tiempoRelativo,
  validarFormularioCrearUsuario,
} from '../../rules/administracion.rules';

export type AdminUsuarioDrawerModo = 'crear' | 'editar';

@Component({
  selector: 'app-admin-usuario-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, MessageBoxComponent],
  templateUrl: './admin-usuario-drawer.component.html',
  styleUrl: './admin-usuario-drawer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AdminUsuarioDrawerComponent implements OnChanges {
  @Input({ required: true }) modo!: AdminUsuarioDrawerModo;
  @Input() usuario: UsuarioErp | null = null;
  @Input() perfiles: readonly PerfilAcceso[] = [];
  @Input() guardando = false;
  /** Bloquea cerrar el drawer mientras hay un MessageBox de error encima. */
  @Input() bloquearCierre = false;

  @Output() cerrar = new EventEmitter<void>();
  @Output() crear = new EventEmitter<{
    email: string;
    nombre: string;
    password: string;
    idPerfil: number;
  }>();
  @Output() cambiarPerfil = new EventEmitter<{ userId: string; idPerfil: number }>();
  @Output() desactivar = new EventEmitter<void>();
  @Output() reactivar = new EventEmitter<void>();

  readonly email = signal('');
  readonly nombre = signal('');
  readonly password = signal('');
  readonly idPerfil = signal<number | null>(null);
  readonly formTocado = signal(false);

  readonly perfilesActivos = computed(() => this.perfiles.filter((p) => p.activo));

  readonly perfilSeleccionado = computed(() => buscarPerfil(this.perfiles, this.idPerfil()));

  readonly perfilActual = computed(() =>
    this.modo === 'editar' && this.usuario
      ? buscarPerfil(this.perfiles, this.usuario.idPerfil)
      : null,
  );

  readonly perfilCambiara = computed(() => {
    const u = this.usuario;
    const id = this.idPerfil();
    return this.modo === 'editar' && u != null && id != null && id !== u.idPerfil;
  });

  readonly validacionCrear = computed(() =>
    validarFormularioCrearUsuario({
      email: this.email(),
      nombre: this.nombre(),
      password: this.password(),
      idPerfil: this.idPerfil(),
      perfilesActivos: this.perfilesActivos().length,
    }),
  );

  readonly puedeCrear = computed(() => this.validacionCrear().valido);

  readonly tituloModal = computed(() => {
    if (this.modo === 'editar' && this.usuario) {
      return this.usuario.nombre?.trim() || this.usuario.email || 'Usuario';
    }
    return 'Crear usuario';
  });

  readonly subtituloModal = computed(() => {
    if (this.modo === 'crear') {
      return 'Complete los datos de acceso. Entregue la contraseña temporal por un canal seguro.';
    }
    return this.usuario?.email ?? 'Revise el acceso y el perfil asignado.';
  });

  readonly accionesModal = computed<MessageBoxAction[]>(() => {
    if (this.modo === 'crear') {
      return [
        { label: 'Cancelar', role: 'ghost', value: 'cancelar' },
        {
          label: this.guardando ? 'Creando…' : 'Crear usuario',
          role: 'primary',
          value: 'crear',
          disabled: this.guardando || !this.puedeCrear(),
        },
      ];
    }

    const u = this.usuario;
    const izquierda: MessageBoxAction[] = u?.desactivado
      ? [{ label: 'Reactivar acceso', role: 'ghost', value: 'reactivar', align: 'left', disabled: this.guardando }]
      : [
          {
            label: 'Desactivar acceso',
            role: 'danger',
            value: 'desactivar',
            align: 'left',
            disabled: this.guardando,
          },
        ];

    return [
      ...izquierda,
      { label: 'Cancelar', role: 'ghost', value: 'cancelar' },
      {
        label: this.guardando ? 'Guardando…' : 'Cambiar perfil',
        role: 'primary',
        value: 'cambiar-perfil',
        disabled: this.guardando || this.idPerfil() == null || !this.perfilCambiara(),
      },
    ];
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['modo'] || changes['usuario']) {
      this.resetFormulario();
      this.formTocado.set(false);
    }
  }

  etiquetaPerfil(idPerfil: number | null): string {
    return nombrePerfil(this.perfiles, idPerfil);
  }

  etiquetaRol(rolBase: string | null | undefined): string {
    return rolBase ? etiquetaRolBase(rolBase) : 'Sin definir';
  }

  etiquetaEstado(usuario: UsuarioErp): string {
    return etiquetaEstadoUsuario(usuario);
  }

  resumenAcceso(usuario: UsuarioErp): string {
    return resumenAccesoUsuario(usuario);
  }

  formatearFecha(iso: string | null): string {
    return iso ? new Date(iso).toLocaleString('es-CL') : '—';
  }

  textoTiempoRelativo(iso: string | null): string {
    return tiempoRelativo(iso);
  }

  mostrarError(campo: 'email' | 'nombre' | 'password' | 'idPerfil' | 'general'): string | null {
    if (!this.formTocado()) return null;
    return this.validacionCrear().errores[campo];
  }

  generarPassword(): void {
    this.password.set(generarPasswordTemporal());
    this.formTocado.set(true);
  }

  marcarTocado(): void {
    this.formTocado.set(true);
  }

  onAccionModal(valor: string): void {
    switch (valor) {
      case 'cancelar':
        this.cerrar.emit();
        break;
      case 'crear':
        this.emitirCrear();
        break;
      case 'cambiar-perfil':
        this.emitirCambiarPerfil();
        break;
      case 'desactivar':
        this.desactivar.emit();
        break;
      case 'reactivar':
        this.reactivar.emit();
        break;
      default:
        break;
    }
  }

  emitirCrear(): void {
    this.formTocado.set(true);
    const idPerfil = this.idPerfil();
    if (!this.puedeCrear() || idPerfil == null) return;
    this.crear.emit({
      email: this.email().trim().toLowerCase(),
      nombre: this.nombre().trim(),
      password: this.password(),
      idPerfil,
    });
  }

  emitirCambiarPerfil(): void {
    const u = this.usuario;
    const idPerfil = this.idPerfil();
    if (!u || idPerfil == null) return;
    this.cambiarPerfil.emit({ userId: u.id, idPerfil });
  }

  private resetFormulario(): void {
    if (this.modo === 'crear') {
      this.email.set('');
      this.nombre.set('');
      this.password.set('');
      this.idPerfil.set(this.perfilesActivos()[0]?.idPerfil ?? null);
      return;
    }
    const u = this.usuario;
    this.email.set(u?.email ?? '');
    this.nombre.set(u?.nombre ?? '');
    this.password.set('');
    this.idPerfil.set(u?.idPerfil ?? this.perfilesActivos()[0]?.idPerfil ?? null);
  }
}
