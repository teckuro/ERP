import type { MessageBoxConfig, MessageBoxSection } from '../../../shared/components/ui/feedback/message-box/message-box.types';
import type { ConfirmacionProcesoMensualView } from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';
import {
  buildParametrosReconciliacionDiferenciasDialog,
  detalleDiferenciasOficialesCliente,
} from '../../parametros-generales/rules/parametros-dialog.rules';

/** Contenido proyectado legacy (slot `nom-acta-modal` en overlays de nómina). */
export interface NominaMsgboxLabLegacyActa {
  puntosTitulo?: string;
  puntos?: string[];
  secciones?: Array<{ titulo: string; items?: string[] }>;
  proximaAccion?: string;
  mostrarProximaAccion?: boolean;
}

export type NominaMsgboxLabTabId = 'referencia' | 'nomina-actual' | 'nomina-propuesto' | 'utilidad';

export interface NominaMsgboxLabExample {
  id: string;
  tab: NominaMsgboxLabTabId;
  label: string;
  descripcion: string;
  cuandoUsar: string;
  notas?: string;
  variant: MessageBoxConfig['variant'];
  eyebrow?: string;
  title: string;
  message: string;
  detail?: string;
  sections?: MessageBoxSection[];
  primaryLabel?: string;
  secondaryLabel?: string;
  tertiaryLabel?: string;
  width?: MessageBoxConfig['width'];
  /** Si existe, el preview usa proyección legacy además de `sections`. */
  legacyActa?: NominaMsgboxLabLegacyActa;
}

export const NOMINA_MSGBOX_LAB_TABS: ReadonlyArray<{ id: NominaMsgboxLabTabId; label: string }> = [
  { id: 'referencia', label: 'Referencia (Parámetros)' },
  { id: 'nomina-actual', label: 'Nómina actual' },
  { id: 'nomina-propuesto', label: 'Nómina propuesto' },
  { id: 'utilidad', label: 'Utilidad' },
];

const PERIODO_EJEMPLO = '2026-05';

export function mapConfirmacionNominaToSections(
  view: Pick<
    ConfirmacionProcesoMensualView,
    'puntos' | 'puntosTitulo' | 'secciones' | 'proximaAccion' | 'mostrarProximaAccion' | 'detalle'
  >,
): MessageBoxSection[] {
  const sections: MessageBoxSection[] = [];

  if (view.detalle?.trim()) {
    sections.push({
      title: 'Contexto',
      text: view.detalle.trim(),
      tone: 'neutral',
    });
  }

  if ((view.puntos ?? []).length) {
    sections.push({
      title: view.puntosTitulo ?? 'Qué debe revisar RRHH',
      items: view.puntos ?? [],
      tone: 'neutral',
    });
  }

  for (const seccion of view.secciones ?? []) {
    if ((seccion.items ?? []).length) {
      sections.push({
        title: seccion.titulo,
        items: seccion.items ?? [],
        tone: 'attention',
      });
    }
  }

  if (view.mostrarProximaAccion !== false && view.proximaAccion?.trim()) {
    sections.push({
      title: 'Próxima acción',
      text: view.proximaAccion.trim(),
      tone: 'info',
    });
  }

  return sections.slice(0, 3);
}

