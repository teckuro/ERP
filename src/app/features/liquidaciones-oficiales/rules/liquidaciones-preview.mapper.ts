import type {
  LiquidacionCalculada,
  LineaLiquidacionCalculada,
} from '../../nomina-mensual/models/proceso-mensual.model';
import type { LiquidacionConcepto, LiquidacionTrabajador } from '../models/liquidacion-oficial.model';

export interface MapLiquidacionPreviewOficialInput {
  trabajador: LiquidacionTrabajador;
  conceptos: readonly LiquidacionConcepto[];
  periodo: string;
}

function lineaDesdeConcepto(concepto: LiquidacionConcepto): LineaLiquidacionCalculada {
  return {
    codigo: concepto.codigo ?? concepto.codigoLre ?? 'CONCEPTO',
    descripcion: concepto.nombre,
    monto: concepto.monto,
    origen: 'liquidacion_oficial',
    imponible: concepto.clasificacion?.includes('imponible') ?? undefined,
    tributable: concepto.clasificacion?.includes('tributable') ?? undefined,
  };
}

function esAporteReferenciaEmpleador(concepto: LiquidacionConcepto): boolean {
  return concepto.tipo === 'cotizacion' || concepto.clasificacion === 'aporte_referencia';
}

function esDescuentoLegal(concepto: LiquidacionConcepto): boolean {
  if (concepto.tipo === 'impuesto') return true;
  const texto = `${concepto.codigo ?? ''} ${concepto.codigoLre ?? ''} ${concepto.nombre}`.toLowerCase();
  return /afp|salud|fonasa|isapre|afc|cesant|impuesto|sanna|ley\s*16|sis\b/.test(texto);
}

function numeroMetadata(metadata: Record<string, unknown>, clave: string): number {
  const raw = metadata[clave];
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
}

export function mapLiquidacionOficialAPreview(
  input: MapLiquidacionPreviewOficialInput,
): LiquidacionCalculada {
  const { trabajador, conceptos, periodo } = input;
  const haberesImponibles: LineaLiquidacionCalculada[] = [];
  const haberesNoImponibles: LineaLiquidacionCalculada[] = [];
  const descuentosLegales: LineaLiquidacionCalculada[] = [];
  const descuentosVoluntarios: LineaLiquidacionCalculada[] = [];

  for (const concepto of conceptos) {
    if (concepto.monto === 0 || esAporteReferenciaEmpleador(concepto)) continue;
    const linea = lineaDesdeConcepto(concepto);
    if (concepto.tipo === 'haber') {
      if (concepto.clasificacion === 'haber_no_imponible') {
        haberesNoImponibles.push(linea);
      } else {
        haberesImponibles.push(linea);
      }
      continue;
    }
    if (esDescuentoLegal(concepto)) {
      descuentosLegales.push(linea);
    } else {
      descuentosVoluntarios.push(linea);
    }
  }

  const meta = trabajador.metadata ?? {};

  return {
    periodo,
    idPersona: trabajador.idPersona ?? trabajador.idLiquidacionTrabajador,
    rut: trabajador.rut ?? '—',
    nombreCompleto: trabajador.nombreTrabajador,
    haberesImponibles,
    haberesNoImponibles,
    descuentosLegales,
    descuentosVoluntarios,
    baseImponiblePrevisional: trabajador.baseImponible,
    baseTributable: trabajador.baseTributable,
    gratificacionLegal: 0,
    asignacionFamiliar: 0,
    cotizacionAfp: numeroMetadata(meta, 'cotizacionAfp'),
    cotizacionSalud: numeroMetadata(meta, 'cotizacionSalud'),
    cotizacionAfc: numeroMetadata(meta, 'cotizacionAfc'),
    cotizacionSis: 0,
    cotizacionSanna: 0,
    cotizacionLey16744: 0,
    impuestoUnico: descuentosLegales
      .filter((d) => /impuesto/i.test(d.descripcion))
      .reduce((sum, d) => sum + d.monto, 0),
    totalHaberes: trabajador.totalHaberes,
    totalDescuentos: trabajador.totalDescuentos,
    liquidoAPago: trabajador.liquidoPagar,
    issues: [],
    trazabilidad: [],
    estado: 'calculado_preliminar',
  };
}
