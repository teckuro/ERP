import { inject, Injectable } from '@angular/core';

import { PeriodoActivoService } from '../../../core/services/periodo-activo.service';
import { ParametrosGeneralesService } from '../../parametros-generales/services/parametros-generales.service';
import {
  evaluarCompletitudParametrosMensual,
  resolverOficialParaComparacionCliente,
} from '../../parametros-generales/rules/parametros-completitud.rules';
import { revisarGruposParametrosMinimos } from '../../nomina-mensual/rules/proceso-mensual-parametros-minimos.rules';
import type { NominaParametrosContext } from '../models/nomina-parametros-context.models';
import type {
  NominaParametrosResumen,
  ParametroResumenBloqueo,
} from '../models/nomina-parametros-resumen.models';
import { buildNominaParametrosResumen } from '../rules/nomina-parametros-resumen.mapper';
import {
  evaluarAdvertenciasRangoParametros,
  resolverPeriodoConsultaParametros,
} from '../rules/nomina-parametros-rango.rules';

@Injectable({ providedIn: 'root' })
export class NominaParametrosResumenService {
  private readonly parametrosService = inject(ParametrosGeneralesService);
  private readonly periodoActivo = inject(PeriodoActivoService);

  async obtenerResumen(periodo = this.periodoActivo.periodoYm()): Promise<NominaParametrosResumen> {
    return this.obtenerResumenInterno(periodo, null);
  }

  async obtenerResumenParaNomina(context: NominaParametrosContext): Promise<NominaParametrosResumen> {
    const periodo = resolverPeriodoConsultaParametros(context);
    const resumen = await this.obtenerResumenInterno(periodo, context);
    return aplicarAdvertenciasRango(resumen, evaluarAdvertenciasRangoParametros(context));
  }

  private async obtenerResumenInterno(
    periodo: string,
    context: NominaParametrosContext | null,
  ): Promise<NominaParametrosResumen> {
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

      const base = buildNominaParametrosResumen({
        periodo,
        gruposMinimos,
        completitud,
        ultimaActualizacion: new Date().toISOString(),
      });

      if (!context) return base;

      return {
        ...base,
        nominaPeriodoId: context.nominaPeriodoId,
        fechaInicioRango: context.fechaInicio,
        fechaFinRango: context.fechaFin,
      };
    } catch (error) {
      console.error('[Nómina V2] No fue posible cargar resumen de parámetros', error);
      const fallback = buildNominaParametrosResumen({
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
      if (!context) return fallback;
      return {
        ...fallback,
        nominaPeriodoId: context.nominaPeriodoId,
        fechaInicioRango: context.fechaInicio,
        fechaFinRango: context.fechaFin,
      };
    }
  }
}

function aplicarAdvertenciasRango(
  resumen: NominaParametrosResumen,
  advertenciasRango: ReturnType<typeof evaluarAdvertenciasRangoParametros>,
): NominaParametrosResumen {
  if (advertenciasRango.length === 0) return resumen;

  const bloqueosRango: ParametroResumenBloqueo[] = [];
  const revisionesRango: ParametroResumenBloqueo[] = [];
  for (const adv of advertenciasRango) {
    const bloqueo: ParametroResumenBloqueo = {
      id: adv.id,
      severidad: adv.severidad === 'bloqueo' ? 'bloqueo' : 'revision',
      titulo: adv.titulo,
      detalle: adv.detalle,
      areaId: 'observacionNormativa',
      mantenedor: { area: 'datosOficiales', tab: 'valores' },
    };
    if (adv.severidad === 'bloqueo') {
      bloqueosRango.push(bloqueo);
    } else {
      revisionesRango.push(bloqueo);
    }
  }

  const bloqueosPreparacionExtra = bloqueosRango.length;
  const revisionExtra = revisionesRango.length;

  return {
    ...resumen,
    bloqueos: resumen.bloqueos + bloqueosRango.length,
    requiereRevision: resumen.requiereRevision + revisionExtra,
    bloqueosPreparacion: resumen.bloqueosPreparacion + bloqueosPreparacionExtra,
    bloqueosActuales: [...resumen.bloqueosActuales, ...bloqueosRango, ...revisionesRango],
    pendientesPreparacion: [...resumen.pendientesPreparacion, ...bloqueosRango],
    advertenciasNoBloqueantes: [...resumen.advertenciasNoBloqueantes, ...revisionesRango],
    puedePreparar: resumen.puedePreparar && bloqueosPreparacionExtra === 0,
    puedeContinuar: resumen.puedeContinuar && bloqueosPreparacionExtra === 0,
  };
}
