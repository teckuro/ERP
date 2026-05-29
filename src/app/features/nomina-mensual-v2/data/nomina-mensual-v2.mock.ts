import type {
  ApprovalTimelineItem,
  ChecklistItem,
  ConfigCard,
  PayrollCalculationRow,
  PayrollEmployeeRow,
  PayrollMovementRow,
  PayrollStep,
  PayslipRow,
  SummaryMetric,
  ValidationRow,
} from '../models/nomina-mensual-v2.models';

export const payrollSteps: PayrollStep[] = [
  { id: 'parameters', number: 1, title: 'Parámetros', subtitle: 'Configurar' },
  { id: 'employees', number: 2, title: 'Empleados', subtitle: 'Revisar' },
  { id: 'movements', number: 3, title: 'Novedades', subtitle: 'Registrar' },
  { id: 'calculation', number: 4, title: 'Cálculo', subtitle: 'Procesar' },
  { id: 'validation', number: 5, title: 'Validación', subtitle: 'Revisar' },
  { id: 'approval', number: 6, title: 'Aprobación', subtitle: 'Autorizar' },
  { id: 'payslips', number: 7, title: 'Liquidaciones', subtitle: 'Generar' },
];

export const parameterCards: ConfigCard[] = [
  { title: 'Datos de empresa', description: 'Información legal, dirección, RUT y datos para emisión.', status: { label: 'Completo', tone: 'green' } },
  { title: 'UF/UTM/IPC', description: 'Valores oficiales e históricos utilizados en cálculos.', status: { label: 'Completo', tone: 'green' } },
  { title: 'Topes imponibles', description: 'Topes vigentes para imposiciones y cotizaciones.', status: { label: 'Requiere revisión', tone: 'amber' } },
  { title: 'AFP/Salud', description: 'Entidades previsionales y de salud asociadas.', status: { label: 'Completo', tone: 'green' } },
  { title: 'Caja de compensación', description: 'Caja configurada para trabajadores vigentes.', status: { label: 'Completo', tone: 'green' } },
  { title: 'Mutuales', description: 'Mutual y tasas por actividad económica.', status: { label: 'Requiere revisión', tone: 'amber' } },
  { title: 'Centros de costo', description: 'Estructura de centros y asignaciones.', status: { label: 'Completo', tone: 'green' } },
  { title: 'Jornadas y turnos', description: 'Jornadas laborales, turnos y horarios definidos.', status: { label: 'Pendiente', tone: 'amber' } },
  { title: 'Fórmulas de haberes', description: 'Reglas para haberes, bonos y asignaciones.', status: { label: 'Completo', tone: 'green' } },
  { title: 'Fórmulas de descuentos', description: 'Reglas para descuentos legales y voluntarios.', status: { label: 'Pendiente', tone: 'amber' } },
];

export const parameterMetrics: SummaryMetric[] = [
  { id: 'completion', label: 'Completitud', value: '72%', helperText: '18 de 25 parámetros', tone: 'blue' },
  { id: 'blockers', label: 'Bloqueos', value: 3, helperText: 'Obligatorios', tone: 'red' },
  { id: 'review', label: 'Requiere revisión', value: 2, helperText: 'Advertencias', tone: 'amber' },
  { id: 'done', label: 'Completos', value: 13, helperText: 'Listos', tone: 'green' },
];

export const employeeMetrics: SummaryMetric[] = [
  { id: 'active', label: 'Activos', value: 124, helperText: 'Trabajadores activos', tone: 'green' },
  { id: 'contracts', label: 'Con contrato vigente', value: 118, helperText: '95,2% del total', tone: 'blue' },
  { id: 'bank', label: 'Datos bancarios pendientes', value: 6, helperText: '4,8% del total', tone: 'amber' },
  { id: 'docs', label: 'Documentación incompleta', value: 4, helperText: '3,2% del total', tone: 'red' },
];

