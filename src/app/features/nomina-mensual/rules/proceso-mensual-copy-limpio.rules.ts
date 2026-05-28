/** Diccionario de tokens técnicos → copy RRHH (modal revisión / proyecciones). */
export const COPY_TECNICO_NOMINA: Record<string, string> = {
  parametros_generales: 'Parámetros generales del período',
  periodo_remuneracion: 'Calendario del período',
  sis_fila_mensual: 'Dato SIS mensual',
  sis_null: 'El valor SIS no está disponible para este período',
  FALTANTE: 'pendiente',
  estado_periodo: 'estado del período',
  valor_uf_mensual: 'valor UF mensual',
  valor_utm_mensual: 'valor UTM mensual',
  valor_uta_mensual: 'valor UTA mensual',
  uf_null: 'Falta el valor UF mensual',
  utm_null: 'Falta el valor UTM mensual',
  sueldo_minimo: 'sueldo mínimo',
  sueldo_minimo_null: 'Falta el sueldo mínimo vigente para el período',
  tope_imponible: 'tope imponible',
  tramo_carga: 'tramo de carga familiar',
  tramo_impuesto: 'tramo de impuesto único',
  afp_vigencia: 'vigencia AFP',
  salud_plan: 'plan de salud',
  ley_16744: 'Mutual empleador',
  afc_parametro: 'parámetro AFC',
  codigo_parametro: 'código de parámetro',
  FALTA_PARAMETROS_GENERALES: 'Faltan parámetros generales del período',
  FALTA_SIS: 'Falta confirmar el SIS del período',
  FALTA_AFC: 'Falta el parámetro AFC del contrato',
  SANNA_NO_DEFINIDO: 'SANNA no definido para el período',
  TOPE_IMPONIBLE_NO_DISPONIBLE: 'Tope imponible previsional no disponible',
  tabla_impuesto_unico: 'tabla de impuesto único',
  ley_16744_parametros: 'parámetros mutual',
  empresa: 'datos mutual de empresa',
  empresa_ley_16744: 'datos mutual de empresa',
  mutualidad_ley16744_ccaf: 'Mutual y CCAF',
  afc_catalogo: 'Seguro de cesantía (AFC)',
  salud_catalogo: 'Catálogo de salud',
  reforma_previsional: 'Reforma previsional',
  sin_ley16744_ni_ccaf: 'sin parámetros mutual ni CCAF',
  catalogos_afp_impuesto: 'catálogos AFP e impuesto',
  topes_base: 'topes de cotización del período',
  MV_BORRADOR: 'movimiento del mes en borrador',
  PARAMETROS_SIN_FILA: 'Parámetros del período sin validar',
  is_null: 'valor no disponible',
};

/** Une fragmentos tras limpiar cada uno (evita `;` crudo entre mensajes). */
export function limpiarYUnirMensajes(fragmentos: string[], separador = '. '): string {
  const partes = fragmentos
    .map((fragmento) => limpiarCopyTecnicoNomina(fragmento))
    .filter((fragmento) => fragmento.length > 0);
  if (!partes.length) return '';
  return partes.join(separador);
}

const SIGLAS_SNAKE: ReadonlySet<string> = new Set([
  'sis',
  'uf',
  'utm',
  'uta',
  'afp',
  'afc',
]);

const CLAVES_DICCIONARIO_ORDENADAS = Object.keys(COPY_TECNICO_NOMINA).sort((a, b) => b.length - a.length);

const FRASES_PARAMETROS: ReadonlyArray<{ pattern: RegExp; replacement: string }> = [
  {
    pattern: /Parámetros generales del período\s+pendiente/gi,
    replacement: 'Faltan parámetros generales del período',
  },
  {
    pattern: /Calendario del período\s+pendiente/gi,
    replacement: 'Falta configurar el calendario del período',
  },
  {
    pattern: /Parámetros generales del período\.sanna/gi,
    replacement: 'el campo SANNA de parámetros generales del período',
  },
  {
    pattern: /\bliquido trabajador\b/gi,
    replacement: 'líquido del trabajador',
  },
];

export function contieneNomenclaturaTecnica(texto: string): boolean {
  return /[a-z0-9]+_[a-z0-9_]+/i.test(texto);
}

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function aplicarDiccionario(texto: string): string {
  let salida = texto;
  for (const clave of CLAVES_DICCIONARIO_ORDENADAS) {
    const reemplazo = COPY_TECNICO_NOMINA[clave];
    const patron = clave === 'FALTANTE'
      ? /\bFALTANTE\b/gi
      : new RegExp(`\\b${escaparRegex(clave)}\\b`, 'gi');
    salida = salida.replace(patron, reemplazo);
  }
  return salida;
}

function aplicarFrasesParametros(texto: string): string {
  let salida = texto;
  for (const { pattern, replacement } of FRASES_PARAMETROS) {
    salida = salida.replace(pattern, replacement);
  }
  return salida;
}

