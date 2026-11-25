import { Injectable } from '@angular/core';

import { lanzarSiErrorSupabase } from '../../../core/errors/erp-supabase-user-message';
import { injectSupabase } from '../../../core/services/supabase.service';
import type { NominaFeatureGates } from '../models/nomina-feature-gates.models';
import { NOMINA_FEATURE_GATES_APAGADOS } from '../models/nomina-feature-gates.models';

@Injectable({ providedIn: 'root' })
export class NominaFeatureGatesRepository {
  private readonly supabase = injectSupabase();

  async obtener(): Promise<NominaFeatureGates> {
    const { data, error } = await this.supabase.rpc('obtener_feature_gates_nomina');
    if (error) {
      lanzarSiErrorSupabase(error, 'obtenerFeatureGatesNomina');
    }
    return mapFeatureGates(data);
  }
}

function mapFeatureGates(raw: unknown): NominaFeatureGates {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return NOMINA_FEATURE_GATES_APAGADOS;
  }
  const record = raw as Record<string, unknown>;
  return {
    anticipos: record['anticipos'] === true,
    extraordinaria: record['extraordinaria'] === true,
    rectificacion: record['rectificacion'] === true,
  };
}
