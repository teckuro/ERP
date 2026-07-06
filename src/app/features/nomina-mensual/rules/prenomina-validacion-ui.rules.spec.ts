import { describe, expect, it } from 'vitest';

import { mensajeErrorPrenominaParaUsuario } from './prenomina-validacion-ui.rules';

describe('prenomina-validacion-ui.rules', () => {
  it('devuelve null para mensaje vacío', () => {
    expect(mensajeErrorPrenominaParaUsuario(null)).toBeNull();
    expect(mensajeErrorPrenominaParaUsuario('   ')).toBeNull();
  });

  it('mapea hash mismatch sin código técnico', () => {
    expect(
      mensajeErrorPrenominaParaUsuario(
        'No se pudo registrar la aprobacion operativa: El hash del resultado no coincide; vuelve a guardar antes de aprobar.',
      ),
    ).toBe('Los datos del período cambiaron. Guarde de nuevo la revisión antes de aprobar.');
  });

  it('mapea liquidaciones pendientes antes de cierre', () => {
    expect(
      mensajeErrorPrenominaParaUsuario('Primero emite las liquidaciones del período antes de cerrarlo.'),
    ).toContain('emite');
  });

  it('quita prefijo No se pudo cuando el detalle es útil', () => {
    expect(
      mensajeErrorPrenominaParaUsuario('No se pudo cerrar operativamente la nomina: Periodo invalido.'),
    ).toBe('Periodo invalido.');
  });
});