function limpiarSeparadoresPuntoYComa(texto: string): string {
  let salida = texto.trim().replace(/^[;\s]+|[;\s]+$/g, '');
  if (!salida) return '';
  salida = salida.replace(/\s*;\s*/g, '. ');
  salida = salida.replace(/\.\s*\./g, '.');
  return salida.trim();
}

function limpiarRutasPropiedad(texto: string): string {
  return texto.replace(/\.([a-z][a-z0-9_]{2,})\b/gi, (coincidencia, propiedad) => {
    const clave = propiedad.toLowerCase();
    if (clave === 'sanna') return ' (campo SANNA)';
    if (COPY_TECNICO_NOMINA[clave]) {
      return ` (${COPY_TECNICO_NOMINA[clave]})`;
    }
    return coincidencia;
  });
}

function humanizarTokenSnakeCase(token: string): string {
  const partes = token.split('_').filter(Boolean);
  return partes
    .map((parte, indice) => {
      const min = parte.toLowerCase();
      if (SIGLAS_SNAKE.has(min)) {
        return min.toUpperCase();
      }
      if (indice === 0) {
        return parte.charAt(0).toUpperCase() + parte.slice(1).toLowerCase();
      }
      return parte.toLowerCase();
    })
    .join(' ');
}

function humanizarSnakeCaseResidual(texto: string): string {
  return texto.replace(/[a-z0-9]+(?:_[a-z0-9_]+)+/gi, (coincidencia) =>
    humanizarTokenSnakeCase(coincidencia),
  );
}

function colapsarEspacios(texto: string): string {
  return texto.replace(/\s{2,}/g, ' ').trim();
}

/**
 * Normaliza copy visible del modal de revisión: sin claves técnicas, `;` accidentales ni snake_case crudo.
 */
function limpiarCopyTecnicoNominaInterno(texto: string | null | undefined): string {
  if (texto == null) return '';
  const inicial = texto.trim();
  if (!inicial) return '';

  if (!contieneNomenclaturaTecnica(inicial) && !inicial.includes(';') && !/\bFALTANTE\b/i.test(inicial)) {
    const soloEspacios = colapsarEspacios(inicial);
    if (!contieneNomenclaturaTecnica(soloEspacios) && !soloEspacios.includes(';')) {
      return soloEspacios;
    }
  }

  let salida = aplicarDiccionario(inicial);
  salida = aplicarFrasesParametros(salida);
  salida = limpiarRutasPropiedad(salida);
  salida = limpiarSeparadoresPuntoYComa(salida);
  if (contieneNomenclaturaTecnica(salida)) {
    salida = humanizarSnakeCaseResidual(salida);
  }
  return colapsarEspacios(salida);
}

export function limpiarCopyTecnicoNomina(texto: string | null | undefined): string {
  return limpiarCopyTecnicoNominaInterno(texto);
}

const ETIQUETA_CAMPO_OFICIAL: Readonly<Record<string, string>> = {
  uf: 'UF mensual',
  utm: 'UTM mensual',
  uta: 'UTA mensual',
  sis: 'SIS del período',
  sanna: 'SANNA',
  saludObligatoria: 'cotización de salud obligatoria',
  sueldoMinimo18a65: 'sueldo mínimo (18 a 65 años)',
  sueldoMinimoMenor18Mayor65: 'sueldo mínimo (menores y mayores)',
  sueldoMinimoCasaParticular: 'sueldo mínimo casa particular',
  ingresoMinimoNoRemuneracional: 'ingreso mínimo no remuneracional',
  topeAfpUf: 'tope AFP (UF)',
  topeAfp: 'tope AFP',
  topeIpsUf: 'tope IPS (UF)',
  topeIps: 'tope IPS',
  topeCesantiaUf: 'tope cesantía (UF)',
  topeCesantia: 'tope cesantía',
  topeApvMensualUf: 'tope APV mensual (UF)',
  topeApvMensual: 'tope APV mensual',
  topeApvAnualUf: 'tope APV anual (UF)',
  topeApvAnual: 'tope APV anual',
  afcTrabajadorIndefinido: 'AFC trabajador indefinido',
  afcEmpleadorIndefinido: 'AFC empleador indefinido',
  afcEmpleadorPlazo: 'AFC empleador plazo fijo',
};

function etiquetaCampoOficial(campo: string): string {
  const clave = campo.trim().toLowerCase();
  const conocido = ETIQUETA_CAMPO_OFICIAL[clave];
  if (conocido) {
    return conocido;
  }
  const humanizado = limpiarCopyTecnicoNomina(campo);
  return humanizado || campo;
}

/** Convierte mensajes de completitud PG («Falta dato oficial: uf») a copy RRHH. */
export function humanizarFaltaDatoOficial(texto: string): string {
  return texto
    .replace(
      /Falta dato oficial:\s*([a-zA-Z0-9_]+)\.?/gi,
      (_coincidencia, campo) => mensajeFaltaCampoOficial(campo),
    )
    .replace(
      /Dato oficial en cero:\s*([a-zA-Z0-9_]+)\.?/gi,
      (_coincidencia, campo) => mensajeCampoOficialEnCero(campo),
    );
}

