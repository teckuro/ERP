import type {
  MessageBoxAction,
  MessageBoxConfig,
  MessageBoxSection,
} from '../../../shared/components/ui/feedback/message-box/message-box.types';
import type { ConfirmacionProcesoMensualView } from '../containers/proceso-mensual-container/models/proceso-mensual-container.vm';
import {
  buildParametrosReconciliacionDiferenciasDialog,
  detalleDiferenciasOficialesCliente,
} from '../../parametros-generales/rules/parametros-dialog.rules';
import {
  buildMsgboxDecisionCompacta,
  buildMsgboxDecisionGuiada,
  buildMsgboxDiagnostico,
  buildMsgboxErrorSimple,
  type MsgboxNoiaPattern,
} from '../../../shared/components/ui/feedback/message-box/message-box.builders';
import {
  mapConfirmacionProcesoMensualToSections,
} from './proceso-mensual-message-box.rules';

export type NominaMsgboxLabTabId = 'referencia' | 'nomina' | 'otros-flujos';

export interface NominaMsgboxLabExample {
  id: string;
  tab: NominaMsgboxLabTabId;
  patron: MsgboxNoiaPattern;
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
  actions?: MessageBoxAction[];
  primaryLabel?: string;
  secondaryLabel?: string;
  tertiaryLabel?: string;
  width?: MessageBoxConfig['width'];
}

export const NOMINA_MSGBOX_LAB_TABS: ReadonlyArray<{ id: NominaMsgboxLabTabId; label: string }> = [
  { id: 'referencia', label: 'Referencia' },
  { id: 'nomina', label: 'Nómina' },
  { id: 'otros-flujos', label: 'Otros flujos' },
];

const PERIODO_EJEMPLO = '2026-05';

