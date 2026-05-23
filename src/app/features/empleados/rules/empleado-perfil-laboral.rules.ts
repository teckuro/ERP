import {
  CONDICIONES_TRABAJADOR_UI,
  type CondicionTrabajadorCodigo,
} from '../models/empleado-perfil-laboral.model';
import type { PerfilLaboralFormGroup } from '../models/empleado-form.model';
import type {
  CondicionEspecialDetalleItem,
  CondicionEspecialEstadoUi,
  CondicionEspecialEstadoVm,
  PerfilLaboralPersona,
  TramoEdadLaboral,
} from '../models/empleado-perfil-laboral-rpc.model';
import type { EmpleadoFichaValidacionSnapshot } from './empleado-ficha-validacion.rules';

export interface PerfilLaboralRpcRow {
  id_persona: number;
  periodo: string;
  edad_periodo: number | null;
  tramo_edad_laboral: string;
  es_menor_18: boolean;
  es_adulto_18_65: boolean;
  es_mayor_65: boolean;
  es_pensionado: boolean;
  es_pensionado_invalidez_parcial: boolean;
  es_pensionado_invalidez_total: boolean;
  exento_cotizacion_pension: boolean;
  trabajador_adolescente_protegido: boolean;
  autorizacion_menor_registrada: boolean;
  aplica_imm_general: boolean;
  aplica_imm_menor18_mayor65: boolean;
  requiere_revision_rrhh: boolean;
}

export function mapPerfilLaboralRpcRow(row: PerfilLaboralRpcRow): PerfilLaboralPersona {
  return {
    idPersona: row.id_persona,
    periodo: row.periodo,
    edadPeriodo: row.edad_periodo,
    tramoEdadLaboral: normalizeTramoEdad(row.tramo_edad_laboral),
    esMenor18: row.es_menor_18 === true,
    esAdulto1865: row.es_adulto_18_65 === true,
    esMayor65: row.es_mayor_65 === true,
    esPensionado: row.es_pensionado === true,
    esPensionadoInvalidezParcial: row.es_pensionado_invalidez_parcial === true,
    esPensionadoInvalidezTotal: row.es_pensionado_invalidez_total === true,
    exentoCotizacionPension: row.exento_cotizacion_pension === true,
    trabajadorAdolescenteProtegido: row.trabajador_adolescente_protegido === true,
    autorizacionMenorRegistrada: row.autorizacion_menor_registrada === true,
    aplicaImmGeneral: row.aplica_imm_general === true,
    aplicaImmMenor18Mayor65: row.aplica_imm_menor18_mayor65 === true,
    requiereRevisionRrhh: row.requiere_revision_rrhh === true,
  };
}

export function etiquetaTramoEdadLaboral(
  tramo: TramoEdadLaboral,
  edad: number | null,
): string {
  const edadTexto = edad === null ? '' : ` (${edad} años)`;

  switch (tramo) {
    case 'MENOR_18':
      return `Menor de 18 años${edadTexto}`;
    case 'MAYOR_65':
      return `Mayor de 65 años${edadTexto}`;
    case 'ADULTO_18_65':
      return `Adulto 18 a 65 años${edadTexto}`;
    default:
      return 'Pendiente de fecha de nacimiento';
  }
}

export function etiquetaEstadoCondicion(estado: CondicionEspecialEstadoUi): string {
  switch (estado) {
    case 'detectada':
      return 'Detectada';
    case 'manual':
      return 'Declarada';
    case 'pendiente':
      return 'Pendiente de revisión';
    case 'confirmada':
      return 'Confirmada';
    case 'descartada':
      return 'No aplica';
  }
}

export function buildCondicionesEspecialesDetalleItems(input: {
  perfil: PerfilLaboralPersona | null;
  formPerfil: ReturnType<PerfilLaboralFormGroup['getRawValue']>;
  periodoEtiqueta: string;
  categoriaBaseLabel: string;
}): CondicionEspecialDetalleItem[] {
  const { perfil, formPerfil, periodoEtiqueta, categoriaBaseLabel } = input;
  const items: CondicionEspecialDetalleItem[] = [
    { label: 'Período de referencia', value: periodoEtiqueta || 'Sin período activo' },
    { label: 'Categoría base', value: categoriaBaseLabel },
  ];

  if (perfil) {
    items.push(
      {
        label: 'Edad al cierre del período',
        value:
          perfil.edadPeriodo === null
            ? 'Sin información'
            : `${perfil.edadPeriodo} años`,
      },
      {
        label: 'Tramo detectado',
        value: etiquetaTramoEdadLaboral(perfil.tramoEdadLaboral, perfil.edadPeriodo),
      },
      {
        label: 'Revisión RRHH sugerida',
        value: perfil.requiereRevisionRrhh ? 'Sí' : 'No',
      },
    );
  } else {
    items.push(
      { label: 'Edad al cierre del período', value: 'Sin información' },
      { label: 'Tramo detectado', value: 'Pendiente de revisión' },
    );
  }

  const declaradas = CONDICIONES_TRABAJADOR_UI.filter(
    (option) => formPerfil[option.controlName],
  ).map((option) => option.label);

  items.push({
    label: 'Condiciones declaradas',
    value: declaradas.length > 0 ? declaradas.join(', ') : 'Sin condiciones especiales',
  });

  if (declaradas.length > 0) {
    items.push(
      {
        label: 'Vigencia desde',
        value: formPerfil.vigenciaInicio?.trim() || 'Sin información',
      },
      {
        label: 'Respaldo registrado',
        value: formPerfil.respaldoRegistrado ? 'Sí' : 'Pendiente',
      },
    );

    const observacion = formPerfil.observacion?.trim();
    if (observacion) {
      items.push({ label: 'Observación', value: observacion });
    }
  }

  return items;
}