const PREFIJO_PARAMETROS_PENDIENTES = /^Parámetros del período pendientes:\s*/i;

function esTituloPendienteParametros(titulo: string): boolean {
  return /parámetros del período/i.test(titulo);
}

/** Normaliza título y detalle de ítems del acta de preparación (sin claves crudas ni prefijos duplicados). */
export function humanizarPendienteActa(
  titulo: string,
  descripcion: string,
): { titulo: string; descripcion: string } {
  let tituloLimpio = humanizarFaltaDatoOficial(limpiarCopyTecnicoNomina(titulo));
  let descripcionLimpia = humanizarFaltaDatoOficial(limpiarCopyTecnicoNomina(descripcion));

  if (esTituloPendienteParametros(tituloLimpio) || esTituloPendienteParametros(descripcionLimpia)) {
    descripcionLimpia = descripcionLimpia.replace(PREFIJO_PARAMETROS_PENDIENTES, '').trim();
    if (/^Parámetros del período pendientes$/i.test(tituloLimpio)) {
      tituloLimpio = 'Datos oficiales del período';
    } else if (/por revisar/i.test(tituloLimpio)) {
      tituloLimpio = 'Parámetros del período';
    }
  }

  if (
    descripcionLimpia
    && tituloLimpio
    && descripcionLimpia.localeCompare(tituloLimpio, 'es', { sensitivity: 'accent' }) === 0
  ) {
    descripcionLimpia = '';
  }

  return { titulo: tituloLimpio, descripcion: descripcionLimpia };
}

export type CampoOficialPendienteActa = {
  campo: string;
  motivo: 'falta' | 'cero';
};

function campoDesdeEtiquetaRRHH(etiqueta: string): string | null {
  const normalizada = etiqueta.trim().toLowerCase();
  for (const [campo, label] of Object.entries(ETIQUETA_CAMPO_OFICIAL)) {
    if (label.trim().toLowerCase() === normalizada) {
      return campo;
    }
  }
  return null;
}

function registrarCampoOficialPendiente(
  vistos: Set<string>,
  out: CampoOficialPendienteActa[],
  campo: string,
  motivo: CampoOficialPendienteActa['motivo'],
): void {
  const clave = campo.trim().toLowerCase();
  if (!clave || vistos.has(clave)) {
    return;
  }
  vistos.add(clave);
  out.push({ campo: clave, motivo });
}

/** Lista campos oficiales en textos de completitud (falta, cero o copy ya humanizado). */
export function extraerCamposOficialesPendientes(texto: string): CampoOficialPendienteActa[] {
  const vistos = new Set<string>();
  const out: CampoOficialPendienteActa[] = [];
  const patrones: Array<{ motivo: CampoOficialPendienteActa['motivo']; re: RegExp }> = [
    { motivo: 'falta', re: /Falta dato oficial:\s*([a-zA-Z0-9_]+)/gi },
    { motivo: 'cero', re: /Dato oficial en cero:\s*([a-zA-Z0-9_]+)/gi },
    {
      motivo: 'falta',
      re: /Falta el valor ([^.]+?) en datos oficiales del período/gi,
    },
    {
      motivo: 'cero',
      re: /El valor ([^.]+?) no puede quedar en cero en datos oficiales del período/gi,
    },
  ];
  for (const { motivo, re } of patrones) {
    let coincidencia: RegExpExecArray | null;
    while ((coincidencia = re.exec(texto)) !== null) {
      const fragmento = coincidencia[1].trim();
      const campoDirecto = fragmento.toLowerCase();
      if (/^[a-z0-9_]+$/i.test(campoDirecto)) {
        registrarCampoOficialPendiente(vistos, out, campoDirecto, motivo);
        continue;
      }
      const desdeEtiqueta = campoDesdeEtiquetaRRHH(fragmento);
      if (desdeEtiqueta) {
        registrarCampoOficialPendiente(vistos, out, desdeEtiqueta, motivo);
      }
    }
  }
  return out;
}

/** @deprecated Usar extraerCamposOficialesPendientes */
export function extraerCamposFaltaDatoOficial(texto: string): string[] {
  return extraerCamposOficialesPendientes(texto).map((item) => item.campo);
}

export function mensajeFaltaCampoOficial(campo: string): string {
  return `Falta el valor ${etiquetaCampoOficial(campo)} en datos oficiales del período`;
}

export function mensajeCampoOficialEnCero(campo: string): string {
  return `El valor ${etiquetaCampoOficial(campo)} no puede quedar en cero en datos oficiales del período`;
}

export function mensajeCampoOficialPendiente(campo: string, motivo: CampoOficialPendienteActa['motivo']): string {
  return motivo === 'cero' ? mensajeCampoOficialEnCero(campo) : mensajeFaltaCampoOficial(campo);
}

export function tituloCampoOficialPendiente(campo: string): string {
  return etiquetaCampoOficial(campo);
}
