import type {
  EstadoAlcanceNomina,
  OpcionAlcanceNomina,
  ResumenAlcanceNomina,
  ResultadoAlcanceNomina,
  TipoAlcanceNomina,
} from '../models/nomina-mensual-v2.models';
import type { ChecklistItem } from '../models/nomina-mensual-v2.models';
import type { FilaEmpleadoNomina } from './nomina-empleados-grid.presenter';
import { obtenerResultadoValidacionEmpleados } from './nomina-empleados-validacion.presenter';

export interface ParametrosCalculoAlcance {
  tipo: TipoAlcanceNomina | null;
  filas: readonly FilaEmpleadoNomina[];
  centrosCostoSeleccionados?: readonly string[];
  idsTrabajadoresManuales?: readonly string[];
}

export function obtenerOpcionesAlcanceNomina(): OpcionAlcanceNomina[] {
  return [
    {
      id: 'empresaCompleta',
      titulo: 'Toda la empresa',
      descripcion: 'Incluye todos los trabajadores elegibles del período.',
      icono: 'building-2',
      estado: 'disponible',
    },
    {
      id: 'grupo',
      titulo: 'Por grupo / centro de costo',
      descripcion: 'Prepara la nómina solo para un grupo operativo o centro de costo.',
      icono: 'folder-open',
      estado: 'disponible',
    },
    {
      id: 'contrato',
      titulo: 'Por contrato',
      descripcion: 'Disponible cuando el tipo de contrato esté expuesto en los datos de personal.',
      icono: 'file-text',
      estado: 'preparado',
      etiqueta: 'Próximamente',
    },
    {
      id: 'seleccionManual',
      titulo: 'Selección manual',
      descripcion: 'Elige trabajadores específicos para una preparación parcial o reproceso.',
      icono: 'user-check',
      estado: 'disponible',
    },
  ];
}

