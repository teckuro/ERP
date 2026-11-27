import { FormControl, Validators } from '@angular/forms';
import { describe, expect, it } from 'vitest';

import { ParametroCifraComponent } from './parametro-cifra.component';

function cifra(unidad: ParametroCifraComponent['unidad'], control: FormControl): ParametroCifraComponent {
  const componente = new ParametroCifraComponent();
  componente.unidad = unidad;
  componente.control = control;
  return componente;
}

describe('ParametroCifraComponent', () => {
  it('indica el valor oficial solo cuando la cifra mostrada difiere', () => {
    const componente = cifra('%', new FormControl(1.5));
    componente.oficial = 1.79;
    expect(componente.textoOficialDistinto).toBe('1,79 %');

    componente.oficial = 1.5;
    expect(componente.textoOficialDistinto).toBeNull();

    componente.oficial = null;
    expect(componente.textoOficialDistinto).toBeNull();
  });

  it('muestra el oficial en pesos con el símbolo pegado', () => {
    const componente = cifra('CLP', new FormControl(41000));
    componente.decimales = { min: 2, max: 2 };
    componente.oficial = 41439.89;
    expect(componente.textoOficialDistinto).toBe('$41.439,89');
  });

  it('explica el error solo después de que el campo fue tocado', () => {
    const control = new FormControl<number | null>(120, [Validators.min(0), Validators.max(100)]);
    const componente = cifra('%', control);
    expect(componente.error).toBeNull();

    control.markAsTouched();
    expect(componente.error).toBe('No puede superar 100 %.');

    control.setValue(-1);
    expect(componente.error).toBe('No puede ser negativo.');

    control.setValue(7);
    expect(componente.error).toBeNull();
  });
});
