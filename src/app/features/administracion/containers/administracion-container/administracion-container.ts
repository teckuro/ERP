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
import { FormsModule } from '@angular/forms';

import {
  ETIQUETAS_MODULO_PERMISO,
  MODULOS_PERMISO,
  combinarPermisosPerfil,
  permisosPorDefectoDesdeRol,
  type ModuloPermiso,
  type PermisosFinosPerfil,
} from '../../../../core/auth/erp-permisos-modulos.rules';
import { mensajeErrorSupabaseParaUsuario } from '../../../../core/errors/erp-supabase-user-message';
import { EmpresaActivaService } from '../../../../core/services/empresa-activa.service';
import { bindShellPageContext } from '../../../../layout/shell-page-context.binding';
import type { ShellPageContext } from '../../../../layout/shell-page-context.service';
import {
  DataGridCellDirective,
  DataGridColumn,
  DataGridComponent,
  DataGridFilter,
} from '../../../../shared/components/ui/data-grid';
import { MessageBoxComponent } from '../../../../shared/components/ui/feedback/message-box/message-box.component';
import { WorkspaceLoadingComponent } from '../../../../shared/components/ui/feedback/workspace-loading/workspace-loading.component';
import {
  AdminPerfilDrawerComponent,
  type PerfilEditorState,
} from '../../components/admin-perfil-drawer/admin-perfil-drawer.component';
import { AdminDocumentoPreviewSheetComponent } from '../../components/admin-documento-preview-sheet/admin-documento-preview-sheet.component';
import {
  AdminUsuarioDrawerComponent,
  type AdminUsuarioDrawerModo,
} from '../../components/admin-usuario-drawer/admin-usuario-drawer.component';
import type {
  ConfigDocumentoLiquidacion,
  PerfilAcceso,
  RolBasePerfil,
  UsuarioErp,
} from '../../models/administracion.model';
import { CONFIG_DOCUMENTO_DEFECTO } from '../../models/administracion.model';
import {
  armarVistaPreviaDocumento,
  etiquetaEstadoUsuario,
  etiquetaRolBase,
  nombrePerfil,
  validarFormularioPerfil,
} from '../../rules/administracion.rules';
import { AdministracionService } from '../../services/administracion.service';

type AdminTab = 'usuarios' | 'perfiles' | 'documento';

type UsuarioGridRow = UsuarioErp & {
  busqueda: string;
  filtroEstado: string;
  perfilLabel: string;
  ultimoAccesoLabel: string;
};

type PerfilGridRow = PerfilAcceso & {
  busqueda: string;
  filtroEstado: string;
  rolLabel: string;
};

const EXITO_AUTO_DESCARTE_MS = 4000;