export const employeeRows: PayrollEmployeeRow[] = [
  { name: 'Felipe Muñoz Araya', rut: '12.345.678-9', role: 'Analista Contable', costCenter: 'Administración', workSchedule: 'Completa', payrollStatus: { label: 'Listo', tone: 'green' }, bankStatus: { label: 'Completo', tone: 'green' }, contractStatus: { label: 'Vigente', tone: 'green' } },
  { name: 'María José Contreras', rut: '16.789.234-1', role: 'Asistente RR.HH.', costCenter: 'Recursos Humanos', workSchedule: 'Completa', payrollStatus: { label: 'Listo', tone: 'green' }, bankStatus: { label: 'Completo', tone: 'green' }, contractStatus: { label: 'Vigente', tone: 'green' } },
  { name: 'Luis González Rojas', rut: '10.987.654-3', role: 'Operario de Bodega', costCenter: 'Operaciones', workSchedule: 'Parcial', payrollStatus: { label: 'Listo', tone: 'green' }, bankStatus: { label: 'Completo', tone: 'green' }, contractStatus: { label: 'Vigente', tone: 'green' } },
  { name: 'Carla Álvarez Soto', rut: '18.456.789-0', role: 'Vendedora', costCenter: 'Comercial', workSchedule: 'Completa', payrollStatus: { label: 'Listo', tone: 'green' }, bankStatus: { label: 'Pendiente', tone: 'amber' }, contractStatus: { label: 'Vigente', tone: 'green' } },
  { name: 'Benjamín Astudillo', rut: '19.876.543-2', role: 'Técnico Mantención', costCenter: 'Mantenimiento', workSchedule: 'Completa', payrollStatus: { label: 'Observado', tone: 'amber' }, bankStatus: { label: 'Completo', tone: 'green' }, contractStatus: { label: 'Vigente', tone: 'green' } },
  { name: 'Valentina Pérez Díaz', rut: '20.123.456-7', role: 'Diseñadora UX', costCenter: 'Marketing', workSchedule: 'Completa', payrollStatus: { label: 'Listo', tone: 'green' }, bankStatus: { label: 'Completo', tone: 'green' }, contractStatus: { label: 'Vigente', tone: 'green' } },
  { name: 'Jorge Riquelme Silva', rut: '14.112.223-8', role: 'Analista de Datos', costCenter: 'Administración', workSchedule: 'Completa', payrollStatus: { label: 'Listo', tone: 'green' }, bankStatus: { label: 'Pendiente', tone: 'amber' }, contractStatus: { label: 'Vigente', tone: 'green' } },
  { name: 'Natalia Sepúlveda', rut: '17.223.334-5', role: 'Asesora Comercial', costCenter: 'Comercial', workSchedule: 'Parcial', payrollStatus: { label: 'Listo', tone: 'green' }, bankStatus: { label: 'Completo', tone: 'green' }, contractStatus: { label: 'Vigente', tone: 'green' } },
];

export const employeeChecklist: ChecklistItem[] = [
  { id: 'contracts', title: 'Contratos activos', description: '118 de 124 con contrato vigente', status: 'success' },
  { id: 'payment', title: 'Forma de pago', description: '6 trabajadores sin datos bancarios', status: 'warning' },
  { id: 'health', title: 'AFP/Salud asignada', description: '124 de 124 con asignación válida', status: 'success' },
  { id: 'costCenter', title: 'Centro de costo', description: '124 de 124 asignados', status: 'success' },
  { id: 'schedule', title: 'Jornada', description: '124 de 124 con jornada definida', status: 'success' },
];

export const movementMetrics: SummaryMetric[] = [
  { id: 'earnings', label: 'Haberes variables', value: 18, helperText: 'Este período', tone: 'green' },
  { id: 'deductions', label: 'Descuentos', value: 9, helperText: 'Este período', tone: 'red' },
  { id: 'licenses', label: 'Licencias', value: 3, helperText: 'Este período', tone: 'purple' },
  { id: 'recurring', label: 'Recurrentes aplicados', value: 42, helperText: 'Este período', tone: 'blue' },
];

