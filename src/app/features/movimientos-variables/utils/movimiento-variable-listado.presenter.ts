import type { DataGridColumn, DataGridFilter } from '../../../shared/components/ui/data-grid.component';
import type { EmpleadoListado } from '../../empleados/models/empleado-listado.model';
import type { ConceptoListado } from '../../haberes-descuentos/models/haber-descuento-asignacion.model';
import type {
  MovimientoVariableEstado,
  MovimientoVariableListadoFila,
} from '../models/movimiento-variable.model';
import type { FilaGridMovimientoVariable } from '../models/movimiento-variable-listado.vm';

export function etiquetaTipoConceptoMv(tipo: string | null): string {
  if (tipo === 'HABER') {
    return 'Haber';
  }
  if (tipo === 'DESCUENTO') {
    return 'Descuento';
  }
  if (tipo === 'APORTE_EMPLEADOR') {
    return 'Aporte empleador';
  }
  return tipo?.trim() ? tipo : '—';
}

export function etiquetaEstadoMovimientoVariable(estado: MovimientoVariableEstado): string {
  switch (estado) {
    case 'BORRADOR':
      return 'Borrador';
    case 'VALIDADO':
      return 'Validado';
    case 'OBSERVADO':
      return 'Observado';
    case 'ANULADO':
      return 'Anulado';
    case 'BLOQUEADO':
      return 'Bloqueado';
    case 'INCLUIDO_EN_PROCESO':
      return 'Incluido en proceso';
    default:
      return estado;
  }
}

export function etiquetaOrigenMovimientoVariable(origen: string): string {
  if (origen === 'MANUAL') {
    return 'Manual';
  }
  if (origen === 'IMPORTADO') {
    return 'Importado';
  }
  if (origen === 'SISTEMA') {
    return 'Sistema';
  }
  return origen;
}

export function formatMontoMovimientoVariable(monto: number): string {
  return `$ ${Number(monto).toLocaleString('es-CL')}`;
}

export function crearColumnasGridMovimientoVariable(): DataGridColumn<FilaGridMovimientoVariable>[] {
  return [
    {
      id: 'trabajadorEtiqueta',
      header: 'Trabajador',
      field: 'trabajadorEtiqueta',
      type: 'text',
      sortable: true,
      priorityResponsive: 'primary',
      filterable: false,
    },
    {
      id: 'conceptoEtiqueta',
      header: 'Concepto',
      field: 'conceptoEtiqueta',
      type: 'text',
      sortable: true,
      filterable: false,
    },
    {
      id: 'tipoConceptoEtiqueta',
      header: 'Tipo',
      field: 'tipoConceptoEtiqueta',
      type: 'text',
      sortable: true,
      visible: false,
      filterable: false,
    },
    {
      id: 'monto',
      header: 'Monto',
      field: 'monto',
      type: 'number',
      align: 'right',
      sortable: true,
      format: (_v, row) => formatMontoMovimientoVariable(row.monto),
      filterable: false,
    },
    {
      id: 'estado',
      header: 'Estado',
      field: 'estado',
      type: 'text',
      sortable: true,
      filterable: false,
    },
    {
      id: 'origen',
      header: 'Origen',
      field: 'origen',
      type: 'text',
      sortable: true,
      format: (v) => etiquetaOrigenMovimientoVariable(String(v ?? '')),
      visible: false,
      filterable: false,
    },
    {
      id: 'observacion',
      header: 'Observación',
      field: 'observacion',
      type: 'text',
      sortable: false,
      format: (v) => {
        const texto = v == null ? '' : String(v);
        if (texto.length <= 48) {
          return texto || '—';
        }
        return `${texto.slice(0, 45)}…`;
      },
      visible: false,
      filterable: false,
    },
    {
      id: 'acciones',
      header: 'Acciones',
      align: 'center',
      sortable: false,
      hideable: false,
    },
  ];
}

export function crearFiltrosGridMovimientoVariable(): DataGridFilter<FilaGridMovimientoVariable>[] {
  return [
    {
      id: 'busquedaMv',
      label: 'Buscar',
      field: 'busqueda',
      type: 'text',
      operator: 'contains',
      placeholder: 'Trabajador, concepto, estado…',
    },
  ];
}

export function aFilaGridMovimientoVariable(
  fila: MovimientoVariableListadoFila,
  empleados: readonly EmpleadoListado[],
  conceptos: readonly ConceptoListado[],
): FilaGridMovimientoVariable {
  const emp = empleados.find((e) => e.id === fila.idPersona);
  const trabajadorEtiqueta = emp ? `${emp.nombre} · ${emp.rut}` : `Persona ${fila.idPersona}`;
  const concepto = conceptos.find((c) => c.idConcepto === fila.idConcepto);
  const conceptoEtiqueta = concepto
    ? `${concepto.nombre} (${concepto.codigo})`
    : `Concepto ${fila.idConcepto}`;
  const tipoConceptoEtiqueta = etiquetaTipoConceptoMv(concepto?.tipo ?? null);
  const busqueda = [trabajadorEtiqueta, conceptoEtiqueta, fila.estado, fila.origen ?? '']
    .join(' ')
    .toLowerCase();

  return {
    ...fila,
    trabajadorEtiqueta,
    conceptoEtiqueta,
    tipoConceptoEtiqueta,
    busqueda,
  };
}
