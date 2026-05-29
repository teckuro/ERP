import { inject, Injectable } from '@angular/core';

import { PeriodoActivoService } from '../../../core/services/periodo-activo.service';
import { ParametrosGeneralesService } from '../../parametros-generales/services/parametros-generales.service';
import {
  evaluarCompletitudParametrosMensual,
  resolverOficialParaComparacionCliente,
} from '../../parametros-generales/rules/parametros-completitud.rules';
import { revisarGruposParametrosMinimos } from '../../nomina-mensual/rules/proceso-mensual-parametros-minimos.rules';
import type { NominaParametrosResumen } from '../models/nomina-parametros-resumen.models';
import { buildNominaParametrosResumen } from '../rules/nomina-parametros-resumen.mapper';

@Injectable({ providedIn: 'root' })
export class NominaParametrosResumenService {
  private readonly parametrosService = inject(ParametrosGeneralesService);
  private readonly periodoActivo = inject(PeriodoActivoService);

  async obtenerResumen(periodo = this.periodoActivo.periodoYm()): Promise<NominaParametrosResumen> {
    try {
      const [filas, catalogos, periodoRemuneracion, clienteConfig, ultimoHastaPeriodo] = await Promise.all([
        this.parametrosService.listar({ periodo }),
        this.parametrosService.listarCatalogos(periodo),
        this.parametrosService.obtenerPeriodoRemuneracion(periodo),
        this.parametrosService.obtenerClienteConfig(periodo),
        this.parametrosService.obtenerUltimoHastaPeriodo(periodo, { enriquecer: true }),
      ]);

      const filaExacta = filas.find((fila) => fila.periodo === periodo) ?? null;
      const oficialComparacion = resolverOficialParaComparacionCliente({
        periodoSeleccionado: periodo,
        filaExacta,
        ultimoHastaPeriodo,
        referenciaVisual: ultimoHastaPeriodo,
      });

      const completitud = evaluarCompletitudParametrosMensual({
        periodo,
        periodoRemuneracion,
        oficial: filaExacta,
        oficialParaComparacion: oficialComparacion.oficial,
        clienteConfig,
        catalogos,
      });

      const gruposMinimos = revisarGruposParametrosMinimos({
        periodo,
        fila: filaExacta,
        lecturaFila: 'ok',
        catalogos,
        lecturaCatalogos: 'ok',
      });

      return buildNominaParametrosResumen({
        periodo,
        gruposMinimos,
        completitud,
        ultimaActualizacion: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[Nómina V2] No fue posible cargar resumen de parámetros', error);
      return buildNominaParametrosResumen({
        periodo,
        gruposMinimos: revisarGruposParametrosMinimos({
          periodo,
          fila: null,
          lecturaFila: 'error',
          catalogos: null,
          lecturaCatalogos: 'error',
          errorCatalogos: 'error_carga_parametros',
        }),
        ultimaActualizacion: null,
      });
    }
  }
}