export function buildCondicionesEspecialesEstados(input: {
  perfil: PerfilLaboralPersona | null;
  formPerfil: ReturnType<PerfilLaboralFormGroup['getRawValue']>;
}): CondicionEspecialEstadoVm[] {
  const { perfil, formPerfil } = input;

  return CONDICIONES_TRABAJADOR_UI.map((option) => {
    const declarada = formPerfil[option.controlName] === true;
    const detectadaRpc = perfil
      ? condicionDetectadaEnRpc(option.codigo, perfil)
      : false;
    const estado = resolverEstadoCondicion(declarada, detectadaRpc, perfil?.esMenor18 === true);
    const detalle = buildDetalleEstadoCondicion(estado, option.label, detectadaRpc, declarada);

    return {
      codigo: option.codigo,
      label: option.label,
      estado,
      detalle,
    };
  }).filter((item) => item.estado !== 'descartada');
}

export function enriquecerSnapshotConPerfilRpc(
  snapshot: EmpleadoFichaValidacionSnapshot,
  perfil: PerfilLaboralPersona | null,
): EmpleadoFichaValidacionSnapshot {
  if (!perfil) {
    return snapshot;
  }

  const respaldoCondiciones =
    !snapshot.tieneCondicionesEspeciales ||
    snapshot.respaldoRegistrado === true;

  return {
    ...snapshot,
    perfilLaboralMenorEdad: perfil.esMenor18,
    trabajadorAdolescenteProtegido:
      snapshot.trabajadorAdolescenteProtegido === true || perfil.trabajadorAdolescenteProtegido,
    autorizacionMenorRegistrada:
      snapshot.autorizacionMenorRegistrada === true || perfil.autorizacionMenorRegistrada,
    respaldoRegistrado: respaldoCondiciones,
  };
}

function normalizeTramoEdad(value: string): TramoEdadLaboral {
  if (
    value === 'MENOR_18' ||
    value === 'ADULTO_18_65' ||
    value === 'MAYOR_65' ||
    value === 'SIN_FECHA_NACIMIENTO'
  ) {
    return value;
  }

  return 'SIN_FECHA_NACIMIENTO';
}

function condicionDetectadaEnRpc(
  codigo: CondicionTrabajadorCodigo,
  perfil: PerfilLaboralPersona,
): boolean {
  switch (codigo) {
    case 'PENSIONADO':
      return perfil.esPensionado;
    case 'PENSIONADO_INVALIDEZ_PARCIAL':
      return perfil.esPensionadoInvalidezParcial;
    case 'PENSIONADO_INVALIDEZ_TOTAL':
      return perfil.esPensionadoInvalidezTotal;
    case 'EXENTO_COTIZACION_PENSION':
      return perfil.exentoCotizacionPension;
    case 'TRABAJADOR_ADOLESCENTE_PROTEGIDO':
      return perfil.trabajadorAdolescenteProtegido || perfil.esMenor18;
    case 'AUTORIZACION_MENOR_REGISTRADA':
      return perfil.autorizacionMenorRegistrada;
    default:
      return false;
  }
}

function resolverEstadoCondicion(
  declarada: boolean,
  detectadaRpc: boolean,
  esMenor: boolean,
): CondicionEspecialEstadoUi {
  if (declarada) {
    return detectadaRpc ? 'confirmada' : 'manual';
  }

  if (detectadaRpc) {
    return esMenor ? 'pendiente' : 'detectada';
  }

  return 'descartada';
}

function buildDetalleEstadoCondicion(
  estado: CondicionEspecialEstadoUi,
  label: string,
  detectadaRpc: boolean,
  declarada: boolean,
): string {
  if (estado === 'confirmada') {
    return `${label} declarada y alineada al período activo.`;
  }

  if (estado === 'manual') {
    return `${label} declarada por RRHH.`;
  }

  if (estado === 'pendiente') {
    return detectadaRpc
      ? `${label} requiere revisión por edad laboral detectada.`
      : `${label} pendiente de confirmación.`;
  }

  if (estado === 'detectada') {
    return `${label} sugerida para revisión; no está declarada aún.`;
  }

  return declarada ? `${label} registrada.` : `${label} no aplica.`;
}
