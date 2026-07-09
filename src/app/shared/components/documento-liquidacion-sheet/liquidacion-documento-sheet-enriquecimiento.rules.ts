import type { EmpleadoFichaDetalle } from '../../../features/empleados/models/empleado-listado.model';
import { TIPO_CONTRATO_OPTIONS } from '../../../features/empleados/catalogs/tipo-contrato.options';
import type { TipoContrato } from '../../../features/empleados/models/empleado.model';
import type { LiquidacionCalculada } from '../../../features/nomina-mensual/models/proceso-mensual.model';
import { calcularDiasPagablesBase30 } from '../../../features/nomina-mensual/rules/proceso-mensual-motor-entradas.rules';
import type {
  LiquidacionConcepto,
  LiquidacionEmision,
  LiquidacionTrabajador,
} from '../../../features/liquidaciones-oficiales/models/liquidacion-oficial.model';
import type {
  AfpParametro,
  IsapreParametro,
  ParametrosGeneralesCatalogos,
  ParametrosGeneralesClienteConfig,
} from '../../../features/parametros-generales/models/parametro-general.model';
import type {
  LiquidacionDocumentoCierreInput,
  LiquidacionDocumentoDetalleInput,
  LiquidacionDocumentoTrabajadorMetaInput,
} from './liquidacion-documento-sheet.mapper';
import type { LiquidacionDocumentoEmpresaVm } from './liquidacion-documento-sheet.model';
import { periodoCortoDocumento } from './liquidacion-documento-sheet.mapper';

const DIAS_BASE_MES = 30;

export interface ParametrosPeriodoDocumentoInput {
  uf?: number | null;
  utm?: number | null;
}

export interface EnriquecerDocumentoLiquidacionInput {
  trabajador: LiquidacionTrabajador;
  conceptos: readonly LiquidacionConcepto[];
  periodo: string;
  empresa?: LiquidacionDocumentoEmpresaVm | null;
  parametros?: ParametrosPeriodoDocumentoInput | null;
  emision?: LiquidacionEmision | null;
  ficha?: EmpleadoFichaDetalle | null;
  configCliente?: ParametrosGeneralesClienteConfig | null;
  catalogos?: ParametrosGeneralesCatalogos | null;
}

export interface DocumentoLiquidacionEnriquecido {
  trabajadorMeta: LiquidacionDocumentoTrabajadorMetaInput;
  detalle: LiquidacionDocumentoDetalleInput;
  cierre: LiquidacionDocumentoCierreInput;
  numeroDocumento: string;
  fechaEmision: string | null;
}

function textoMetadata(metadata: Record<string, unknown>, ...claves: string[]): string | null {
  for (const clave of claves) {
    const valor = metadata[clave];
    if (typeof valor === 'string' && valor.trim()) return valor.trim();
  }
  return null;
}

/** Nombre completo de quien autorizó la liquidación en liquidaciones oficiales. */
export function leerAutorizadoPorDesdeMetadata(metadata: Record<string, unknown>): string | null {
  const directo = textoMetadata(metadata, 'autorizadoPor', 'responsablePago');
  if (directo) return directo;

  const desdeBloque = leerActorRevisionDesdeMetadata(metadata, 'autorizacion');
  return desdeBloque?.usuarioNombre ?? null;
}

export interface LiquidacionRevisionActorDocumento {
  usuarioNombre: string;
  registradoEn: string | null;
}

function leerNombreActorDesdeBloque(bloque: Record<string, unknown>): string | null {
  return (
    textoMetadata(bloque, 'usuarioNombre', 'nombre', 'usuarioLabel') ??
    (bloque['usuarioResponsable'] && typeof bloque['usuarioResponsable'] === 'object'
      ? textoMetadata(bloque['usuarioResponsable'] as Record<string, unknown>, 'nombre', 'name')
      : null)
  );
}

/** Actor RRHH persistido en metadata denormalizada del trabajador. */
export function leerActorRevisionDesdeMetadata(
  metadata: Record<string, unknown>,
  claveBloque: string,
): LiquidacionRevisionActorDocumento | null {
  const bloque = metadata[claveBloque];
  if (!bloque || typeof bloque !== 'object') return null;
  const record = bloque as Record<string, unknown>;
  const usuarioNombre = leerNombreActorDesdeBloque(record);
  if (!usuarioNombre) return null;
  const registradoEn = textoMetadata(record, 'registradoEn', 'autorizadoEn', 'registrado_en');
  return { usuarioNombre, registradoEn };
}

