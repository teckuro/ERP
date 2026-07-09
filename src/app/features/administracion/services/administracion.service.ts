import { Injectable, inject } from '@angular/core';

import { DocumentoLiquidacionService } from '../../../core/services/documento-liquidacion.service';
import { EmpresaActivaService } from '../../../core/services/empresa-activa.service';
import { AdminUsuariosClient } from '../data-access/admin-usuarios.client';
import { AdministracionRepository } from '../data-access/administracion.repository';
import type {
  ConfigDocumentoLiquidacion,
  CrearUsuarioInput,
  GuardarPerfilAccesoInput,
  PerfilAcceso,
  UsuarioErp,
} from '../models/administracion.model';
import { validarFormularioCrearUsuario } from '../rules/administracion.rules';

@Injectable({ providedIn: 'root' })
export class AdministracionService {
  private readonly repository = inject(AdministracionRepository);
  private readonly usuariosClient = inject(AdminUsuariosClient);
  private readonly empresaActiva = inject(EmpresaActivaService);
  private readonly documentoLiquidacion = inject(DocumentoLiquidacionService);

  listarPerfiles(incluirInactivos = false): Promise<PerfilAcceso[]> {
    return this.repository.listarPerfiles(incluirInactivos);
  }

  guardarPerfil(input: GuardarPerfilAccesoInput): Promise<PerfilAcceso> {
    if (input.idPerfil == null) {
      if (!input.nombre?.trim()) {
        return Promise.reject(new Error('Debe indicar el nombre del perfil.'));
      }
      if (!input.rolBase) {
        return Promise.reject(new Error('Debe indicar el nivel de acceso base.'));
      }
    }
    return this.repository.guardarPerfil(input);
  }

  listarUsuarios(): Promise<UsuarioErp[]> {
    return this.usuariosClient.listar();
  }

  crearUsuario(input: CrearUsuarioInput): Promise<UsuarioErp> {
    const email = input.email.trim().toLowerCase();
    const nombre = input.nombre.trim();
    const validacion = validarFormularioCrearUsuario({
      email,
      nombre,
      password: input.password ?? '',
      idPerfil: input.idPerfil ?? null,
      perfilesActivos: input.idPerfil ? 1 : 0,
    });
    if (!validacion.valido) {
      const primerError =
        validacion.errores.general ??
        validacion.errores.email ??
        validacion.errores.nombre ??
        validacion.errores.password ??
        validacion.errores.idPerfil ??
        'Revise los datos del usuario.';
      return Promise.reject(new Error(primerError));
    }
    return this.usuariosClient.crear({ ...input, email, nombre });
  }

  asignarPerfil(userId: string, idPerfil: number): Promise<UsuarioErp> {
    return this.usuariosClient.asignarPerfil(userId, idPerfil);
  }

  desactivarUsuario(userId: string): Promise<UsuarioErp> {
    return this.usuariosClient.desactivar(userId);
  }

  reactivarUsuario(userId: string): Promise<UsuarioErp> {
    return this.usuariosClient.reactivar(userId);
  }

  obtenerConfigDocumento(): Promise<ConfigDocumentoLiquidacion | null> {
    return this.repository.obtenerConfigDocumento();
  }

  async guardarConfigDocumento(config: ConfigDocumentoLiquidacion): Promise<ConfigDocumentoLiquidacion> {
    const guardada = await this.repository.guardarConfigDocumento(config);
    this.documentoLiquidacion.limpiar();
    return guardada;
  }

  async subirLogo(archivo: File): Promise<string> {
    const empresa = await this.empresaActiva.asegurarCargada();
    if (!empresa) {
      throw new Error('No hay empresa asignada en tu sesión.');
    }
    const tipo = archivo.type.toLowerCase();
    if (tipo !== 'image/png' && tipo !== 'image/jpeg' && tipo !== 'image/jpg') {
      throw new Error('El logo debe ser PNG o JPG.');
    }
    if (archivo.size > 1024 * 1024) {
      throw new Error('El logo no debe superar 1 MB.');
    }
    return this.repository.subirLogo(empresa.idEmpresa, archivo);
  }

  async obtenerDetalleEmpresaDocumento(): Promise<{
    direccion: string | null;
    representanteLegal: string | null;
  }> {
    const empresa = await this.empresaActiva.asegurarCargada();
    if (!empresa) {
      return { direccion: null, representanteLegal: null };
    }
    return this.repository.obtenerDetalleEmpresaDocumento(empresa.idEmpresa);
  }
}
