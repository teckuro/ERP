import { describe, expect, it } from 'vitest';
import { FICHA_EMPLEADO_TABS } from '../../../models/ficha-empleado-tabs.config';

describe('empleado-expediente-rail (config)', () => {
  it('tabs config alimenta el rail', () => {
    expect(FICHA_EMPLEADO_TABS.length).toBe(7);
    expect(FICHA_EMPLEADO_TABS[0]?.id).toBe('general');
  });
});
