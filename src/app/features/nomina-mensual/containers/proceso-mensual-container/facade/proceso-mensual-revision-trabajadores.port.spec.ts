import { describe, expect, it } from 'vitest';

import { ProcesoMensualRevisionTrabajadoresPort } from './proceso-mensual-revision-trabajadores.port';

describe('ProcesoMensualRevisionTrabajadoresPort', () => {
  it('normaliza ids omitidos para comparar selección masiva', () => {
    const port = new ProcesoMensualRevisionTrabajadoresPort();

    port.seleccionarTrabajador('omitido-42');

    expect(port.clavePersona('omitido-42')).toBe('42');
    expect(port.mismaPersona(port.nominaMasivaTrabajadorSeleccionadoId(), 42)).toBe(true);
  });
});
