import { inject, Injectable } from '@angular/core';

import { ParametrosGeneralesRepository } from '../data-access/parametros-generales.repository';
import {
  ParametroGeneral,
  ParametroGeneralUpsert,
  ParametrosGeneralesClienteConfig,
  ParametrosGeneralesClienteConfigUpsert,
  PeriodoRemuneracionEstadoInfo,
  ParametrosGeneralesCatalogos,
  ParametrosGeneralesFiltro,
} from '../models/parametro-general.model';

@Injectable({ providedIn: 'root' })
export class ParametrosGeneralesService {
  private readonly repository = inject(ParametrosGeneralesRepository);

  listar(filtro?: ParametrosGeneralesFiltro): Promise<ParametroGeneral[]> {
    return this.repository.listar(filtro);
  }

  listarPeriodos(): Promise<string[]> {
    return this.repository.listarPeriodos();
  }

  listarPeriodosConDatosMensuales(): Promise<string[]> {
    return this.repository.listarPeriodosConDatosMensuales();
  }

  obtenerPeriodoRemuneracion(periodo: string): Promise<PeriodoRemuneracionEstadoInfo | null> {
    return this.repository.obtenerPeriodoRemuneracion(periodo);
  }

  obtenerUltimoHastaPeriodo(periodo: string): Promise<ParametroGeneral | null> {
    return this.repository.obtenerUltimoHastaPeriodo(periodo);
  }

  guardar(payload: ParametroGeneralUpsert): Promise<ParametroGeneral> {
    return this.repository.guardar(payload);
  }

  obtenerClienteConfig(periodo: string): Promise<ParametrosGeneralesClienteConfig | null> {
    return this.repository.obtenerClienteConfig(periodo);
  }

  obtenerUltimaClienteConfigHastaPeriodo(periodo: string): Promise<ParametrosGeneralesClienteConfig | null> {
    return this.repository.obtenerUltimaClienteConfigHastaPeriodo(periodo);
  }

  guardarClienteConfig(
    payload: ParametrosGeneralesClienteConfigUpsert,
  ): Promise<ParametrosGeneralesClienteConfig> {
    return this.repository.guardarClienteConfig(payload);
  }

  listarCatalogos(periodo: string): Promise<ParametrosGeneralesCatalogos> {
    return this.repository.listarCatalogos(periodo);
  }
}