@Component({
  selector: 'app-administracion-container',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataGridComponent,
    DataGridCellDirective,
    MessageBoxComponent,
    WorkspaceLoadingComponent,
    AdminUsuarioDrawerComponent,
    AdminPerfilDrawerComponent,
    AdminDocumentoPreviewSheetComponent,
  ],
  templateUrl: './administracion-container.html',
  styleUrl: './administracion-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdministracionContainer implements OnInit {
  private readonly service = inject(AdministracionService);
  private readonly empresaActiva = inject(EmpresaActivaService);
  private readonly destroyRef = inject(DestroyRef);

  readonly tabActiva = signal<AdminTab>('usuarios');
  readonly cargaInicial = signal(true);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  readonly usuarios = signal<UsuarioErp[]>([]);
  readonly usuariosNoDisponibles = signal<string | null>(null);
  readonly usuarioDrawerModo = signal<AdminUsuarioDrawerModo | null>(null);
  readonly usuarioSeleccionado = signal<UsuarioErp | null>(null);
  readonly usuarioParaDesactivar = signal<UsuarioErp | null>(null);

  readonly perfiles = signal<PerfilAcceso[]>([]);
  readonly perfilEditor = signal<PerfilEditorState | null>(null);

  readonly configDocumento = signal<ConfigDocumentoLiquidacion>({ ...CONFIG_DOCUMENTO_DEFECTO });
  readonly configDocumentoSnapshot = signal<ConfigDocumentoLiquidacion>({ ...CONFIG_DOCUMENTO_DEFECTO });
  readonly subiendoLogo = signal(false);
  readonly empresaDetalleDocumento = signal<{
    direccion: string | null;
    representanteLegal: string | null;
  } | null>(null);
  readonly logoPreviewRoto = signal(false);
  readonly tabDocumentoSalidaPendiente = signal<AdminTab | null>(null);

  readonly modulosPermiso = MODULOS_PERMISO;
  readonly etiquetasModulo = ETIQUETAS_MODULO_PERMISO;

  private exitoTimer: ReturnType<typeof setTimeout> | null = null;

  readonly perfilesActivos = computed(() => this.perfiles().filter((p) => p.activo));

  readonly filasUsuarios = computed<UsuarioGridRow[]>(() =>
    this.usuarios().map((usuario) => ({
      ...usuario,
      busqueda: [usuario.email, usuario.nombre, nombrePerfil(this.perfiles(), usuario.idPerfil)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase(),
      filtroEstado: usuario.desactivado ? 'desactivado' : 'activo',
      perfilLabel: nombrePerfil(this.perfiles(), usuario.idPerfil),
      ultimoAccesoLabel: this.formatearFecha(usuario.ultimoAcceso),
    })),
  );

  readonly filasPerfiles = computed<PerfilGridRow[]>(() =>
    this.perfiles().map((perfil) => ({
      ...perfil,
      busqueda: [perfil.nombre, perfil.descripcion, etiquetaRolBase(perfil.rolBase)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase(),
      filtroEstado: perfil.activo ? 'activo' : 'inactivo',
      rolLabel: etiquetaRolBase(perfil.rolBase),
    })),
  );

  readonly permisosEfectivosEditor = computed(() => {
    const editor = this.perfilEditor();
    if (!editor) return null;
    return combinarPermisosPerfil(permisosPorDefectoDesdeRol(editor.rolBase), editor.permisos);
  });

  readonly puedeGuardarPerfil = computed(() => {
    const editor = this.perfilEditor();
    if (!editor) return false;
    const permisos = this.permisosEfectivosEditor();
    const modulosVisibles = permisos
      ? Object.values(permisos).filter((modulo) => modulo.ver).length
      : 0;
    return validarFormularioPerfil({
      nombre: editor.nombre,
      descripcion: editor.descripcion,
      idPerfil: editor.idPerfil,
      perfilesExistentes: this.perfiles(),
      modulosVisibles,
    }).valido;
  });

  readonly vistaPreviaDocumento = computed(() =>
    armarVistaPreviaDocumento({
      config: this.configDocumento(),
      empresa: this.empresaActiva.empresa(),
      detalle: this.empresaDetalleDocumento(),
    }),
  );

  readonly documentoModificado = computed(() => {
    const actual = this.configDocumento();
    const snapshot = this.configDocumentoSnapshot();
    return JSON.stringify(actual) !== JSON.stringify(snapshot);
  });

  readonly configDocumentoEstado = computed(() => {
    const vista = this.vistaPreviaDocumento();
    const tieneLogo = !!vista.logoUrl && !this.logoPreviewRoto();
    const tienePie = !!(vista.textoPie || vista.nombreFirmaEmpleador);
    const tieneEncabezado = !!(vista.rut || vista.direccion || tieneLogo);
    if (tieneEncabezado && tienePie) {
      return 'Documento con encabezado y pie configurados';
    }
    if (tieneEncabezado || tienePie) {
      return 'Documento parcialmente configurado';
    }
    return 'Sin configuración: se emite con datos por defecto';
  });

  readonly columnsUsuarios: DataGridColumn<UsuarioGridRow>[] = [
    { id: 'email', header: 'Correo', field: 'email', sortable: true, format: (v) => String(v ?? '—') },
    { id: 'nombre', header: 'Nombre', field: 'nombre', sortable: true, format: (v) => String(v ?? '—') },
    {
      id: 'perfil',
      header: 'Perfil',
      field: 'perfilLabel',
      sortable: true,
      format: (v) => String(v ?? '—'),
    },
    { id: 'estado', header: 'Estado', field: 'filtroEstado', sortable: true },
    {
      id: 'ultimoAcceso',
      header: 'Último acceso',
      field: 'ultimoAccesoLabel',
      sortable: true,
      format: (v) => String(v ?? '—'),
    },
  ];

  readonly filtersUsuarios: DataGridFilter<UsuarioGridRow>[] = [
    {
      id: 'estado',
      label: 'Estado',
      field: 'filtroEstado',
      type: 'select',
      emptyLabel: 'Todos',
      options: [
        { label: 'Activo', value: 'activo' },
        { label: 'Desactivado', value: 'desactivado' },
      ],
    },
    {
      id: 'busqueda',
      label: 'Búsqueda',
      field: 'busqueda',
      type: 'text',
      placeholder: 'Correo, nombre o perfil',
    },
  ];

  readonly columnsPerfiles: DataGridColumn<PerfilGridRow>[] = [
    { id: 'nombre', header: 'Perfil', field: 'nombre', sortable: true },
    {
      id: 'rolBase',
      header: 'Nivel de acceso',
      field: 'rolLabel',
      sortable: true,
      format: (v) => String(v ?? '—'),
    },
    {
      id: 'descripcion',
      header: 'Descripción',
      field: 'descripcion',
      sortable: true,
      format: (v) => String(v ?? '—'),
    },
    { id: 'estado', header: 'Estado', field: 'filtroEstado', sortable: true },
  ];

  readonly filtersPerfiles: DataGridFilter<PerfilGridRow>[] = [
    {
      id: 'estado',
      label: 'Estado',
      field: 'filtroEstado',
      type: 'select',
      emptyLabel: 'Todos',
      options: [
        { label: 'Activo', value: 'activo' },
        { label: 'Inactivo', value: 'inactivo' },
      ],
    },
    {
      id: 'busqueda',
      label: 'Búsqueda',
      field: 'busqueda',
      type: 'text',
      placeholder: 'Nombre, descripción o nivel',
    },
  ];

  constructor() {
    bindShellPageContext(this.destroyRef, () => this.computeShellContext(), {
      onPrimaryAction: () => this.accionPrimariaShell(),
    });
    this.destroyRef.onDestroy(() => {
      if (this.exitoTimer) clearTimeout(this.exitoTimer);
    });
  }

  ngOnInit(): void {
    void this.cargarTodo();
    void this.empresaActiva.asegurarCargada();
  }

  private computeShellContext(): ShellPageContext {
    const tab = this.tabActiva();
    const subtitulos: Record<AdminTab, string> = {
      usuarios: 'Personas con acceso al sistema y perfiles asignados.',
      perfiles: 'Niveles de acceso y permisos por módulo.',
      documento: 'Logo, encabezado y pie del comprobante de liquidación.',
    };
    const ctx: ShellPageContext = {
      breadcrumbs: [{ label: 'Administrador' }],
      pageTitle: 'Administrador',
      pageSubtitle: subtitulos[tab],
    };
    if (tab === 'documento') {
      ctx.primaryAction = {
        label: 'Guardar configuración',
        actionId: 'guardar-documento',
        disabled: this.guardando() || !this.documentoModificado(),
      };
    }
    return ctx;
  }

  private accionPrimariaShell(): void {
    if (this.tabActiva() === 'documento') {
      void this.guardarConfigDocumento();
    }
  }

  cambiarTab(tab: AdminTab): void {
    if (this.tabActiva() === 'documento' && tab !== 'documento' && this.documentoModificado()) {
      this.tabDocumentoSalidaPendiente.set(tab);
      return;
    }
    this.aplicarCambioTab(tab);
  }

  private aplicarCambioTab(tab: AdminTab): void {
    this.tabActiva.set(tab);
    this.mensajeError.set(null);
    this.limpiarExito();
    if (tab === 'documento') {
      void this.cargarDetalleEmpresaDocumento();
    }
  }

  confirmarSalidaDocumentoDescartar(): void {
    const destino = this.tabDocumentoSalidaPendiente();
    if (!destino) return;
    this.descartarConfigDocumento();
    this.tabDocumentoSalidaPendiente.set(null);
    this.aplicarCambioTab(destino);
  }

  cancelarSalidaDocumento(): void {
    this.tabDocumentoSalidaPendiente.set(null);
  }

  trackUsuario = (_: number, row: UsuarioGridRow): string => row.id;
  trackPerfil = (_: number, row: PerfilGridRow): number => row.idPerfil;

  async cargarTodo(): Promise<void> {
    this.cargando.set(true);
    this.mensajeError.set(null);
    try {
      const [perfiles, config] = await Promise.all([
        this.service.listarPerfiles(true),
        this.service.obtenerConfigDocumento(),
      ]);
      this.perfiles.set(perfiles);
      const configResuelta = config ?? { ...CONFIG_DOCUMENTO_DEFECTO };
      this.configDocumento.set(configResuelta);
      this.configDocumentoSnapshot.set({ ...configResuelta });

      await this.cargarDetalleEmpresaDocumento();

      try {
        this.usuarios.set(await this.service.listarUsuarios());
        this.usuariosNoDisponibles.set(null);
      } catch (err) {
        this.usuariosNoDisponibles.set(
          mensajeErrorSupabaseParaUsuario(err, 'cargar los usuarios del sistema'),
        );
      }
    } catch (err) {
      this.mensajeError.set(
        mensajeErrorSupabaseParaUsuario(err, 'cargar la administración'),
      );
    } finally {
      this.cargando.set(false);
      this.cargaInicial.set(false);
    }
  }

  async recargarUsuarios(): Promise<void> {
    if (this.usuariosNoDisponibles()) return;
    try {
      this.usuarios.set(await this.service.listarUsuarios());
      this.usuariosNoDisponibles.set(null);
    } catch (err) {
      this.usuariosNoDisponibles.set(
        mensajeErrorSupabaseParaUsuario(err, 'cargar los usuarios del sistema'),
      );
    }
  }

  async recargarPerfiles(): Promise<void> {
    this.perfiles.set(await this.service.listarPerfiles(true));
  }

  // ------------------------------------------------------------------
  // Mensajes
  // ------------------------------------------------------------------

  private mostrarExito(mensaje: string): void {
    this.mensajeExito.set(mensaje);
    if (this.exitoTimer) clearTimeout(this.exitoTimer);
    this.exitoTimer = setTimeout(() => {
      this.mensajeExito.set(null);
      this.exitoTimer = null;
    }, EXITO_AUTO_DESCARTE_MS);
  }

  limpiarExito(): void {
    if (this.exitoTimer) {
      clearTimeout(this.exitoTimer);
      this.exitoTimer = null;
    }
    this.mensajeExito.set(null);
  }

  // ------------------------------------------------------------------
  // Usuarios
  // ------------------------------------------------------------------

  etiquetaEstado(usuario: UsuarioErp): string {
    return etiquetaEstadoUsuario(usuario);
  }

  etiquetaEstadoChip(valor: string): string {
    return valor === 'activo' ? 'Activo' : valor === 'desactivado' ? 'Desactivado' : valor;
  }

  etiquetaEstadoPerfilChip(valor: string): string {
    return valor === 'activo' ? 'Activo' : valor === 'inactivo' ? 'Inactivo' : valor;
  }

  formatearFecha(iso: string | null): string {
    return iso ? new Date(iso).toLocaleString('es-CL') : '—';
  }

  abrirDrawerCrearUsuario(): void {
    this.usuarioSeleccionado.set(null);
    this.usuarioDrawerModo.set('crear');
  }

  abrirDrawerUsuario(usuario: UsuarioGridRow): void {
    this.usuarioSeleccionado.set(usuario);
    this.usuarioDrawerModo.set('editar');
  }

  cerrarDrawerUsuario(): void {
    this.usuarioDrawerModo.set(null);
    this.usuarioSeleccionado.set(null);
  }

  async confirmarCrearUsuario(payload: {
    email: string;
    nombre: string;
    password: string;
    idPerfil: number;
  }): Promise<void> {
    this.guardando.set(true);
    this.mensajeError.set(null);
    try {
      await this.service.crearUsuario(payload);
      this.cerrarDrawerUsuario();
      this.mostrarExito('Usuario creado. Entregue la contraseña temporal por un canal seguro.');
      await this.recargarUsuarios();
    } catch (err) {
      this.mensajeError.set(mensajeErrorSupabaseParaUsuario(err, 'crear el usuario'));
    } finally {
      this.guardando.set(false);
    }
  }

  async confirmarCambioPerfil(payload: { userId: string; idPerfil: number }): Promise<void> {
    this.guardando.set(true);
    this.mensajeError.set(null);
    try {
      await this.service.asignarPerfil(payload.userId, payload.idPerfil);
      this.cerrarDrawerUsuario();
      this.mostrarExito('Perfil actualizado. El cambio aplica al próximo inicio de sesión.');
      await this.recargarUsuarios();
    } catch (err) {
      this.mensajeError.set(mensajeErrorSupabaseParaUsuario(err, 'cambiar el perfil del usuario'));
    } finally {
      this.guardando.set(false);
    }
  }

  solicitarDesactivarDesdeDrawer(): void {
    const usuario = this.usuarioSeleccionado();
    if (usuario) this.usuarioParaDesactivar.set(usuario);
  }

  cancelarDesactivar(): void {
    this.usuarioParaDesactivar.set(null);
  }

  async confirmarDesactivar(): Promise<void> {
    const usuario = this.usuarioParaDesactivar();
    if (!usuario) return;
    this.guardando.set(true);
    this.mensajeError.set(null);
    try {
      await this.service.desactivarUsuario(usuario.id);
      this.usuarioParaDesactivar.set(null);
      this.cerrarDrawerUsuario();
      this.mostrarExito('Acceso desactivado.');
      await this.recargarUsuarios();
    } catch (err) {
      this.mensajeError.set(mensajeErrorSupabaseParaUsuario(err, 'desactivar el acceso'));
    } finally {
      this.guardando.set(false);
    }
  }

  async reactivarDesdeDrawer(): Promise<void> {
    const usuario = this.usuarioSeleccionado();
    if (!usuario) return;
    this.guardando.set(true);
    this.mensajeError.set(null);
    try {
      await this.service.reactivarUsuario(usuario.id);
      this.cerrarDrawerUsuario();
      this.mostrarExito('Acceso restaurado.');
      await this.recargarUsuarios();
    } catch (err) {
      this.mensajeError.set(mensajeErrorSupabaseParaUsuario(err, 'restaurar el acceso'));
    } finally {
      this.guardando.set(false);
    }
  }

  // ------------------------------------------------------------------
  // Perfiles
  // ------------------------------------------------------------------

  etiquetaRol(rolBase: string): string {
    return etiquetaRolBase(rolBase);
  }

  nuevoPerfil(): void {
    this.tabActiva.set('perfiles');
    this.perfilEditor.set({
      idPerfil: null,
      nombre: '',
      descripcion: '',
      rolBase: 'operador_remuneraciones',
      permisos: {},
      activo: true,
    });
  }

  abrirPerfil(perfil: PerfilGridRow): void {
    this.editarPerfil(perfil);
  }

  editarPerfil(perfil: PerfilAcceso): void {
    this.perfilEditor.set({
      idPerfil: perfil.idPerfil,
      nombre: perfil.nombre,
      descripcion: perfil.descripcion ?? '',
      rolBase: perfil.rolBase,
      permisos: { ...perfil.permisos },
      activo: perfil.activo,
      fechaCreacion: perfil.fechaCreacion,
    });
  }

  cerrarEditorPerfil(): void {
    this.perfilEditor.set(null);
  }

  actualizarEditor(cambio: Partial<PerfilEditorState>): void {
    const actual = this.perfilEditor();
    if (!actual) return;
    this.perfilEditor.set({ ...actual, ...cambio });
  }

  permisoEfectivo = (modulo: ModuloPermiso, tipo: 'ver' | 'editar'): boolean => {
    const efectivos = this.permisosEfectivosEditor();
    return efectivos ? efectivos[modulo][tipo] : false;
  };

  alternarPermisoDesdeDrawer(evento: { modulo: ModuloPermiso; tipo: 'ver' | 'editar' }): void {
    this.alternarPermiso(evento.modulo, evento.tipo);
  }

  alternarPermiso(modulo: ModuloPermiso, tipo: 'ver' | 'editar'): void {
    const editor = this.perfilEditor();
    if (!editor || modulo === 'administracion') return;
    const valorActual = this.permisoEfectivo(modulo, tipo);
    const ajusteActual = editor.permisos[modulo] ?? {};
    const nuevoAjuste = { ...ajusteActual, [tipo]: !valorActual };
    if (tipo === 'editar' && !valorActual) {
      nuevoAjuste.ver = true;
    }
    if (tipo === 'ver' && valorActual) {
      nuevoAjuste.editar = false;
    }
    this.actualizarEditor({ permisos: { ...editor.permisos, [modulo]: nuevoAjuste } });
  }

  async guardarPerfil(): Promise<void> {
    const editor = this.perfilEditor();
    if (!editor || !this.puedeGuardarPerfil()) return;
    this.guardando.set(true);
    this.mensajeError.set(null);
    try {
      await this.service.guardarPerfil({
        idPerfil: editor.idPerfil,
        nombre: editor.nombre.trim(),
        descripcion: editor.descripcion.trim() || null,
        rolBase: editor.rolBase,
        permisos: editor.permisos,
        activo: editor.activo,
      });
      this.perfilEditor.set(null);
      this.mostrarExito('Perfil guardado.');
      await this.recargarPerfiles();
    } catch (err) {
      this.mensajeError.set(mensajeErrorSupabaseParaUsuario(err, 'guardar el perfil'));
    } finally {
      this.guardando.set(false);
    }
  }

  // ------------------------------------------------------------------
  // Documento de liquidación
  // ------------------------------------------------------------------

  actualizarConfig(cambio: Partial<ConfigDocumentoLiquidacion>): void {
    this.configDocumento.set({ ...this.configDocumento(), ...cambio });
    if ('logoUrl' in cambio) {
      this.logoPreviewRoto.set(false);
    }
  }

  async cargarDetalleEmpresaDocumento(): Promise<void> {
    try {
      this.empresaDetalleDocumento.set(await this.service.obtenerDetalleEmpresaDocumento());
    } catch {
      this.empresaDetalleDocumento.set({ direccion: null, representanteLegal: null });
    }
  }

  imprimirPreviewDocumento(): void {
    window.print();
  }

  onLogoPreviewError(): void {
    this.logoPreviewRoto.set(true);
  }

  async onLogoSeleccionado(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo) return;
    this.subiendoLogo.set(true);
    this.mensajeError.set(null);
    try {
      const url = await this.service.subirLogo(archivo);
      this.actualizarConfig({ logoUrl: url });
      this.mostrarExito('Logo cargado. Guarde la configuración para aplicarlo.');
    } catch (err) {
      this.mensajeError.set(mensajeErrorSupabaseParaUsuario(err, 'subir el logo'));
    } finally {
      this.subiendoLogo.set(false);
    }
  }

  quitarLogo(): void {
    this.actualizarConfig({ logoUrl: null });
  }

  descartarConfigDocumento(): void {
    const snapshot = this.configDocumentoSnapshot();
    this.configDocumento.set({ ...snapshot });
    this.logoPreviewRoto.set(false);
  }

  async guardarConfigDocumento(): Promise<void> {
    if (!this.documentoModificado()) return;
    this.guardando.set(true);
    this.mensajeError.set(null);
    try {
      const guardada = await this.service.guardarConfigDocumento(this.configDocumento());
      this.configDocumento.set(guardada);
      this.configDocumentoSnapshot.set({ ...guardada });
      this.mostrarExito('Configuración del documento guardada.');
    } catch (err) {
      this.mensajeError.set(mensajeErrorSupabaseParaUsuario(err, 'guardar la configuración'));
    } finally {
      this.guardando.set(false);
    }
  }
}
