import type { PerfilAcceso, UsuarioErp } from '../models/administracion.model';

/** Etiqueta RRHH del nivel de acceso base (sin nombres técnicos). */
export function etiquetaRolBase(rolBase: string): string {
  switch (rolBase) {
    case 'admin_sistema':
      return 'Administración del sistema';
    case 'admin_remuneraciones':
      return 'Administración de remuneraciones';
    case 'operador_remuneraciones':
      return 'Operación diaria';
    case 'consulta_remuneraciones':
      return 'Solo consulta';
    default:
      return 'Sin definir';
  }
}

export function etiquetaEstadoUsuario(usuario: Pick<UsuarioErp, 'desactivado'>): string {
  return usuario.desactivado ? 'Desactivado' : 'Activo';
}

export function nombrePerfil(
  perfiles: readonly PerfilAcceso[],
  idPerfil: number | null,
): string {
  if (idPerfil == null) return 'Sin perfil asignado';
  const perfil = perfiles.find((p) => p.idPerfil === idPerfil);
  return perfil?.nombre ?? 'Perfil no vigente';
}

export function buscarPerfil(
  perfiles: readonly PerfilAcceso[],
  idPerfil: number | null,
): PerfilAcceso | null {
  if (idPerfil == null) return null;
  return perfiles.find((p) => p.idPerfil === idPerfil) ?? null;
}

/** Texto RRHH sobre la vigencia del acceso al sistema. */
export function resumenAccesoUsuario(usuario: Pick<UsuarioErp, 'desactivado' | 'ultimoAcceso'>): string {
  if (usuario.desactivado) {
    return 'No puede iniciar sesión hasta que se reactive su acceso.';
  }
  if (!usuario.ultimoAcceso) {
    return 'Aún no ha iniciado sesión con esta cuenta.';
  }
  return 'Puede iniciar sesión con su correo y contraseña.';
}

/** Tiempo relativo legible para RRHH (último acceso, creación). */
export function tiempoRelativo(iso: string | null): string {
  if (!iso) return 'Sin registro';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return 'Sin registro';

  const ahora = new Date();
  const diffMs = ahora.getTime() - fecha.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Hace un momento';
  if (diffMin < 60) return `Hace ${diffMin} min`;

  const diffHoras = Math.floor(diffMin / 60);
  if (diffHoras < 24) return `Hace ${diffHoras} h`;

  const diffDias = Math.floor(diffHoras / 24);
  if (diffDias === 1) return 'Ayer';
  if (diffDias < 30) return `Hace ${diffDias} días`;

  const diffMeses = Math.floor(diffDias / 30);
  if (diffMeses < 12) return `Hace ${diffMeses} mes${diffMeses === 1 ? '' : 'es'}`;

  const diffAnios = Math.floor(diffMeses / 12);
  return `Hace ${diffAnios} año${diffAnios === 1 ? '' : 's'}`;
}

/** Un perfil base sembrado por el sistema no debe quedar sin rol coherente. */
export function perfilListoParaGuardar(input: {
  nombre: string;
  rolBase: string | null;
}): boolean {
  return input.nombre.trim().length >= 3 && !!input.rolBase;
}

const EMAIL_USUARIO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ValidacionCampo {
  valido: boolean;
  mensaje: string | null;
}

export interface ValidacionFormularioCrearUsuario {
  valido: boolean;
  errores: {
    email: string | null;
    nombre: string | null;
    password: string | null;
    idPerfil: string | null;
    general: string | null;
  };
}

export interface ValidacionFormularioPerfil {
  valido: boolean;
  errores: {
    nombre: string | null;
    descripcion: string | null;
    permisos: string | null;
    general: string | null;
  };
}

export function validarEmailUsuario(email: string): ValidacionCampo {
  const valor = email.trim().toLowerCase();
  if (!valor) return { valido: false, mensaje: 'Ingresa el correo del usuario.' };
  if (!EMAIL_USUARIO_RE.test(valor)) {
    return { valido: false, mensaje: 'El correo no tiene un formato válido.' };
  }
  return { valido: true, mensaje: null };
}

export function validarNombreUsuario(nombre: string): ValidacionCampo {
  const valor = nombre.trim();
  if (!valor) return { valido: false, mensaje: 'Ingresa el nombre completo del usuario.' };
  if (valor.length < 3) {
    return { valido: false, mensaje: 'El nombre debe tener al menos 3 caracteres.' };
  }
  return { valido: true, mensaje: null };
}

export function validarPasswordTemporal(password: string): ValidacionCampo {
  if (!password) return { valido: false, mensaje: 'Define una contraseña temporal.' };
  if (password.length < 8) {
    return { valido: false, mensaje: 'La contraseña temporal debe tener al menos 8 caracteres.' };
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return {
      valido: false,
      mensaje: 'Use letras y números para una contraseña más segura.',
    };
  }
  return { valido: true, mensaje: null };
}