export const movementRows: PayrollMovementRow[] = [
  { worker: 'Juan Pérez', rut: '12.345.678-9', type: { label: 'Haber', tone: 'green' }, concept: 'Bono de producción', date: '15/05/2026', amount: '$150.000', origin: 'Manual', status: { label: 'Pendiente', tone: 'amber' } },
  { worker: 'María Contreras', rut: '13.987.654-1', type: { label: 'Haber', tone: 'green' }, concept: 'Horas extra 50%', date: '20/05/2026', amount: '$75.000', origin: 'Manual', status: { label: 'Pendiente', tone: 'amber' } },
  { worker: 'Ricardo Silva', rut: '11.234.567-2', type: { label: 'Descuento', tone: 'red' }, concept: 'Atraso', date: '12/05/2026', amount: '-$18.000', origin: 'Manual', status: { label: 'Pendiente', tone: 'amber' } },
  { worker: 'Camila López', rut: '18.765.432-1', type: { label: 'Descuento', tone: 'red' }, concept: 'Anticipo', date: '10/05/2026', amount: '-$120.000', origin: 'Manual', status: { label: 'Pendiente', tone: 'amber' } },
  { worker: 'Felipe Pérez', rut: '16.543.210-8', type: { label: 'Licencia', tone: 'purple' }, concept: 'Licencia médica', date: '05/05/2026', amount: '$210.000', origin: 'Licencias médicas', status: { label: 'Cargado', tone: 'green' } },
  { worker: 'Valentina Araya', rut: '17.654.321-0', type: { label: 'Descuento', tone: 'red' }, concept: 'Colación', date: '31/05/2026', amount: '-$28.800', origin: 'Recurrente', status: { label: 'Aplicado', tone: 'blue' } },
];

export const calculationMetrics: SummaryMetric[] = [
  { id: 'processed', label: 'Trabajadores procesados', value: 124, helperText: 'de 124 trabajadores', tone: 'blue' },
  { id: 'earnings', label: 'Haberes imponibles', value: '$218.795.452', helperText: 'Total imponible', tone: 'green' },
  { id: 'deductions', label: 'Descuentos', value: '$58.743.912', helperText: 'Total descuentos', tone: 'red' },
  { id: 'net', label: 'Líquido estimado', value: '$160.051.540', helperText: 'Total líquido a pagar', tone: 'purple' },
];

export const calculationRows: PayrollCalculationRow[] = [
  { worker: 'María José Araya', area: 'Administración', earnings: '$2.350.000', deductions: '$662.700', taxable: '$2.120.000', net: '$1.687.300', status: { label: 'Calculado', tone: 'green' } },
  { worker: 'Carlos Reyes', area: 'Operaciones', earnings: '$1.850.000', deductions: '$525.800', taxable: '$1.650.000', net: '$1.324.200', status: { label: 'Calculado', tone: 'green' } },
  { worker: 'Loreto Contreras', area: 'Comercial', earnings: '$2.100.000', deductions: '$598.300', taxable: '$1.900.000', net: '$1.501.700', status: { label: 'Calculado', tone: 'green' } },
  { worker: 'Juan Morales', area: 'Logística', earnings: '$1.720.000', deductions: '$483.600', taxable: '$1.520.000', net: '$1.236.400', status: { label: 'Pendiente revisión', tone: 'amber' } },
  { worker: 'Pamela Fuentes', area: 'Recursos Humanos', earnings: '$2.480.000', deductions: '$701.900', taxable: '$2.230.000', net: '$1.778.100', status: { label: 'Calculado', tone: 'green' } },
  { worker: 'Andrés Bravo', area: 'Mantenimiento', earnings: '$1.560.000', deductions: '$436.700', taxable: '$1.360.000', net: '$1.123.300', status: { label: 'Pendiente revisión', tone: 'amber' } },
];

export const validationMetrics: SummaryMetric[] = [
  { id: 'rules', label: 'Validaciones ejecutadas', value: 28, helperText: 'Reglas revisadas', tone: 'blue' },
  { id: 'blockers', label: 'Bloqueos', value: 2, helperText: 'Impiden aprobar', tone: 'red' },
  { id: 'warnings', label: 'Advertencias', value: 5, helperText: 'Requieren revisión', tone: 'amber' },
  { id: 'hash', label: 'Hash snapshot', value: 'OK', helperText: 'Consistente', tone: 'green' },
];