export function mapConfirmacionNominaToSections(
  view: Pick<
    ConfirmacionProcesoMensualView,
    | 'tipo'
    | 'variant'
    | 'mensaje'
    | 'puntos'
    | 'puntosTitulo'
    | 'secciones'
    | 'proximaAccion'
    | 'mostrarProximaAccion'
    | 'detalle'
    | 'primaryLabel'
    | 'advertenciasAprobacion'
  >,
): MessageBoxSection[] {
  return mapConfirmacionProcesoMensualToSections(view);
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
      id: 'parametros-carga',
      tab: 'referencia',
      patron: 'loading',
      label: 'Parámetros - carga del período',
      descripcion: 'Cargando minimalista: sin botón cerrar, sin eyebrow de ruido y con un texto breve transitorio.',
      cuandoUsar: 'Mientras se obtienen parámetros mensuales o plantilla de referencia.',
      variant: 'loading',
      eyebrow: '',
      title: 'Obteniendo parámetros...',
      message: 'Sincronizando topes previsionales y valores de Mayo 2026.',
      width: 'sm',
    },
    {
      id: 'feedback-simple-exito',
      tab: 'referencia',
      patron: 'feedback-simple',
      label: 'Feedback simple',
      descripcion: 'Resultado breve donde el título y mensaje bastan.',
      cuandoUsar: 'Confirmaciones de guardado o sincronización sin decisión posterior.',
      variant: 'success',
      title: 'Cambios guardados',
      message: 'La información quedó actualizada para el período seleccionado.',
      primaryLabel: 'Aceptar',
      width: 'sm',
    },
    {
      id: 'error-simple-guardado',
      tab: 'referencia',
      patron: 'error-simple',
      label: 'Error simple',
      descripcion: 'Error operativo con una acción concreta y sin diagnóstico extenso.',
      cuandoUsar: 'Fallos recuperables donde el usuario solo debe corregir o reintentar.',
      variant: 'danger',
      title: 'No se pudo guardar',
      message: 'El registro tiene datos obligatorios pendientes.',
      sections: buildMsgboxErrorSimple({
        accion: 'Corrige los campos marcados y vuelve a guardar.',
      }),
      primaryLabel: 'Entendido',
      width: 'sm',
    },
    {
      id: 'utilidad-detalle-multilinea',
      tab: 'referencia',
      patron: 'diagnostico',
      label: 'Detalle multilínea',
      descripcion: 'Cuando una lista corta de diferencias se entiende mejor como detalle plano.',
      cuandoUsar: 'Diferencias de valores oficiales donde no hace falta dividir en bloques.',
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
    {
      id: 'decision-guiada-referencia',
      tab: 'referencia',
      patron: 'decision-guiada',
      label: 'Decisión guiada',
      descripcion: 'Tres bloques cuando hay pendiente, impacto y acción siguiente reales.',
      cuandoUsar: 'Decisiones de cierre que afectan estados posteriores del período.',
      variant: 'decision',
      eyebrow: 'Decisión requerida',
      title: 'Confirmar estado oficial',
      message: 'El período pasará a control de cierre mensual.',
      sections: buildMsgboxDecisionGuiada({
        pendiente: 'Validar que la revisión mensual esté completa.',
        impacto: 'El equipo usará esta versión para generar obligaciones del período.',
        accion: 'Confirmar solo cuando los pendientes críticos estén resueltos.',
        itemsImpacto: ['Trabajadores revisados.', 'Parámetros conciliados.'],
      }),
      primaryLabel: 'Confirmar',
      secondaryLabel: 'Volver',
      width: 'md',
    },
    {
      id: 'nomina-calculando-cargando',
      tab: 'nomina',
      patron: 'loading',
      label: 'Procesando cálculo',
      descripcion: 'Estado de espera compacto de procesamiento de nómina, sin acciones ni escape.',
      cuandoUsar: 'Al disparar el cálculo del motor de remuneraciones del período.',
      variant: 'loading',
      eyebrow: '',
      title: 'Calculando remuneraciones...',
      message: 'Procesando tramos de impuesto único y cotizaciones obligatorias.',
      width: 'sm',
    },
    {
      id: 'nomina-guardar-revision',
      tab: 'nomina',
      patron: 'decision-compacta',
      label: 'Guardar revisión',
      descripcion: 'Decisión compacta: el usuario necesita saber qué queda registrado y qué sigue.',
      cuandoUsar: 'Confirmación antes de guardar la versión revisable del período.',
      variant: guardarRevisionBase.variant ?? 'decision',
      eyebrow: guardarRevisionBase.eyebrow,
      title: guardarRevisionBase.titulo,
      message: guardarRevisionBase.mensaje,
      sections: mapConfirmacionNominaToSections(guardarRevisionBase),
      primaryLabel: guardarRevisionBase.primaryLabel,
      secondaryLabel: guardarRevisionBase.secondaryLabel,
      width: 'md',
    },
    {
      id: 'nomina-confirmar-periodo',
      tab: 'nomina',
      patron: 'decision-guiada',
      label: 'Confirmar nómina',
      descripcion: 'Cierre operativo con impacto y siguiente paso visibles.',
      cuandoUsar: 'Tras revisión de RRHH, previo a generar liquidaciones oficiales.',
      variant: 'warning',
      eyebrow: 'Confirmación oficial',
      title: 'Confirmar nómina de Mayo 2026',
      message: 'Confirma la nómina mensual como versión oficial del período.',
      sections: buildMsgboxDecisionGuiada({
        pendiente: 'La versión revisada quedará congelada como base del período.',
        impacto: 'Afecta el origen de liquidaciones y reportes oficiales posteriores.',
        itemsImpacto: ['Congela la nómina de 125 trabajadores.', 'No emite liquidaciones en este paso.'],
        accion: 'Generar liquidaciones desde la nómina confirmada.',
        attention: true,
      }),
      primaryLabel: 'Confirmar nómina',
      secondaryLabel: 'Volver a revisar',
      width: 'md',
    },
    {
      id: 'nomina-bloqueo-previred-dif',
      tab: 'nomina',
      patron: 'diagnostico',
      label: 'Bloqueos previsionales',
      descripcion: 'Diagnóstico con causas resumidas y una salida operativa.',
      cuandoUsar: 'Prevalidación mensual detenida por diferencias en topes o tasas legales.',
      variant: 'blocked',
      eyebrow: 'Bloqueo operativo',
      title: 'Inconsistencias críticas en parámetros',
      message: 'Prevalidación mensual detenida por diferencias normativas.',
      sections: buildMsgboxDiagnostico({
        diagnostico: 'Los valores previsionales no coinciden con la referencia oficial del período.',
        items: ['Tasa Mutual distinta a la oficial.', 'Sueldo mínimo bajo el piso legal.'],
        accion: 'Conciliar valores locales con la carga oficial mensual en Parámetros.',
      }),
      primaryLabel: 'Ir a conciliar parámetros',
      secondaryLabel: 'Entendido',
      width: 'md',
    },
    {
      id: 'nomina-reapertura-alerta',
      tab: 'nomina',
      patron: 'decision-guiada',
      label: 'Reabrir nómina crítica',
      descripcion: 'Acción crítica con efecto operacional, auditoría y acción posterior.',
      cuandoUsar: 'Cuando se requiere corregir un movimiento o ficha en un período confirmado.',
      variant: 'warning',
      eyebrow: 'Acción crítica',
      title: 'Reabrir nómina de Mayo 2026',
      message: 'La nómina volverá a estado editable para corregir el período.',
      sections: buildMsgboxDecisionGuiada({
        pendiente: 'Reabrir invalida la versión confirmada hasta una nueva revisión.',
        impacto: 'La acción queda registrada y las liquidaciones dependientes pueden requerir regeneración.',
        itemsImpacto: ['Movimientos vuelven a estar editables.', 'El cierre queda pendiente.'],
        accion: 'Revalidar y confirmar la nómina tras corregir.',
        attention: true,
      }),
      actions: accionesDecision('Sí, reabrir nómina', 'Mantener confirmada', true),
      primaryLabel: 'Sí, reabrir nómina',
      secondaryLabel: 'Mantener confirmada',
      width: 'md',
    },
    {
      id: 'empleados-alta-guiada',
      tab: 'otros-flujos',
      patron: 'decision-guiada',
      label: 'Empleados - alta avanzada',
      descripcion: 'Alta guiada conserva tres bloques cuando orienta el paso siguiente.',
      cuandoUsar: 'Finalización de alta con campos pendientes o coherencias administrativas.',
      variant: 'warning',
      eyebrow: 'Alta avanzada',
      title: 'Completar ficha antes de habilitar remuneraciones',
      message: 'La ficha puede quedar guardada, pero no lista para remunerar.',
      sections: buildMsgboxDecisionGuiada({
        pendiente: 'Faltan datos mínimos para dejar la ficha operativa.',
        itemsPendiente: ['Contrato', 'Previsión y salud'],
        impacto: 'Sin esos datos no se puede calcular una remuneración completa.',
        accion: 'Guardar borrador y continuar por la sección pendiente.',
      }),
      primaryLabel: 'Guardar borrador',
      secondaryLabel: 'Volver a editar',
      width: 'md',
    },
    {
      id: 'parametros-reconciliacion',
      tab: 'otros-flujos',
      patron: 'diagnostico',
      label: 'Parámetros - diferencias oficiales',
      descripcion: 'Diagnóstico de diferencias con tres salidas claras.',
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
      id: 'liquidaciones-generacion',
      tab: 'otros-flujos',
      patron: 'decision-compacta',
      label: 'Liquidaciones - generar',
      descripcion: 'Confirmación directa: contexto principal y acción.',
      cuandoUsar: 'Generar documentos desde una nómina ya confirmada.',
      variant: 'decision',
      eyebrow: 'Generación oficial',
      title: 'Generar liquidaciones del período',
      message: 'Se crearán documentos para los trabajadores incluidos en la nómina.',
      sections: buildMsgboxDecisionCompacta({
        principal: 'Usa la nómina confirmada como base de generación.',
        items: ['125 trabajadores incluidos.', 'No modifica movimientos mensuales.'],
        accion: 'Generar y revisar el resultado antes de publicar.',
      }),
      primaryLabel: 'Generar liquidaciones',
      secondaryLabel: 'Cancelar',
      width: 'md',
    },
    {
      id: 'data-grid-bulk',
      tab: 'otros-flujos',
      patron: 'decision-compacta',
      label: 'Data-grid - acción masiva',
      descripcion: 'Acción directa con dos bloques y jerarquía de botones clara.',
      cuandoUsar: 'Confirmar acciones sobre filas seleccionadas sin diagnóstico adicional.',
      variant: 'decision',
      title: 'Aplicar acción masiva',
      message: 'La operación afectará a los registros seleccionados.',
      sections: buildMsgboxDecisionCompacta({
        principal: 'Se procesarán 18 filas seleccionadas.',
        accion: 'Revisa la selección antes de confirmar.',
      }),
      primaryLabel: 'Aplicar',
      secondaryLabel: 'Cancelar',
      width: 'sm',
    },
  ];
}

function accionesDecision(primaryLabel: string, secondaryLabel: string, danger = false): MessageBoxAction[] {
  return [
    { label: secondaryLabel, value: 'secondary', role: 'secondary', align: 'left' },
    { label: primaryLabel, value: 'primary', role: danger ? 'danger' : 'primary', align: 'right' },
  ];
}
