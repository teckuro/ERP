import {
  combinarPermisosPerfil,
  normalizarPermisosFinos,
  permisosPorDefectoDesdeRol,
} from '../../../core/auth/erp-permisos-modulos.rules';
import type { PerfilAcceso } from '../models/administracion.model';
import {
  etiquetaEstadoUsuario,
  etiquetaRolBase,
  nombrePerfil,
  perfilListoParaGuardar,
  resumenAccesoUsuario,
  tiempoRelativo,
  validarFormularioCrearUsuario,
  validarFormularioPerfil,
  armarVistaPreviaDocumento,
} from './administracion.rules';

describe('administracion.rules', () => {
  it('etiquetaRolBase entrega etiquetas RRHH sin nombres técnicos', () => {
    expect(etiquetaRolBase('admin_sistema')).toBe('Administración del sistema');
    expect(etiquetaRolBase('consulta_remuneraciones')).toBe('Solo consulta');
    expect(etiquetaRolBase('otro')).toBe('Sin definir');
  });

  it('etiquetaEstadoUsuario distingue activo de desactivado', () => {
    expect(etiquetaEstadoUsuario({ desactivado: false })).toBe('Activo');
    expect(etiquetaEstadoUsuario({ desactivado: true })).toBe('Desactivado');
  });

  it('nombrePerfil resuelve nombre, sin perfil y perfil no vigente', () => {
    const perfiles = [
      { idPerfil: 1, nombre: 'Operador de remuneraciones' } as PerfilAcceso,
    ];
    expect(nombrePerfil(perfiles, 1)).toBe('Operador de remuneraciones');
    expect(nombrePerfil(perfiles, null)).toBe('Sin perfil asignado');
    expect(nombrePerfil(perfiles, 99)).toBe('Perfil no vigente');
  });

  it('perfilListoParaGuardar exige nombre y rol base', () => {
    expect(perfilListoParaGuardar({ nombre: 'Operador', rolBase: 'operador_remuneraciones' })).toBe(true);
    expect(perfilListoParaGuardar({ nombre: '  ', rolBase: 'operador_remuneraciones' })).toBe(false);
    expect(perfilListoParaGuardar({ nombre: 'Operador', rolBase: null })).toBe(false);
  });

  it('resumenAccesoUsuario describe vigencia en lenguaje RRHH', () => {
    expect(resumenAccesoUsuario({ desactivado: true, ultimoAcceso: null })).toContain('No puede iniciar');
    expect(resumenAccesoUsuario({ desactivado: false, ultimoAcceso: null })).toContain('Aún no ha iniciado');
    expect(resumenAccesoUsuario({ desactivado: false, ultimoAcceso: '2026-01-01T12:00:00Z' })).toContain('Puede iniciar');
  });

  it('tiempoRelativo devuelve texto legible o sin registro', () => {
    expect(tiempoRelativo(null)).toBe('Sin registro');
    expect(tiempoRelativo('invalid')).toBe('Sin registro');
  });

  it('validarFormularioCrearUsuario exige correo, nombre, password y perfil', () => {
    const invalido = validarFormularioCrearUsuario({
      email: 'correo-invalido',
      nombre: 'A',
      password: '123',
      idPerfil: null,
      perfilesActivos: 1,
    });
    expect(invalido.valido).toBe(false);
    expect(invalido.errores.email).toBeTruthy();
    expect(invalido.errores.nombre).toBeTruthy();
    expect(invalido.errores.password).toBeTruthy();
    expect(invalido.errores.idPerfil).toBeTruthy();

    const valido = validarFormularioCrearUsuario({
      email: 'usuario@empresa.cl',
      nombre: 'María González',
      password: 'Temporal12',
      idPerfil: 2,
      perfilesActivos: 1,
    });
    expect(valido.valido).toBe(true);
  });

  it('validarFormularioPerfil evita nombres duplicados y perfiles sin módulos visibles', () => {
    const perfiles = [{ idPerfil: 1, nombre: 'Operador' } as PerfilAcceso];
    const duplicado = validarFormularioPerfil({
      nombre: 'operador',
      descripcion: '',
      idPerfil: null,
      perfilesExistentes: perfiles,
      modulosVisibles: 3,
    });
    expect(duplicado.valido).toBe(false);
    expect(duplicado.errores.nombre).toContain('Ya existe');

    const sinModulos = validarFormularioPerfil({
      nombre: 'Consulta externa',
      descripcion: '',
      idPerfil: null,
      perfilesExistentes: perfiles,
      modulosVisibles: 0,
    });
    expect(sinModulos.valido).toBe(false);
    expect(sinModulos.errores.permisos).toBeTruthy();
  });

  it('armarVistaPreviaDocumento respeta toggles de visibilidad', () => {
    const vista = armarVistaPreviaDocumento({
      config: {
        logoUrl: 'https://logo.test/logo.png',
        mostrarRut: false,
        mostrarDireccion: true,
        mostrarRepresentante: false,
        textoPie: 'Documento confidencial',
        nombreFirmaEmpleador: 'Gerente General',
      },
      empresa: { razonSocial: 'Empresa Demo SpA', rut: '76.543.210', dv: 'K' },
      detalle: { direccion: 'Av. Providencia 123', representanteLegal: 'Juan Pérez' },
    });
    expect(vista.razonSocial).toBe('Empresa Demo SpA');
    expect(vista.rut).toBeNull();
    expect(vista.direccion).toBe('Av. Providencia 123');
    expect(vista.representanteLegal).toBeNull();
    expect(vista.textoPie).toBe('Documento confidencial');
  });
});