export function leerPagoRegistradoPorDesdeMetadata(
  metadata: Record<string, unknown>,
): LiquidacionRevisionActorDocumento | null {
  return leerActorRevisionDesdeMetadata(metadata, 'pago');
}

export function leerDocumentoEntregadoPorDesdeMetadata(
  metadata: Record<string, unknown>,
): LiquidacionRevisionActorDocumento | null {
  return leerActorRevisionDesdeMetadata(metadata, 'documentoEntrega');
}

export function leerRectificacionSolicitadaPorDesdeMetadata(
  metadata: Record<string, unknown>,
): LiquidacionRevisionActorDocumento | null {
  return leerActorRevisionDesdeMetadata(metadata, 'rectificacionSolicitada');
}

function numeroMetadata(
  metadata: Record<string, unknown>,
  ...claves: string[]
): number | null {
  for (const clave of claves) {
    const valor = metadata[clave];
    if (typeof valor === 'number' && Number.isFinite(valor)) return valor;
    if (typeof valor === 'string' && valor.trim()) {
      const n = Number(valor.replace(',', '.'));
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function fechaEmisionHumana(iso: string | null | undefined): string | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.trim();
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'short' }).format(d);
}

function clasificarDescuentoCaja(concepto: LiquidacionConcepto): 'anticipo' | 'prestamo' | 'otro' {
  const texto = `${concepto.codigo ?? ''} ${concepto.nombre}`.toLowerCase();
  if (/anticipo/.test(texto)) return 'anticipo';
  if (/pr[eé]stamo|credito|crédito/.test(texto)) return 'prestamo';
  return 'otro';
}

/** Folio legible tipo S-0024-26 a partir del id de liquidación y período. */
export function formatearNumeroDocumentoLiquidacion(
  idLiquidacionTrabajador: number,
  periodo: string,
): string {
  const corto = periodoCortoDocumento(periodo);
  const anio = corto.includes('-') ? corto.split('-')[1] : corto.slice(-2);
  const secuencia = String(Math.max(1, idLiquidacionTrabajador)).padStart(4, '0');
  return `S-${secuencia}-${anio}`;
}

export function mapDetalleDocumentoDesdeFuentes(input: {
  trabajador: LiquidacionTrabajador;
  parametros?: ParametrosPeriodoDocumentoInput | null;
}): LiquidacionDocumentoDetalleInput {
  const meta = input.trabajador.metadata ?? {};
  const diasTrabajados =
    input.trabajador.diasTrabajados ??
    numeroMetadata(meta, 'diasTrabajados', 'dias_trabajados');
  const diasBase =
    numeroMetadata(meta, 'diasBase', 'dias_base') ??
    (diasTrabajados != null ? DIAS_BASE_MES : DIAS_BASE_MES);
  const ausencias =
    numeroMetadata(meta, 'ausencias', 'diasAusencia', 'dias_ausencia') ??
    (diasTrabajados != null ? Math.max(0, diasBase - diasTrabajados) : 0);

  return {
    diasBase,
    ausencias,
    diasTrabajados: diasTrabajados ?? null,
    utm: input.parametros?.utm ?? numeroMetadata(meta, 'utm', 'valorUtm'),
    uf: input.parametros?.uf ?? numeroMetadata(meta, 'uf', 'valorUf'),
    cargas: numeroMetadata(meta, 'cargas', 'numeroCargas', 'cargasFamiliares'),
  };
}