export function generarPasswordTemporal(longitud = 12): string {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const numeros = '23456789';
  const todos = letras + numeros;
  let resultado = '';
  resultado += letras[Math.floor(Math.random() * letras.length)];
  resultado += numeros[Math.floor(Math.random() * numeros.length)];
  for (let i = 2; i < longitud; i += 1) {
    resultado += todos[Math.floor(Math.random() * todos.length)];
  }
  return resultado
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

export function validarFormularioCrearUsuario(input: {
  email: string;
  nombre: string;
  password: string;
  idPerfil: number | null;
  perfilesActivos: number;
}): ValidacionFormularioCrearUsuario {
  const errores = {
    email: null as string | null,
    nombre: null as string | null,
    password: null as string | null,
    idPerfil: null as string | null,
    general: null as string | null,
  };

  if (input.perfilesActivos === 0) {
    errores.general = 'No hay perfiles activos disponibles. Cree un perfil antes de registrar usuarios.';
  }

  const email = validarEmailUsuario(input.email);
  if (!email.valido) errores.email = email.mensaje;

  const nombre = validarNombreUsuario(input.nombre);
  if (!nombre.valido) errores.nombre = nombre.mensaje;

  const password = validarPasswordTemporal(input.password);
  if (!password.valido) errores.password = password.mensaje;

  if (input.idPerfil == null) {
    errores.idPerfil = 'Selecciona un perfil de acceso.';
  }

  const valido = Object.values(errores).every((mensaje) => mensaje == null);
  return { valido, errores };
}

export function validarFormularioPerfil(input: {
  nombre: string;
  descripcion: string;
  idPerfil: number | null;
  perfilesExistentes: readonly Pick<PerfilAcceso, 'idPerfil' | 'nombre'>[];
  modulosVisibles: number;
}): ValidacionFormularioPerfil {
  const errores = {
    nombre: null as string | null,
    descripcion: null as string | null,
    permisos: null as string | null,
    general: null as string | null,
  };

  const nombre = input.nombre.trim();
  if (!nombre) {
    errores.nombre = 'Ingresa el nombre del perfil.';
  } else if (nombre.length < 3) {
    errores.nombre = 'El nombre debe tener al menos 3 caracteres.';
  } else {
    const duplicado = input.perfilesExistentes.find(
      (perfil) =>
        perfil.idPerfil !== input.idPerfil &&
        perfil.nombre.trim().toLowerCase() === nombre.toLowerCase(),
    );
    if (duplicado) {
      errores.nombre = 'Ya existe un perfil con ese nombre.';
    }
  }

  if (input.descripcion.trim().length > 200) {
    errores.descripcion = 'La descripción no puede superar 200 caracteres.';
  }

  if (input.modulosVisibles === 0) {
    errores.permisos = 'El perfil debe permitir ver al menos un módulo.';
  }

  const valido = Object.values(errores).every((mensaje) => mensaje == null);
  return { valido, errores };
}

export interface VistaPreviaDocumentoLiquidacion {
  razonSocial: string;
  rut: string | null;
  direccion: string | null;
  logoUrl: string | null;
  representanteLegal: string | null;
  textoPie: string | null;
  nombreFirmaEmpleador: string | null;
}

export function armarVistaPreviaDocumento(input: {
  config: {
    logoUrl: string | null;
    mostrarRut: boolean;
    mostrarDireccion: boolean;
    mostrarRepresentante: boolean;
    textoPie: string | null;
    nombreFirmaEmpleador: string | null;
  };
  empresa: {
    razonSocial?: string | null;
    nombre?: string | null;
    rut?: string | null;
    dv?: string | null;
  } | null;
  detalle?: {
    direccion?: string | null;
    representanteLegal?: string | null;
  } | null;
}): VistaPreviaDocumentoLiquidacion {
  const empresa = input.empresa;
  const config = input.config;
  const detalle = input.detalle ?? {};
  const razonSocial =
    empresa?.razonSocial?.trim() || empresa?.nombre?.trim() || 'Empleador';

  return {
    razonSocial,
    rut:
      config.mostrarRut && empresa?.rut
        ? `${empresa.rut}-${empresa.dv ?? ''}`.replace(/-$/, '')
        : null,
    direccion: config.mostrarDireccion ? detalle.direccion?.trim() || null : null,
    logoUrl: config.logoUrl,
    representanteLegal: config.mostrarRepresentante
      ? detalle.representanteLegal?.trim() || null
      : null,
    textoPie: config.textoPie?.trim() || null,
    nombreFirmaEmpleador: config.nombreFirmaEmpleador?.trim() || null,
  };
}