export function buildNominaMsgboxLabExamples(): NominaMsgboxLabExample[] {
  const parametrosDlg = buildParametrosReconciliacionDiferenciasDialog(PERIODO_EJEMPLO, [
    { campo: 'uf', oficial: 40610.69, cliente: 0 },
  ]);

  const guardarRevisionBase: ConfirmacionProcesoMensualView = {
    tipo: 'guardar_preliminar',
    variant: 'decision',
    eyebrow: 'Revisión de nómina',
    titulo: 'Guardar revisión del período',
    mensaje: 'Crea un borrador de nómina editable para revisión de RRHH.',
    detalle: 'No congela parámetros ni genera liquidaciones previsionales.',
    puntosTitulo: 'Qué queda registrado',
    puntos: [
      'Habilita la revisión individual en la mesa operativa.',
      'Se invalidará automáticamente si modificas parámetros o fichas.',
    ],
    mostrarProximaAccion: true,
    proximaAccion: 'Registrar observaciones por persona y proceder a confirmar.',
    primaryLabel: 'Guardar revisión',
    secondaryLabel: 'Cancelar',
  };

  return [
    {
      id: 'parametros-reconciliacion',
      tab: 'referencia',
      label: 'Parámetros — diferencias con oficiales',
      descripcion: 'Patrón base del sistema: eyebrow automático, título claro, detalle con campos distintos y tres acciones.',
      cuandoUsar: 'Período cargado con configuración cliente distinta a la carga oficial del mes.',
      variant: parametrosDlg.variant === 'confirm' ? 'decision' : parametrosDlg.variant,
      title: parametrosDlg.title,
      message: parametrosDlg.message,
      detail: parametrosDlg.detail,
      primaryLabel: parametrosDlg.primaryLabel,
      secondaryLabel: parametrosDlg.secondaryLabel,
      tertiaryLabel: parametrosDlg.tertiaryLabel,
      width: 'md',
    },
    {
      id: 'parametros-carga',
      tab: 'referencia',
      label: 'Parámetros — carga del período',
      descripcion: 'Cargando minimalista: sin botón cerrar, sin eyebrow de ruido y con un texto breve transitorio.',
      cuandoUsar: 'Mientras se obtienen parámetros mensuales o plantilla de referencia.',
      variant: 'loading',
      eyebrow: '',
      title: 'Obteniendo parámetros...',
      message: 'Sincronizando topes previsionales y valores de Mayo 2026.',
      width: 'sm',
    },
    {
      id: 'nomina-calculando-cargando',
      tab: 'nomina-propuesto',
      label: 'Procesando cálculo (Cargando)',
      descripcion: 'Estado de espera compacto de procesamiento de nómina, sin acciones ni escape.',
      cuandoUsar: 'Al disparar el cálculo del motor de remuneraciones del período.',
      variant: 'loading',
      eyebrow: '',
      title: 'Calculando remuneraciones...',
      message: 'Procesando tramos de impuesto único y cotizaciones obligatorias.',
      width: 'sm',
    },
    {
      id: 'nomina-guardar-revision-actual',
      tab: 'nomina-actual',
      label: 'Guardar revisión (overlay actual)',
      descripcion: 'Implementación vigente: MessageBox + contenido proyectado `nom-acta-modal` (bloques custom fuera de `sections`).',
      cuandoUsar: 'Confirmación antes de guardar snapshot preliminar.',
      notas: 'Migrar a `sections` para alinear con Parámetros y bitácora de empleados.',
      variant: guardarRevisionBase.variant ?? 'decision',
      eyebrow: guardarRevisionBase.eyebrow,
      title: guardarRevisionBase.titulo,
      message: guardarRevisionBase.mensaje,
      detail: guardarRevisionBase.detalle,
      primaryLabel: guardarRevisionBase.primaryLabel,
      secondaryLabel: guardarRevisionBase.secondaryLabel,
      legacyActa: {
        puntosTitulo: guardarRevisionBase.puntosTitulo,
        puntos: guardarRevisionBase.puntos,
        mostrarProximaAccion: guardarRevisionBase.mostrarProximaAccion,
        proximaAccion: guardarRevisionBase.proximaAccion,
      },
    },
    {
      id: 'nomina-guardar-revision-propuesto',
      tab: 'nomina-propuesto',
      label: 'Guardar revisión (propuesto NOIA)',
      descripcion: 'Misma decisión usando solo API `sections` del MessageBox, sin slot proyectado y con redacción ejecutiva.',
      cuandoUsar: 'Objetivo de migración para decisiones de nómina con contexto estructurado.',
      variant: 'decision',
      eyebrow: 'Revisión de nómina',
      title: guardarRevisionBase.titulo,
      message: guardarRevisionBase.mensaje,
      sections: mapConfirmacionNominaToSections(guardarRevisionBase),
      primaryLabel: guardarRevisionBase.primaryLabel,
      secondaryLabel: guardarRevisionBase.secondaryLabel,
      width: 'md',
    },
    {
      id: 'nomina-confirmar-periodo-propuesto',
      tab: 'nomina-propuesto',
      label: 'Confirmar nómina del período',
      descripcion: 'Decisión irrevocable con advertencias en bloque attention, métricas reales congeladas y próxima acción explícita.',
      cuandoUsar: 'Cierre operativo de la nómina mensual tras revisión y registro de RRHH, previo a generar liquidaciones oficiales.',
      variant: 'warning',
      eyebrow: 'Decisión irreversible',
      title: 'Confirmar nómina de Mayo 2026',
      message: 'Confirmación oficial del período para emisión de liquidaciones.',
      sections: [
        {
          title: 'Resguardo de datos y snapshots',
          items: [
            'Congela la nómina de 125 trabajadores (Líquido: $81.250.400).',
            'Fija los parámetros previsionales vigentes (UF: $40.610,69, UTM: $65.443).',
            'Inhabilita modificaciones en fichas o variables sin reapertura.',
          ],
          tone: 'attention',
        },
        {
          title: 'Próxima acción',
          text: 'Habilitar la emisión de liquidaciones oficiales.',
          tone: 'info',
        },
      ],
      primaryLabel: 'Confirmar y congelar nómina',
      secondaryLabel: 'Volver a revisar',
      width: 'md',
    },
    {
      id: 'nomina-reapertura-alerta',
      tab: 'nomina-propuesto',
      label: 'Reabrir nómina operativa',
      descripcion: 'Acción crítica de reapertura con advertencia de invalidación de liquidaciones y auditoría integrada.',
      cuandoUsar: 'Cuando se requiere corregir un movimiento variable o ficha de empleado en un período ya confirmado.',
      variant: 'warning',
      eyebrow: 'Acción crítica',
      title: '¿Reabrir nómina de Mayo 2026?',
      message: 'Invalidará las liquidaciones preliminares generadas para este período.',
      sections: [
        {
          title: 'Efectos colaterales',
          items: [
            'Los haberes recurrentes y movimientos variables volverán a estar editables.',
            'Se eliminarán los snapshots de precalculados.',
            'Quedará registrado con tu firma en la bitácora inmutable de auditoría.',
          ],
          tone: 'attention',
        },
        {
          title: 'Próxima acción',
          text: 'Re-validar y confirmar la nómina tras corregir.',
          tone: 'info',
        },
      ],
      primaryLabel: 'Sí, reabrir nómina',
      secondaryLabel: 'Mantener confirmada',
      width: 'md',
    },
    {
      id: 'nomina-cierre-definitivo',
      tab: 'nomina-propuesto',
      label: 'Cierre definitivo de período',
      descripcion: 'Acción de alta severidad que bloquea permanentemente las remuneraciones mensuales.',
      cuandoUsar: 'Cierre final tras pago de transferencias bancarias y antes de exportar a Previred y LRE.',
      variant: 'warning',
      eyebrow: 'Cierre definitivo',
      title: 'Bloquear período permanentemente',
      message: 'Bloqueo permanente del mes de Mayo 2026.',
      sections: [
        {
          title: 'Resguardo legal y de auditoría',
          items: [
            'Inhabilita recálculos o modificaciones en fichas de este mes.',
            'Habilita Previred, LRE y firmas de liquidaciones.',
          ],
          tone: 'attention',
        },
      ],
      primaryLabel: 'Proceder al cierre definitivo',
      secondaryLabel: 'Cancelar',
      width: 'md',
    },
    {
      id: 'nomina-bloqueo-previred-dif',
      tab: 'nomina-propuesto',
      label: 'Inconsistencias previsionales (Bloqueo)',
      descripcion: 'Bloqueo severo en variante blocked que obliga a conciliar parámetros previsionales chilenos.',
      cuandoUsar: 'Prevalidación mensual bloqueada por diferencias en topes o tasas legales.',
      variant: 'blocked',
      eyebrow: 'Error previsional',
      title: 'Inconsistencias críticas en parámetros',
      message: 'Prevalidación mensual detenida por diferencias normativas.',
      sections: [
        {
          title: 'Diferencias detectadas',
          items: [
            'Diferencia en tasa Mutual de Seguridad (1,15% vs 0,95% oficial).',
            'Sueldo mínimo no cumple con el piso legal chileno ($500.000 vs $510.000).',
          ],
          tone: 'attention',
        },
        {
          title: 'Acción requerida',
          text: 'Sincronice los valores locales con el snapshot mensual oficial en Parámetros.',
          tone: 'info',
        },
      ],
      primaryLabel: 'Ir a Conciliar Parámetros',
      secondaryLabel: 'Entendido',
      width: 'md',
    },
    {
      id: 'nomina-bloqueo-generacion',
      tab: 'nomina-propuesto',
      label: 'No se puede generar la nómina',
      descripcion: 'Bloqueo operativo: variante blocked, lista de causas y una acción principal de corrección.',
      cuandoUsar: 'Prevalidación o generación detenida por datos de empleados faltantes.',
      variant: 'blocked',
      eyebrow: 'Bloqueo operativo',
      title: 'No fue posible generar la nómina',
      message: 'Existen pendientes críticos para el cálculo.',
      sections: [
        {
          title: 'Pendientes detectados',
          items: [
            '12 trabajadores con ficha incompleta (sin previsión).',
            'Diferencias sin conciliar en parámetros del mes.',
          ],
          tone: 'attention',
        },
        {
          title: 'Acción recomendada',
          text: 'Corrija los bloqueos críticos de trabajadores o parámetros antes de calcular.',
          tone: 'info',
        },
      ],
      primaryLabel: 'Revisar bloqueos',
      secondaryLabel: 'Cerrar',
      width: 'md',
    },
    {
      id: 'utilidad-detalle-multilinea',
      tab: 'utilidad',
      label: 'Detalle multilínea (Parámetros)',
      descripcion: 'Cuando el detalle es largo pero no requiere secciones: usar detail con saltos de línea.',
      cuandoUsar: 'Listas cortas de campos distintos sin bloques adicionales.',
      variant: 'warning',
      title: parametrosDlg.title,
      message: parametrosDlg.message,
      detail: detalleDiferenciasOficialesCliente(PERIODO_EJEMPLO, [
        { campo: 'uf', oficial: 40610.69, cliente: 0 },
        { campo: 'sanna', oficial: 0.03, cliente: 0.04 },
      ]),
      primaryLabel: 'Mantener mi configuración',
      secondaryLabel: 'Actualizar con oficiales',
      tertiaryLabel: 'Revisar después',
    },
  ];
}
