import type {
  LiquidacionDocumentoDetalleVm,
  LiquidacionDocumentoLineaVm,
  LiquidacionDocumentoSheetPresentacionVm,
  LiquidacionDocumentoSheetVm,
  LiquidacionDocumentoTrabajadorVm,
  LiquidacionDocumentoCierreVm,
} from './liquidacion-documento-sheet.model';
import { TEXTO_LEGAL_LIQUIDACION_DEFAULT } from './liquidacion-documento-sheet.model';

function filtrarLineasConMonto(lineas: readonly LiquidacionDocumentoLineaVm[]): LiquidacionDocumentoLineaVm[] {
  return lineas.filter((linea) => linea.monto !== 0);
}

function sumarLineas(lineas: readonly LiquidacionDocumentoLineaVm[]): number {
  let total = 0;
  for (const linea of lineas) total += linea.monto;
  return total;
}

function montoPositivo(valor: number | null | undefined): number | null {
  return typeof valor === 'number' && Number.isFinite(valor) && valor > 0 ? valor : null;
}

function montoNoNegativo(valor: number | null | undefined): number {
  return typeof valor === 'number' && Number.isFinite(valor) && valor >= 0 ? valor : 0;
}

function textoOGuion(valor: string | null | undefined): string {
  const limpio = valor?.trim();
  return limpio ? limpio : '—';
}

function numeroOGuion(valor: number | null | undefined, formato?: (n: number) => string): string {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return '—';
  return formato ? formato(valor) : String(valor);
}

function textoAfpDetalle(trabajador: LiquidacionDocumentoTrabajadorVm): string {
  const afp = trabajador.afp?.trim();
  if (!afp) return '—';
  const tasa = trabajador.tasaAfp;
  if (typeof tasa === 'number' && Number.isFinite(tasa) && tasa > 0) {
    return `${afp} (${tasa.toLocaleString('es-CL', { maximumFractionDigits: 2 })}%)`;
  }
  return afp;
}

function textoApvDetalle(trabajador: LiquidacionDocumentoTrabajadorVm): string {
  const apv = trabajador.apv?.trim();
  if (!apv) {
    const cotiz = trabajador.apvCotizacion;
    if (cotiz != null && cotiz > 0) return `Cotiz: $${cotiz.toLocaleString('es-CL', { maximumFractionDigits: 0 })}`;
    return '—';
  }
  const cotiz = trabajador.apvCotizacion;
  if (cotiz != null && cotiz > 0) {
    return `${apv} (Cotiz: $${cotiz.toLocaleString('es-CL', { maximumFractionDigits: 0 })})`;
  }
  return apv;
}

function sanitizarTrabajador(trabajador: LiquidacionDocumentoTrabajadorVm): LiquidacionDocumentoTrabajadorVm {
  return {
    ...trabajador,
    cargo: trabajador.cargo?.trim() || null,
    tipoContrato: trabajador.tipoContrato?.trim() || null,
    afp: trabajador.afp?.trim() || null,
    salud: trabajador.salud?.trim() || null,
    email: trabajador.email?.trim() || null,
    mutual: trabajador.mutual?.trim() || null,
    apv: trabajador.apv?.trim() || null,
    ccaf: trabajador.ccaf?.trim() || null,
    fechaIngreso: trabajador.fechaIngreso?.trim() || null,
    sueldoBase: montoPositivo(trabajador.sueldoBase),
    diasTrabajados: montoPositivo(trabajador.diasTrabajados),
    tasaAfp:
      typeof trabajador.tasaAfp === 'number' && Number.isFinite(trabajador.tasaAfp) && trabajador.tasaAfp > 0
        ? trabajador.tasaAfp
        : null,
    apvCotizacion: montoPositivo(trabajador.apvCotizacion),
  };
}

function sanitizarDetalle(
  detalle: LiquidacionDocumentoDetalleVm | null | undefined,
  trabajador: LiquidacionDocumentoTrabajadorVm,
): LiquidacionDocumentoDetalleVm {
  const diasTrabajados = detalle?.diasTrabajados ?? trabajador.diasTrabajados ?? null;
  const diasBase = detalle?.diasBase ?? diasTrabajados ?? null;
  return {
    diasBase,
    ausencias: detalle?.ausencias ?? 0,
    diasTrabajados,
    utm: detalle?.utm ?? null,
    uf: detalle?.uf ?? null,
    cargas: detalle?.cargas ?? null,
  };
}

function sanitizarCierre(
  cierre: LiquidacionDocumentoCierreVm | null | undefined,
  empresa: LiquidacionDocumentoSheetVm['empresa'],
): LiquidacionDocumentoCierreVm {
  return {
    anticipos: montoNoNegativo(cierre?.anticipos),
    prestamos: montoNoNegativo(cierre?.prestamos),
    otrosDescuentos: montoNoNegativo(cierre?.otrosDescuentos),
    autorizadoPor: cierre?.autorizadoPor?.trim() || null,
    unidadNegocio: cierre?.unidadNegocio?.trim() || null,
    categoria: cierre?.categoria?.trim() || null,
    proyecto: cierre?.proyecto?.trim() || null,
    emitidoPor: cierre?.emitidoPor?.trim() || null,
    textoLegal: cierre?.textoLegal?.trim() || empresa.textoPie?.trim() || TEXTO_LEGAL_LIQUIDACION_DEFAULT,
    textoCopyright: cierre?.textoCopyright?.trim() || null,
  };
}

