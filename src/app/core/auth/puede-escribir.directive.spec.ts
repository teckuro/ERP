import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { PuedeEscribirDirective } from './puede-escribir.directive';
import { provideErpPermisosStub } from './testing/erp-permisos.stub';

@Component({
  standalone: true,
  imports: [PuedeEscribirDirective],
  template: `
    <p class="siempre">Ver</p>
    <button *erpPuedeEscribir="'nominas'" class="escritura" type="button">Calcular</button>
  `,
})
class HostComponent {}

function render(soloConsulta: boolean): HTMLElement {
  TestBed.configureTestingModule({
    imports: [HostComponent],
    providers: [provideErpPermisosStub({ soloConsulta })],
  });
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('PuedeEscribirDirective', () => {
  it('muestra la acción a quien puede editar el módulo', () => {
    const el = render(false);
    expect(el.querySelector('.escritura')).not.toBeNull();
    expect(el.querySelector('.siempre')).not.toBeNull();
  });

  it('oculta la acción a un perfil de solo consulta', () => {
    const el = render(true);
    expect(el.querySelector('.escritura')).toBeNull();
    expect(el.querySelector('.siempre')).not.toBeNull();
  });
});
