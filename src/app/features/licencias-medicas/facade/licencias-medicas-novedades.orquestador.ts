import { Injectable, inject } from '@angular/core';

import { NovedadesMensualesService } from '../../nomina-mensual/novedades/services/novedades-mensuales.service';
import { LicenciasMedicasRepository } from '../data-access/licencias-medicas.repository';
import type { GuardarLicenciaMedicaInput, LicenciaMedica } from '../models/licencia-medica.model';
import { planificarNovedadesLicencia, licenciaMedicaEstadoEsFinal } from '../rules/licencia-medica-novedades.rules';
import { LicenciasMedicasService } from '../services/licencias-medicas.service';

export interface ConfirmarLicenciaResultado {
  licencia: LicenciaMedica;
  novedadesCreadas: number;
  periodosVinculados: string[];
}

@Injectable({ providedIn: 'root' })
export class LicenciasMedicasNovedadesOrquestador {
  private readonly licenciasService = inject(LicenciasMedicasService);
  private readonly licenciasRepository = inject(LicenciasMedicasRepository);
  private readonly novedadesService = inject(NovedadesMensualesService);

  async guardarBorrador(input: GuardarLicenciaMedicaInput): Promise<LicenciaMedica> {
    return this.licenciasService.guardar({
      ...input,
      estado: input.estado ?? 'pendiente_revision',
    });
  }

  async confirmarYVincularNomina(input: GuardarLicenciaMedicaInput): Promise<ConfirmarLicenciaResultado> {
    if (input.idLicencia) {
      const actual = await this.licenciasService.obtener(input.idLicencia);
      if (actual && licenciaMedicaEstadoEsFinal(actual.estado)) {
        throw new Error('Esta licencia ya está cerrada y no puede vincularse nuevamente.');
      }
    }

    const guardada = await this.licenciasService.guardar({
      ...input,
      estado: 'pendiente_revision',
    });

    const confirmada = await this.licenciasService.confirmar(guardada.idLicencia);

    if (!confirmada.fechaInicio || !confirmada.fechaTermino || !confirmada.folio || !confirmada.idPersona) {
      throw new Error('La licencia confirmada no tiene los datos mínimos para vincular nómina.');
    }

    const plan = planificarNovedadesLicencia({
      fechaInicio: confirmada.fechaInicio,
      fechaTermino: confirmada.fechaTermino,
      tipo: confirmada.tipo,
      folio: confirmada.folio,
    });

    if (!plan.length) {
      throw new Error('El rango de la licencia no genera días en ningún período de nómina.');
    }

    const existentes = await this.licenciasRepository.listarNovedadesPorLicencia(confirmada.idLicencia);
    const periodosExistentes = new Set(existentes.map((item) => item.periodo));
    const periodosCreados: string[] = [];

    for (const tramo of plan) {
      if (periodosExistentes.has(tramo.periodo)) {
        continue;
      }

      const creada = await this.novedadesService.crearNovedad({
        periodo: tramo.periodo,
        idPersona: confirmada.idPersona,
        idContrato: confirmada.idContrato ?? null,
        idConcepto: null,
        categoria: 'licencia_permiso',
        tipoMovimiento: 'informativo',
        cantidad: tramo.cantidad,
        unidad: 'dias',
        monto: null,
        origen: 'integracion_externa',
        fechaEvento: tramo.fechaEvento,
        observacion: confirmada.observacion,
        referenciaExterna: confirmada.folio,
        codigoMotivoAusencia: tramo.codigoMotivoAusencia,
        idLicencia: confirmada.idLicencia,
      });
      await this.novedadesService.enviarARevision(creada.idNovedad);
      periodosCreados.push(tramo.periodo);
    }

    const vinculada = await this.licenciasService.marcarVinculadaNomina(confirmada.idLicencia);

    return {
      licencia: vinculada,
      novedadesCreadas: periodosCreados.length,
      periodosVinculados: periodosCreados,
    };
  }
}
