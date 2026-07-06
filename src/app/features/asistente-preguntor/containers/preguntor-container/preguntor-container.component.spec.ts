import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AsistentePreguntorService } from '../../../../core/services/asistente-preguntor.service';
import { ShellPageContextService } from '../../../../layout/shell-page-context.service';
import { PreguntorContainerComponent } from './preguntor-container.component';

describe('PreguntorContainerComponent', () => {
  let fixture: ComponentFixture<PreguntorContainerComponent>;
  let asistente: { consultar: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    asistente = { consultar: vi.fn().mockResolvedValue('Guía breve') };

    await TestBed.configureTestingModule({
      imports: [PreguntorContainerComponent],
      providers: [
        ShellPageContextService,
        { provide: AsistentePreguntorService, useValue: asistente },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PreguntorContainerComponent);
    fixture.detectChanges();
  });

  it('muestra la respuesta tras enviar', async () => {
    fixture.componentInstance.preguntaTexto = '¿Qué revisar?';
    await fixture.componentInstance.enviar();
    fixture.detectChanges();

    expect(asistente.consultar).toHaveBeenCalledWith('¿Qué revisar?');
    expect(fixture.componentInstance.respuesta()).toBe('Guía breve');
    expect(fixture.nativeElement.textContent).toContain('Guía breve');
  });
});