export function sanitizarLiquidacionDocumentoSheetVm(
  vm: LiquidacionDocumentoSheetVm,
): LiquidacionDocumentoSheetPresentacionVm {
  const haberesImponibles = filtrarLineasConMonto(vm.haberesImponibles);
  const haberesNoImponibles = filtrarLineasConMonto(vm.haberesNoImponibles);
  const descuentosLegales = filtrarLineasConMonto(vm.descuentosLegales);
  const descuentosVoluntarios = filtrarLineasConMonto(vm.descuentosVoluntarios);
  const bonificacionesDescuentos = filtrarLineasConMonto(vm.bonificacionesDescuentos ?? []);

  const subtotalHaberesImponibles = sumarLineas(haberesImponibles);
  const subtotalHaberesNoImponibles = sumarLineas(haberesNoImponibles);
  const subtotalDescuentosLegales = sumarLineas(descuentosLegales);
  const subtotalDescuentosVoluntarios = sumarLineas(descuentosVoluntarios);

  const trabajador = sanitizarTrabajador(vm.trabajador);
  const detalle = sanitizarDetalle(vm.detalle, trabajador);
  const cierre = sanitizarCierre(vm.cierre, vm.empresa);

  const montoTotalBonificaciones =
    vm.totalBonificaciones != null && vm.totalBonificaciones > 0
      ? vm.totalBonificaciones
      : sumarLineas(bonificacionesDescuentos);

  const montoOtrosDescuentos =
    cierre.otrosDescuentos && cierre.otrosDescuentos > 0
      ? cierre.otrosDescuentos
      : subtotalDescuentosVoluntarios;

  const numeroDocumento = vm.numeroDocumento?.trim() || null;

  return {
    ...vm,
    numeroDocumento,
    periodoCorto: vm.periodoCorto ?? null,
    trabajador,
    detalle,
    cierre,
    bonificacionesDescuentos,
    haberesImponibles,
    haberesNoImponibles,
    descuentosLegales,
    descuentosVoluntarios,
    subtotalHaberesImponibles,
    subtotalHaberesNoImponibles,
    subtotalDescuentosLegales,
    subtotalDescuentosVoluntarios,
    mostrarSubtotalImponibles: true,
    mostrarSubtotalNoImponibles: true,
    mostrarSubtotalLegales: descuentosVoluntarios.length > 0,
    mostrarSubtotalVoluntarios: descuentosVoluntarios.length > 0,
    mostrarBloqueHaberes: true,
    mostrarBloqueDescuentos: true,
    cuerpoUnaColumna: false,
    mostrarBaseImponiblePrevisional: vm.baseImponiblePrevisional > 0,
    mostrarBaseTributable: vm.baseTributable > 0,
    mostrarBasesLegales: true,
    mostrarAportesEmpleador: false,
    mostrarFranjaResumen: false,
    mostrarEtiquetaImponibles: true,
    mostrarEtiquetaNoImponibles: true,
    mostrarEtiquetaLegales: false,
    mostrarEtiquetaVoluntarios: descuentosVoluntarios.length > 0,
    mostrarFechaIngreso: !!trabajador.fechaIngreso,
    mostrarDetalle: true,
    mostrarNumeroDocumento: !!numeroDocumento,
    mostrarEmail: !!trabajador.email,
    mostrarTasaAfp: !!trabajador.tasaAfp,
    mostrarMutual: !!trabajador.mutual,
    mostrarUtm: detalle.utm != null,
    mostrarUf: detalle.uf != null,
    mostrarCargas: detalle.cargas != null,
    mostrarTotalesEnHaberes: true,
    mostrarLiquidoEnDescuentos: true,
    mostrarCajaLiquido: true,
    mostrarBonificacionesVacias: bonificacionesDescuentos.length === 0,
    textoAfpDetalle: textoAfpDetalle(trabajador),
    textoApvDetalle: textoApvDetalle(trabajador),
    textoAportesEmpleador: null,
    valorDiasBase: numeroOGuion(detalle.diasBase),
    valorAusencias: numeroOGuion(detalle.ausencias ?? 0),
    valorDiasTrabajados: numeroOGuion(detalle.diasTrabajados),
    valorUtm: detalle.utm != null ? `$${detalle.utm.toLocaleString('es-CL', { maximumFractionDigits: 0 })}` : '—',
    valorUf:
      detalle.uf != null
        ? `$${detalle.uf.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '—',
    valorCargas: numeroOGuion(detalle.cargas),
    valorSalud: textoOGuion(trabajador.salud),
    valorMutual: textoOGuion(trabajador.mutual),
    valorCcaf: textoOGuion(trabajador.ccaf),
    valorAutorizadoPor: textoOGuion(cierre.autorizadoPor),
    valorFirmaEmpleador: textoOGuion(
      vm.empresa.nombreFirmaEmpleador?.trim() || vm.empresa.representanteLegal?.trim() || null,
    ),
    valorUnidadNegocio: textoOGuion(cierre.unidadNegocio),
    valorCategoria: textoOGuion(cierre.categoria),
    valorProyecto: textoOGuion(cierre.proyecto),
    valorEmitidoPor: textoOGuion(cierre.emitidoPor),
    valorTextoLegal: cierre.textoLegal ?? TEXTO_LEGAL_LIQUIDACION_DEFAULT,
    valorTextoCopyright:
      cierre.textoCopyright ??
      `Licenciada a ${vm.empresa.razonSocial}`,
    montoAnticipos: cierre.anticipos ?? 0,
    montoPrestamos: cierre.prestamos ?? 0,
    montoOtrosDescuentos,
    montoTotalBonificaciones,
    mostrarSecundario: false,
    mostrarSueldoBase: trabajador.sueldoBase != null,
    mostrarDiasTrabajados: trabajador.diasTrabajados != null,
    aporteSis: null,
    aporteSanna: null,
    aporteMutual: null,
  };
}
