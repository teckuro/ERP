export type PayrollStepId =
  | 'parameters'
  | 'employees'
  | 'movements'
  | 'calculation'
  | 'validation'
  | 'approval'
  | 'payslips';

export type PayrollStepStatus = 'completed' | 'active' | 'pending' | 'blocked' | 'warning';
export type StatusTone = 'blue' | 'green' | 'amber' | 'red' | 'gray' | 'purple';
export type ChecklistStatus = 'success' | 'warning' | 'error' | 'pending';

export type PayrollStep = {
  id: PayrollStepId;
  number: number;
  title: string;
  subtitle: string;
};

export type SummaryMetric = {
  id: string;
  label: string;
  value: string | number;
  helperText?: string;
  tone: StatusTone;
};

export type StatusChip = {
  label: string;
  tone: StatusTone;
};

export type ChecklistItem = {
  id: string;
  title: string;
  description: string;
  status: ChecklistStatus;
};

export type ConfigCard = {
  title: string;
  description: string;
  status: StatusChip;
};

export type PayrollEmployeeRow = {
  name: string;
  rut: string;
  role: string;
  costCenter: string;
  workSchedule: string;
  payrollStatus: StatusChip;
  bankStatus: StatusChip;
  contractStatus: StatusChip;
};

export type PayrollMovementRow = {
  worker: string;
  rut: string;
  type: StatusChip;
  concept: string;
  date: string;
  amount: string;
  origin: string;
  status: StatusChip;
};

export type PayrollCalculationRow = {
  worker: string;
  area: string;
  earnings: string;
  deductions: string;
  taxable: string;
  net: string;
  status: StatusChip;
};

export type ValidationRow = {
  rule: string;
  detail: string;
  severity: StatusChip;
};

export type ApprovalTimelineItem = {
  time: string;
  title: string;
  description: string;
  status: ChecklistStatus;
};

export type PayslipRow = {
  worker: string;
  rut: string;
  role: string;
  net: string;
  documentStatus: StatusChip;
  signature: StatusChip;
  delivery: StatusChip;
};