export function mapCierreDocumentoDesdeFuentes(input: {
  trabajador: LiquidacionTrabajador;
  conceptos: readonly LiquidacionConcepto[];
  empresa?: LiquidacionDocumentoEmpresaVm | null;
  emision?: LiquidacionEmision | null;
  periodo: string;
}): LiquidacionDocumentoCierreInput {
  const meta = input.trabajador.metadata ?? {};
  let anticipos = 0;
  let prestamos = 0;
  let otrosDescuentos = 0;

  for (const concepto of input.conceptos) {
    if (concepto.monto === 0) continue;
    if (concepto.tipo === 'haber' || concepto.tipo === 'cotizacion') continue;
    if (concepto.clasificacion === 'aporte_referencia') continue;
    const tipo = clasificarDescuentoCaja(concepto);
    if (tipo === 'anticipo') anticipos += concepto.monto;
    else if (tipo === 'prestamo') prestamos += concepto.monto;
    else if (concepto.tipo === 'descuento' || concepto.tipo === 'impuesto') {
      // Solo descuentos no legales típicos van a “otros” de la caja lateral.
      const texto = `${concepto.codigo ?? ''} ${concepto.nombre}`.toLowerCase();
      const esLegal = /afp|salud|fonasa|isapre|afc|cesant|impuesto|sanna|ley\s*16|sis\b|previsi/.test(
        texto,
      );
      if (!esLegal) otrosDescuentos += concepto.monto;
    }
  }

  const ultimaEmisionMeta =
    meta['ultimaEmision'] && typeof meta['ultimaEmision'] === 'object'
      ? (meta['ultimaEmision'] as Record<string, unknown>)
      : null;

  const emitidoPor =
    input.emision?.usuarioLabel?.trim() ||
    (typeof ultimaEmisionMeta?.['usuarioLabel'] === 'string'
      ? ultimaEmisionMeta['usuarioLabel'].trim()
      : null) ||
    textoMetadata(meta, 'usuarioResponsable', 'emitidoPor') ||
    null;

  return {
    anticipos,
    prestamos,
    otrosDescuentos,
    autorizadoPor: leerAutorizadoPorDesdeMetadata(meta),
    unidadNegocio:
      input.trabajador.centroCosto ??
      textoMetadata(meta, 'unidadNegocio', 'centroCosto', 'centro_costo') ??
      null,
    categoria: textoMetadata(meta, 'categoria', 'categoriaLaboral') ?? null,
    proyecto: textoMetadata(meta, 'proyecto', 'proyectoNombre') ?? null,
    emitidoPor,
    textoLegal: input.empresa?.textoPie ?? null,
    textoCopyright: input.empresa
      ? `Licenciada a ${input.empresa.razonSocial}`
      : null,
  };
}

export function enriquecerDocumentoDesdeLiquidacionOficial(
  input: EnriquecerDocumentoLiquidacionInput,
): DocumentoLiquidacionEnriquecido {
  const metaOficial = mapTrabajadorMetaEnriquecida(input.trabajador, input.conceptos);
  const metaFicha =
    input.ficha && input.catalogos
      ? mapTrabajadorMetaDesdeFichaEmpleado(input.ficha, input.catalogos)
      : null;
  const metaConceptos = inferirInstitucionesDesdeConceptos(input.conceptos);
  const instEmpresa =
    input.configCliente && input.catalogos
      ? mapInstitucionesEmpresaDesdeParametros(input.configCliente, input.catalogos)
      : null;

  const trabajadorMeta = mergeTrabajadorMeta(metaOficial, metaFicha, metaConceptos, instEmpresa);

  let detalle = mapDetalleDocumentoDesdeFuentes({
    trabajador: input.trabajador,
    parametros: input.parametros,
  });

  const diasFicha = input.ficha ? mapDiasTrabajadosDesdeFicha(input.ficha, input.periodo) : null;
  const cargasFicha = input.ficha ? mapCargasDesdeFicha(input.ficha) : null;

  if (detalle.diasTrabajados == null && diasFicha != null) {
    detalle = {
      ...detalle,
      diasTrabajados: diasFicha,
      ausencias: Math.max(0, DIAS_BASE_MES - diasFicha),
    };
  }
  if (detalle.cargas == null && cargasFicha != null) {
    detalle = { ...detalle, cargas: cargasFicha };
  }
  if (trabajadorMeta.diasTrabajados == null && detalle.diasTrabajados != null) {
    trabajadorMeta.diasTrabajados = detalle.diasTrabajados;
  }

  let cierre = mapCierreDocumentoDesdeFuentes({
    trabajador: input.trabajador,
    conceptos: input.conceptos,
    empresa: input.empresa,
    emision: input.emision,
    periodo: input.periodo,
  });
  if (!cierre.unidadNegocio && input.ficha) {
    cierre = { ...cierre, unidadNegocio: mapUnidadNegocioDesdeFicha(input.ficha) };
  }

  const fechaEmision =
    fechaEmisionHumana(input.emision?.emitidoEn) ||
    fechaEmisionHumana(
      typeof (input.trabajador.metadata?.['ultimaEmision'] as { emitidoEn?: string } | undefined)
        ?.emitidoEn === 'string'
        ? (input.trabajador.metadata?.['ultimaEmision'] as { emitidoEn: string }).emitidoEn
        : null,
    );

  return {
    trabajadorMeta,
    detalle,
    cierre,
    numeroDocumento: formatearNumeroDocumentoLiquidacion(
      input.trabajador.idLiquidacionTrabajador,
      input.periodo,
    ),
    fechaEmision,
  };
}