export const validationRows: ValidationRow[] = [
  { rule: 'Trabajadores sin cuenta bancaria', detail: '2 trabajadores no tienen cuenta bancaria informada.', severity: { label: 'Bloqueo', tone: 'red' } },
  { rule: 'Descuento sin fórmula', detail: "El descuento 'Seguro complementario' no tiene fórmula asociada.", severity: { label: 'Bloqueo', tone: 'red' } },
  { rule: 'Centro de costo faltante', detail: '3 movimientos no tienen centro de costo asignado.', severity: { label: 'Advertencia', tone: 'amber' } },
  { rule: 'Topes imponibles revisados', detail: '1 trabajador supera el tope imponible de AFC.', severity: { label: 'Advertencia', tone: 'amber' } },
  { rule: 'Hash del resultado consistente', detail: 'El hash del resultado coincide con el snapshot guardado.', severity: { label: 'Informativo', tone: 'green' } },
  { rule: 'Licencias superpuestas', detail: 'No se detectaron licencias médicas superpuestas.', severity: { label: 'Informativo', tone: 'green' } },
];

export const approvalMetrics: SummaryMetric[] = [
  { id: 'period', label: 'Período', value: 'Mayo 2026', helperText: 'Período activo', tone: 'blue' },
  { id: 'workers', label: 'Trabajadores', value: 124, helperText: 'Incluidos', tone: 'green' },
  { id: 'net', label: 'Monto líquido total', value: '$182.345.678', helperText: 'A transferir', tone: 'purple' },
  { id: 'state', label: 'Estado', value: 'Lista para aprobar', helperText: 'Sin bloqueos', tone: 'green' },
];

export const approvalTimeline: ApprovalTimelineItem[] = [
  { time: '16/05/2026 10:24', title: 'Snapshot guardado', description: 'Se generó snapshot de la nómina de Mayo 2026.', status: 'success' },
  { time: '16/05/2026 10:25', title: 'Validación aprobada', description: 'La nómina fue validada correctamente.', status: 'success' },
  { time: '16/05/2026 10:25', title: 'Aprobación pendiente', description: 'Lista para ser aprobada y bloqueada.', status: 'pending' },
];

export const payslipMetrics: SummaryMetric[] = [
  { id: 'issued', label: 'Liquidaciones emitidas', value: 124, helperText: '100% del total', tone: 'blue' },
  { id: 'sent', label: 'Enviadas', value: 96, helperText: '77% del total', tone: 'green' },
  { id: 'pending', label: 'Pendientes de envío', value: 28, helperText: '23% del total', tone: 'amber' },
  { id: 'signature', label: 'Firma digital', value: 'OK', helperText: 'Todas firmadas', tone: 'green' },
];

export const payslipRows: PayslipRow[] = [
  { worker: 'Andrea Martínez López', rut: '17.895.321-4', role: 'Analista Contable', net: '$1.248.750', documentStatus: { label: 'Emitida', tone: 'green' }, signature: { label: 'Firmada', tone: 'green' }, delivery: { label: 'Enviada', tone: 'green' } },
  { worker: 'Carlos Ramírez Soto', rut: '13.456.789-2', role: 'Jefe de Operaciones', net: '$1.875.430', documentStatus: { label: 'Emitida', tone: 'green' }, signature: { label: 'Firmada', tone: 'green' }, delivery: { label: 'Enviada', tone: 'green' } },
  { worker: 'José Pérez Méndez', rut: '16.234.567-8', role: 'Técnico de Mantención', net: '$987.650', documentStatus: { label: 'Emitida', tone: 'green' }, signature: { label: 'Firmada', tone: 'green' }, delivery: { label: 'Pendiente', tone: 'amber' } },
  { worker: 'Lucía Contreras Díaz', rut: '18.765.432-1', role: 'Analista de RR.HH.', net: '$1.152.300', documentStatus: { label: 'Emitida', tone: 'green' }, signature: { label: 'Firmada', tone: 'green' }, delivery: { label: 'Enviada', tone: 'green' } },
  { worker: 'Felipe Díaz Morales', rut: '14.567.890-6', role: 'Supervisor Producción', net: '$1.593.200', documentStatus: { label: 'Emitida', tone: 'green' }, signature: { label: 'Firmada', tone: 'green' }, delivery: { label: 'Pendiente', tone: 'amber' } },
];
