export type VarianteSegmentoNavegacionNomina = 'pill' | 'stat';

export function claseSegmentNavActivo(activo: boolean, variante: VarianteSegmentoNavegacionNomina = 'pill'): string {
  const base = variante === 'stat' ? 'payroll-segment-nav__btn' : 'payroll-segment-nav__btn';
  return activo ? `${base} payroll-segment-nav__btn--active` : base;
}
