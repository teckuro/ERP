import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { importProvidersFrom, signal } from '@angular/core';
import { LucideAngularModule, CircleCheck, OctagonX, X } from 'lucide-angular';
import { beforeEach, describe, expect, it, afterEach } from 'vitest';

import { NominaMensualV2OrquestadorPort } from '../../facade/nomina-mensual-v2-orquestador.port';
import { NominaMensualV2TrazabilidadDrawerComponent } from './nomina-mensual-v2-trazabilidad-drawer.component';

describe('NominaMensualV2TrazabilidadDrawerComponent (NOIA-NMV2-REPAIR-12)', () => {
  let drawerAbierto: ReturnType<typeof signal<boolean>>;
  let pasoModal: ReturnType<typeof signal<string | null>>;
  let tipoModal: ReturnType<typeof signal<string | null>>;

  beforeEach(() => {
    drawerAbierto = signal(true);
    pasoModal = signal<string | null>(null);
    tipoModal = signal<string | null>(null);

    TestBed.configureTestingModule({
      imports: [NominaMensualV2TrazabilidadDrawerComponent],
      providers: [
        importProvidersFrom(LucideAngularModule.pick({ CircleCheck, OctagonX, X })),
        {
          provide: NominaMensualV2OrquestadorPort,
          useValue: {
            trazabilidadDrawerAbierto: drawerAbierto,
            eventosTrazabilidad: signal([
              {
                idEvento: 'e1',
                paso: 'dotacion',
                descripcion: 'Dotación confirmada',
                usuarioNombre: 'Ana',
                fechaEvento: '2026-06-30T10:00:00Z',
                periodo: '2026-06',
                tipoEvento: 'EMPLEADOS_VALIDADOS',
                integridad: { estadoIntegridad: 'registrado' },
              },
            ]),
            cerrarTrazabilidadCompleta: () => drawerAbierto.set(false),
            abrirTrazabilidadPaso: (paso: string, tipo: string) => {
              drawerAbierto.set(false);
              pasoModal.set(paso);
              tipoModal.set(tipo);
            },
          },
        },
      ],
    });
  });

  afterEach(() => {
    document.body.classList.remove('nmv2-trazabilidad-scroll-lock');
  });

  it('bloquea scroll del body mientras el drawer está abierto', () => {
    const fixture = TestBed.createComponent(NominaMensualV2TrazabilidadDrawerComponent);
    fixture.detectChanges();
    expect(document.body.classList.contains('nmv2-trazabilidad-scroll-lock')).toBe(true);

    drawerAbierto.set(false);
    fixture.detectChanges();
    expect(document.body.classList.contains('nmv2-trazabilidad-scroll-lock')).toBe(false);
  });

  it('abre modal de bitácora al pulsar acción Bitácora', () => {
    const fixture = TestBed.createComponent(NominaMensualV2TrazabilidadDrawerComponent);
    fixture.detectChanges();

    const botones = fixture.debugElement.queryAll(By.css('.nmv2-trazabilidad-timeline__btn'));
    expect(botones.length).toBe(3);
    (botones[0].nativeElement as HTMLButtonElement).click();

    expect(pasoModal()).toBe('dotacion');
    expect(tipoModal()).toBe('history');
    expect(drawerAbierto()).toBe(false);
  });
});
