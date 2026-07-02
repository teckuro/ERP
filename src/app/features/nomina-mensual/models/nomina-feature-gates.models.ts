/** Feature gates Anexo B — resueltos en servidor por tenant. */
export interface NominaFeatureGates {
  anticipos: boolean;
  extraordinaria: boolean;
}

export const NOMINA_FEATURE_GATES_APAGADOS: NominaFeatureGates = {
  anticipos: false,
  extraordinaria: false,
};