describe('erp-permisos-modulos.rules', () => {
  it('el rol consulta no puede editar ningún módulo', () => {
    const permisos = permisosPorDefectoDesdeRol('consulta_remuneraciones');
    expect(permisos.empleados.ver).toBe(true);
    expect(permisos.empleados.editar).toBe(false);
    expect(permisos.nominas.editar).toBe(false);
    expect(permisos.administracion.ver).toBe(false);
  });

  it('solo admin_sistema ve el módulo de administración', () => {
    expect(permisosPorDefectoDesdeRol('admin_sistema').administracion.editar).toBe(true);
    expect(permisosPorDefectoDesdeRol('admin_remuneraciones').administracion.ver).toBe(false);
    expect(permisosPorDefectoDesdeRol('operador_remuneraciones').administracion.ver).toBe(false);
  });

  it('combinarPermisosPerfil aplica ajustes finos sobre el rol base', () => {
    const base = permisosPorDefectoDesdeRol('operador_remuneraciones');
    const combinado = combinarPermisosPerfil(base, {
      parametros: { editar: true },
      empleados: { ver: false, editar: false },
    });
    expect(combinado.parametros.editar).toBe(true);
    expect(combinado.parametros.ver).toBe(true);
    expect(combinado.empleados.ver).toBe(false);
    expect(combinado.nominas.editar).toBe(true);
  });

  it('los ajustes finos no habilitan administración de seguridad', () => {
    const base = permisosPorDefectoDesdeRol('operador_remuneraciones');
    const combinado = combinarPermisosPerfil(base, {
      administracion: { ver: true, editar: true },
    });
    expect(combinado.administracion.ver).toBe(false);
    expect(combinado.administracion.editar).toBe(false);
  });

  it('normalizarPermisosFinos ignora claves y tipos extraños', () => {
    const finos = normalizarPermisosFinos({
      empleados: { ver: true, editar: 'si' },
      desconocido: { ver: true },
      nominas: 'todo',
    });
    expect(finos).toEqual({ empleados: { ver: true } });
    expect(normalizarPermisosFinos(null)).toEqual({});
    expect(normalizarPermisosFinos([1, 2])).toEqual({});
  });
});