export function obtenerCentrosCostoDisponibles(filas: readonly FilaEmpleadoNomina[]): string[] {
  return [...new Set(filas.map((fila) => fila.centroCosto.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'es'),
  );
}

export function calcularIdsTrabajadoresIncluidos(parametros: ParametrosCalculoAlcance): string[] {
  const { tipo, filas, centrosCostoSeleccionados = [], idsTrabajadoresManuales = [] } = parametros;
  if (!tipo || tipo === 'contrato') {
    return [];
  }

  switch (tipo) {
    case 'empresaCompleta':
      return filas.map((fila) => fila.id);
    case 'grupo': {
      const centros = new Set(centrosCostoSeleccionados.map((centro) => centro.trim()).filter(Boolean));
      if (centros.size === 0) {
        return [];
      }
      return filas.filter((fila) => centros.has(fila.centroCosto.trim())).map((fila) => fila.id);
    }
    case 'seleccionManual':
      return filas.filter((fila) => idsTrabajadoresManuales.includes(fila.id)).map((fila) => fila.id);
  }
}

export function calcularResumenAlcance(
  filas: readonly FilaEmpleadoNomina[],
  idsIncluidos: readonly string[],
): ResumenAlcanceNomina {
  const idsSet = new Set(idsIncluidos);
  const incluidas = filas.filter((fila) => idsSet.has(fila.id));
  const validacion = obtenerResultadoValidacionEmpleados(incluidas);

  return {
    totalTrabajadores: filas.length,
    trabajadoresIncluidos: incluidas.length,
    trabajadoresExcluidos: filas.length - incluidas.length,
    trabajadoresBloqueados: validacion.estado === 'bloqueado' ? validacion.trabajadoresAfectados : 0,
    trabajadoresConAdvertencias: validacion.estado === 'advertencia' ? validacion.trabajadoresAfectados : 0,
  };
}

export function calcularResultadoAlcance(parametros: ParametrosCalculoAlcance): ResultadoAlcanceNomina {
  const { tipo, filas, centrosCostoSeleccionados = [], idsTrabajadoresManuales = [] } = parametros;
  const idsIncluidos = calcularIdsTrabajadoresIncluidos(parametros);
  const resumen = calcularResumenAlcance(filas, idsIncluidos);

  if (!tipo) {
    return {
      tipo: 'empresaCompleta',
      estado: 'sinConfigurar',
      descripcion: 'Selecciona un tipo de alcance para continuar.',
      idsTrabajadoresIncluidos: [],
      resumen,
    };
  }

  if (tipo === 'contrato') {
    return {
      tipo,
      estado: 'sinConfigurar',
      descripcion: 'El filtro por tipo de contrato estará disponible cuando Personal lo exponga.',
      idsTrabajadoresIncluidos: [],
      resumen,
    };
  }

  if (idsIncluidos.length === 0) {
    return {
      tipo,
      estado: 'bloqueado',
      descripcion: obtenerDescripcionAlcanceVacia(tipo),
      idsTrabajadoresIncluidos: [],
      centrosCostoSeleccionados: tipo === 'grupo' ? [...centrosCostoSeleccionados] : undefined,
      idsTrabajadoresManuales: tipo === 'seleccionManual' ? [...idsTrabajadoresManuales] : undefined,
      resumen,
    };
  }

  const incluidas = filas.filter((fila) => idsIncluidos.includes(fila.id));
  const validacion = obtenerResultadoValidacionEmpleados(incluidas);
  let estado: EstadoAlcanceNomina = 'listo';
  if (validacion.estado === 'bloqueado') {
    estado = 'bloqueado';
  } else if (validacion.estado === 'advertencia') {
    estado = 'conAdvertencias';
  }

  return {
    tipo,
    estado,
    descripcion: obtenerDescripcionAlcance(tipo, resumen, centrosCostoSeleccionados, idsIncluidos.length),
    idsTrabajadoresIncluidos: idsIncluidos,
    centrosCostoSeleccionados: tipo === 'grupo' ? [...centrosCostoSeleccionados] : undefined,
    idsTrabajadoresManuales: tipo === 'seleccionManual' ? [...idsTrabajadoresManuales] : undefined,
    resumen,
  };
}

export function construirChecklistAlcanceNomina(resultado: ResultadoAlcanceNomina | null): ChecklistItem[] {
  const resumen = resultado?.resumen ?? {
    totalTrabajadores: 0,
    trabajadoresIncluidos: 0,
    trabajadoresExcluidos: 0,
    trabajadoresBloqueados: 0,
    trabajadoresConAdvertencias: 0,
  };

  const alcanceSeleccionado = resultado != null && resultado.estado !== 'sinConfigurar';
  const incluidosOk = resumen.trabajadoresIncluidos > 0;
  const sinBloqueos = (resultado?.resumen.trabajadoresBloqueados ?? 0) === 0;
  const previewOk = alcanceSeleccionado && incluidosOk;

  return [
    {
      id: 'alcance-tipo',
      title: 'Alcance seleccionado',
      description: alcanceSeleccionado ? (resultado?.descripcion ?? 'Alcance definido.') : 'Elige cómo preparar la nómina.',
      status: alcanceSeleccionado ? 'success' : 'pending',
    },
    {
      id: 'alcance-incluidos',
      title: 'Trabajadores incluidos',
      description: incluidosOk
        ? `${resumen.trabajadoresIncluidos} de ${resumen.totalTrabajadores} incluidos`
        : 'Debe haber al menos un trabajador incluido.',
      status: incluidosOk ? 'success' : resultado?.estado === 'bloqueado' ? 'error' : 'warning',
    },
    {
      id: 'alcance-bloqueos',
      title: 'Sin bloqueos críticos',
      description: sinBloqueos
        ? 'Ningún bloqueo crítico en el alcance.'
        : `${resumen.trabajadoresBloqueados} con pendientes bloqueantes.`,
      status: sinBloqueos ? 'success' : 'error',
    },
    {
      id: 'alcance-preview',
      title: 'Preview confirmado',
      description: previewOk
        ? 'Vista previa lista para continuar.'
        : 'Completa la selección para revisar empleados.',
      status: previewOk ? 'success' : 'pending',
    },
  ];
}

export function obtenerTextoAyudaAlcance(resultado: ResultadoAlcanceNomina | null): string | null {
  if (!resultado || resultado.estado === 'sinConfigurar') {
    return 'Selecciona un alcance con al menos un trabajador incluido antes de continuar.';
  }
  if (resultado.estado === 'bloqueado') {
    return 'Hay pendientes bloqueantes en el alcance. Revísalos antes de avanzar a Empleados.';
  }
  if (resultado.estado === 'conAdvertencias') {
    return 'Hay advertencias en el alcance. Puedes continuar y revisarlas en Empleados.';
  }
  return 'El alcance está listo. Usa «Validar alcance» para revisar empleados incluidos.';
}

function obtenerDescripcionAlcanceVacia(tipo: TipoAlcanceNomina): string {
  switch (tipo) {
    case 'grupo':
      return 'Selecciona al menos un centro de costo para incluir trabajadores.';
    case 'seleccionManual':
      return 'Marca al menos un trabajador en la selección manual.';
    case 'empresaCompleta':
      return 'No hay trabajadores elegibles para incluir en el alcance.';
    case 'contrato':
      return 'El filtro por contrato no está disponible todavía.';
  }
}

function obtenerDescripcionAlcance(
  tipo: TipoAlcanceNomina,
  resumen: ResumenAlcanceNomina,
  centros: readonly string[],
  incluidos: number,
): string {
  switch (tipo) {
    case 'empresaCompleta':
      return `Toda la empresa: ${incluidos} trabajador${incluidos === 1 ? '' : 'es'} elegibles.`;
    case 'grupo':
      return `Centro${centros.length === 1 ? '' : 's'}: ${centros.join(', ')} · ${incluidos} incluidos, ${resumen.trabajadoresExcluidos} excluidos.`;
    case 'seleccionManual':
      return `Selección manual: ${incluidos} trabajador${incluidos === 1 ? '' : 'es'} elegidos.`;
    case 'contrato':
      return 'Por contrato (próximamente).';
  }
}
