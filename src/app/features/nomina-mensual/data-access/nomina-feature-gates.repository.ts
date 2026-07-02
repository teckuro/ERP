import { Injectable } from '@angular/core';

import { injectSupabase } from '../../../core/services/supabase.service';
import type { NominaFeatureGates } from '../models/nomina-feature-gates.models';
import { NOMINA_FEATURE_GATES_APAGADOS } from '../models/nomina-feature-gates.models';

function throwIfError(error: { message: string } | null, contexto: string): void {
  if (error) {
    throw new Error(`${contexto}: ${error.message}`);
  }
}

@Injectable({ providedIn: 'root' })
export class NominaFeatureGatesRepository {
  private readonly supabase = injectSupabase();

  async obtener(): Promise<NominaFeatureGates> {
    const { data, error } = await this.supabase.rpc('obtener_feature_gates_nomina');
    if (error) {
      throwIfError(error, 'obtenerFeatureGatesNomina');
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
  };
}