function leerCampoFormulario(bloque: Record<string, unknown> | undefined, clave: string): unknown {
  return bloque?.[clave];
}

function leerTextoFormulario(
  bloque: Record<string, unknown> | undefined,
  clave: string,
): string | null {
  const valor = leerCampoFormulario(bloque, clave);
  if (typeof valor === 'string' && valor.trim()) return valor.trim();
  return null;
}

function leerNumeroFormulario(
  bloque: Record<string, unknown> | undefined,
  clave: string,
): number | null {
  const valor = leerCampoFormulario(bloque, clave);
  if (typeof valor === 'number' && Number.isFinite(valor)) return valor;
  if (typeof valor === 'string' && valor.trim()) {
    const n = Number(valor.replace(',', '.'));
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function etiquetaTipoContrato(codigo: string | null): string | null {
  if (!codigo) return null;
  const opcion = TIPO_CONTRATO_OPTIONS.find((item) => item.value === (codigo as TipoContrato));
  return opcion?.label ?? codigo;
}

function resolverAfpCatalogo(
  catalogos: ParametrosGeneralesCatalogos,
  idAfp: number | null,
): AfpParametro | null {
  if (idAfp == null) return null;
  return (
    catalogos.afp.find((afp) => afp.idAfp === idAfp && afp.vigente) ??
    catalogos.afp.find((afp) => afp.idAfp === idAfp) ??
    null
  );
}

function resolverSaludCatalogo(
  catalogos: ParametrosGeneralesCatalogos,
  idSalud: number | null,
): IsapreParametro | null {
  if (idSalud == null) return null;
  const todas = [...catalogos.saludInstituciones, ...catalogos.isapres];
  return (
    todas.find((salud) => salud.idSalud === idSalud && salud.vigente) ??
    todas.find((salud) => salud.idSalud === idSalud) ??
    null
  );
}

function tasaAfpDesdeCatalogo(afp: AfpParametro | null): number | null {
  if (!afp || afp.tasaObligatoria == null || afp.comision == null) return null;
  return afp.tasaObligatoria + afp.comision;
}

function valorPreferidoMeta<T extends string | number>(
  ...candidatos: Array<T | null | undefined>
): T | null {
  for (const candidato of candidatos) {
    if (candidato == null) continue;
    if (typeof candidato === 'string' && !candidato.trim()) continue;
    if (typeof candidato === 'number' && !Number.isFinite(candidato)) continue;
    return candidato;
  }
  return null;
}

/** Fusiona meta oficial, ficha, conceptos e instituciones empresa (oficial gana si tiene dato). */
export function mergeTrabajadorMeta(
  oficial: LiquidacionDocumentoTrabajadorMetaInput,
  ficha?: Partial<LiquidacionDocumentoTrabajadorMetaInput> | null,
  conceptos?: Partial<LiquidacionDocumentoTrabajadorMetaInput> | null,
  empresa?: Partial<LiquidacionDocumentoTrabajadorMetaInput> | null,
): LiquidacionDocumentoTrabajadorMetaInput {
  return {
    cargo: valorPreferidoMeta(oficial.cargo, ficha?.cargo) ?? null,
    diasTrabajados: valorPreferidoMeta(oficial.diasTrabajados, ficha?.diasTrabajados) ?? null,
    fechaIngreso: valorPreferidoMeta(oficial.fechaIngreso, ficha?.fechaIngreso) ?? null,
    tipoContrato: valorPreferidoMeta(oficial.tipoContrato, ficha?.tipoContrato) ?? null,
    afp: valorPreferidoMeta(oficial.afp, ficha?.afp, conceptos?.afp) ?? null,
    salud: valorPreferidoMeta(oficial.salud, ficha?.salud, conceptos?.salud) ?? null,
    sueldoBase: valorPreferidoMeta(oficial.sueldoBase, ficha?.sueldoBase) ?? null,
    email: valorPreferidoMeta(oficial.email, ficha?.email) ?? null,
    tasaAfp: valorPreferidoMeta(oficial.tasaAfp, ficha?.tasaAfp, conceptos?.tasaAfp) ?? null,
    mutual: valorPreferidoMeta(oficial.mutual, empresa?.mutual, ficha?.mutual) ?? null,
    apv: valorPreferidoMeta(oficial.apv, ficha?.apv, conceptos?.apv) ?? null,
    apvCotizacion:
      valorPreferidoMeta(oficial.apvCotizacion, ficha?.apvCotizacion, conceptos?.apvCotizacion) ??
      null,
    ccaf: valorPreferidoMeta(oficial.ccaf, empresa?.ccaf, ficha?.ccaf) ?? null,
  };
}

/** Meta trabajador desde ficha de empleado y catálogos del período. */
export function mapTrabajadorMetaDesdeFichaEmpleado(
  ficha: EmpleadoFichaDetalle,
  catalogos: ParametrosGeneralesCatalogos,
): LiquidacionDocumentoTrabajadorMetaInput {
  const contrato = ficha.formValue.contrato;
  const contacto = ficha.formValue.contacto;
  const prevision = ficha.formValue.previsionSalud;

  const idAfp = leerNumeroFormulario(prevision, 'idAfp');
  const idSalud = leerNumeroFormulario(prevision, 'idSalud');
  const afpCat = resolverAfpCatalogo(catalogos, idAfp);
  const saludCat = resolverSaludCatalogo(catalogos, idSalud);

  const idInstitucionApv = leerNumeroFormulario(prevision, 'idInstitucionApv');
  const apvInst =
    idInstitucionApv != null
      ? catalogos.apvInstituciones.find((item) => item.idInstitucionApv === idInstitucionApv)
      : null;
  const tieneApv = leerCampoFormulario(prevision, 'tieneApv') === true;

  const cargoForm = leerTextoFormulario(contrato, 'cargo');
  const cargoListado = ficha.cargo?.trim();
  const fechaIngresoForm = leerTextoFormulario(contrato, 'fechaIngreso');
  const fechaIngresoListado =
    ficha.fechaIngreso && ficha.fechaIngreso !== 'Sin fecha' ? ficha.fechaIngreso : null;

  let salud: string | null = saludCat?.nombre ?? null;
  if (!salud) {
    const tipoSalud = leerTextoFormulario(prevision, 'tipoSalud');
    if (tipoSalud?.toUpperCase() === 'FONASA') salud = 'Fonasa';
    else if (tipoSalud?.toUpperCase() === 'ISAPRE') salud = 'Isapre';
  }

  return {
    cargo: cargoForm ?? (cargoListado && cargoListado !== 'Sin cargo' ? cargoListado : null),
    fechaIngreso: fechaIngresoForm ?? fechaIngresoListado,
    email: leerTextoFormulario(contacto, 'email'),
    tipoContrato: etiquetaTipoContrato(leerTextoFormulario(contrato, 'tipoContrato')),
    sueldoBase: leerNumeroFormulario(contrato, 'sueldoBase') ?? ficha.sueldoBase,
    afp: afpCat?.nombre ?? null,
    salud,
    tasaAfp: tasaAfpDesdeCatalogo(afpCat),
    apv: apvInst?.nombre ?? (tieneApv ? 'APV' : null),
    apvCotizacion: leerNumeroFormulario(prevision, 'montoApv'),
    mutual: null,
    ccaf: null,
    diasTrabajados: null,
  };
}

/** Mutual y CCAF de la empresa desde config cliente del período. */
export function mapInstitucionesEmpresaDesdeParametros(
  config: ParametrosGeneralesClienteConfig,
  catalogos: ParametrosGeneralesCatalogos,
): Pick<LiquidacionDocumentoTrabajadorMetaInput, 'mutual' | 'ccaf'> {
  const mutual =
    config.idOrganismoAdministradorLey16744 != null
      ? (catalogos.organismosLey16744.find(
          (item) => item.idOrganismoAdministradorLey16744 === config.idOrganismoAdministradorLey16744,
        )?.nombre ?? null)
      : null;
  const ccaf =
    config.idCcafEntidad != null
      ? (catalogos.ccafEntidades.find((item) => item.idCcafEntidad === config.idCcafEntidad)?.nombre ??
        null)
      : null;
  return { mutual, ccaf };
}

export function mapCargasDesdeFicha(ficha: EmpleadoFichaDetalle): number | null {
  return leerNumeroFormulario(ficha.formValue.contrato, 'cargas');
}

export function mapDiasTrabajadosDesdeFicha(
  ficha: EmpleadoFichaDetalle,
  periodo: string,
): number | null {
  const fechaIngreso = leerTextoFormulario(ficha.formValue.contrato, 'fechaIngreso');
  if (!fechaIngreso) return null;
  const fechaRetiro = leerTextoFormulario(ficha.formValue.contrato, 'fechaTermino');
  return calcularDiasPagablesBase30({
    anioMes: periodo,
    fechaIngreso,
    fechaRetiro: fechaRetiro ?? null,
  });
}

export function mapUnidadNegocioDesdeFicha(ficha: EmpleadoFichaDetalle): string | null {
  const depto = ficha.departamento?.trim();
  if (depto && depto !== 'Sin centro de costo') return depto;
  return null;
}

/** Fallback desde líneas materializadas (APV, salud Fonasa/Isapre, tasa AFP en concepto). */
export function inferirInstitucionesDesdeConceptos(
  conceptos: readonly LiquidacionConcepto[],
): Partial<LiquidacionDocumentoTrabajadorMetaInput> {
  const resultado: Partial<LiquidacionDocumentoTrabajadorMetaInput> = {};

  const apvConcepto = conceptos.find((concepto) =>
    /apv|ahorro\s*previsional/i.test(`${concepto.codigo ?? ''} ${concepto.nombre}`),
  );
  if (apvConcepto) {
    resultado.apv = apvConcepto.nombre;
    if (apvConcepto.monto > 0) resultado.apvCotizacion = apvConcepto.monto;
  }

  for (const concepto of conceptos) {
    const texto = concepto.nombre;
    if (/salud.*fonasa/i.test(texto)) resultado.salud = 'Fonasa';
    else if (/salud.*isapre/i.test(texto)) resultado.salud = 'Isapre';

    const matchAfp = /afp\s+(.+)$/i.exec(texto);
    const nombreAfp = matchAfp?.[1]?.trim();
    if (nombreAfp && !/trabajador/i.test(nombreAfp)) {
      resultado.afp = nombreAfp;
    }

    if (
      concepto.tasa != null &&
      concepto.tasa > 0 &&
      /afp|previsi/i.test(`${concepto.codigo ?? ''} ${concepto.nombre}`)
    ) {
      resultado.tasaAfp = concepto.tasa;
    }
  }

  return resultado;
}

/** Meta trabajador con APV/CCAF y tasa AFP inferida desde conceptos. */
export function mapTrabajadorMetaEnriquecida(
  trabajador: LiquidacionTrabajador,
  conceptos: readonly LiquidacionConcepto[] = [],
): LiquidacionDocumentoTrabajadorMetaInput {
  const meta = trabajador.metadata ?? {};
  const tasaDesdeConcepto = conceptos.find((c) => {
    const texto = `${c.codigo ?? ''} ${c.nombre}`.toLowerCase();
    return /afp|previsi/.test(texto) && c.tasa != null && c.tasa > 0;
  })?.tasa;

  const apvConcepto = conceptos.find((c) => /apv|ahorro\s*previsional/i.test(`${c.codigo ?? ''} ${c.nombre}`));

  return {
    cargo: trabajador.cargo,
    diasTrabajados: trabajador.diasTrabajados,
    fechaIngreso: trabajador.fechaIngreso,
    tipoContrato: textoMetadata(meta, 'tipoContrato', 'tipo_contrato'),
    afp: textoMetadata(meta, 'afp', 'afpNombre', 'nombre_afp'),
    salud: textoMetadata(meta, 'salud', 'saludNombre', 'nombre_salud'),
    sueldoBase: numeroMetadata(meta, 'sueldoBase', 'sueldo_base'),
    email: textoMetadata(meta, 'email', 'correo', 'correoElectronico'),
    tasaAfp: numeroMetadata(meta, 'tasaAfp', 'tasa_afp', 'porcentajeAfp') ?? tasaDesdeConcepto ?? null,
    mutual: textoMetadata(meta, 'mutual', 'mutualNombre', 'nombre_mutual'),
    apv: textoMetadata(meta, 'apv', 'apvNombre', 'nombre_apv') ?? (apvConcepto ? apvConcepto.nombre : null),
    apvCotizacion:
      numeroMetadata(meta, 'apvCotizacion', 'apv_cotizacion', 'cotizacionApv') ??
      (apvConcepto && apvConcepto.monto > 0 ? apvConcepto.monto : null),
    ccaf: textoMetadata(meta, 'ccaf', 'ccafNombre', 'nombre_ccaf', 'cajaCompensacion'),
  };
}

/** Enriquecimiento para preview de nómina (LiquidacionCalculada + meta parcial). */
export function enriquecerDocumentoDesdeCalculo(input: {
  liquidacion: LiquidacionCalculada;
  trabajadorMeta?: LiquidacionDocumentoTrabajadorMetaInput | null;
  parametros?: ParametrosPeriodoDocumentoInput | null;
  empresa?: LiquidacionDocumentoEmpresaVm | null;
  idReferencia?: number | null;
  periodo: string;
}): {
  trabajadorMeta: LiquidacionDocumentoTrabajadorMetaInput;
  detalle: LiquidacionDocumentoDetalleInput;
  cierre: LiquidacionDocumentoCierreInput;
  numeroDocumento: string;
  fechaEmision: string | null;
} {
  const metaBase = input.trabajadorMeta ?? {};
  const tasaDesdeTraza = input.liquidacion.trazabilidad.find(
    (t) => t.codigo === 'AFP_TASA_APLICADA' || /afp.*tasa/i.test(t.codigo),
  );
  const tasaAfp =
    metaBase.tasaAfp ??
    (typeof tasaDesdeTraza?.valorResultado === 'number' ? tasaDesdeTraza.valorResultado : null);

  const diasTrabajados = metaBase.diasTrabajados ?? null;
  const detalle: LiquidacionDocumentoDetalleInput = {
    diasBase: DIAS_BASE_MES,
    ausencias: diasTrabajados != null ? Math.max(0, DIAS_BASE_MES - diasTrabajados) : 0,
    diasTrabajados,
    utm: input.parametros?.utm ?? null,
    uf: input.parametros?.uf ?? null,
    cargas: null,
  };

  let anticipos = 0;
  let prestamos = 0;
  let otros = 0;
  for (const d of input.liquidacion.descuentosVoluntarios) {
    const texto = d.descripcion.toLowerCase();
    if (/anticipo/.test(texto)) anticipos += d.monto;
    else if (/pr[eé]stamo|credito|crédito/.test(texto)) prestamos += d.monto;
    else otros += d.monto;
  }

  return {
    trabajadorMeta: {
      ...metaBase,
      tasaAfp: tasaAfp ?? null,
    },
    detalle,
    cierre: {
      anticipos,
      prestamos,
      otrosDescuentos: otros,
      autorizadoPor: null,
      unidadNegocio: null,
      categoria: null,
      proyecto: null,
      emitidoPor: null,
      textoLegal: input.empresa?.textoPie ?? null,
      textoCopyright: input.empresa ? `Licenciada a ${input.empresa.razonSocial}` : null,
    },
    numeroDocumento: formatearNumeroDocumentoLiquidacion(
      input.idReferencia ?? input.liquidacion.idPersona,
      input.periodo,
    ),
    fechaEmision: null,
  };
}

/** Etiquetas RRHH más claras para líneas del comprobante. */
export function normalizarEtiquetaConceptoDocumento(descripcion: string): string {
  const mapa: Array<[RegExp, string]> = [
    [/^cotizaci[oó]n\s+afp(\s+trabajador)?$/i, 'Previsión (AFP)'],
    [/^cotizaci[oó]n\s+salud(\s+fonasa)?$/i, 'Salud'],
    [/^seguro\s+de\s+cesant[ií]a(\s+trabajador)?$/i, 'Seguro de cesantía'],
    [/^gratificaci[oó]n\s+legal(\s+art\.?\s*50)?$/i, 'Gratificación legal'],
    [/^sueldo\s+base$/i, 'Sueldo base'],
    [/^colaci[oó]n$/i, 'Colación'],
    [/^movilizaci[oó]n$/i, 'Movilización'],
    [/^impuesto\s+[uú]nico$/i, 'Impuesto único'],
  ];
  const limpio = descripcion.trim();
  for (const [re, label] of mapa) {
    if (re.test(limpio)) return label;
  }
  return limpio;
}
