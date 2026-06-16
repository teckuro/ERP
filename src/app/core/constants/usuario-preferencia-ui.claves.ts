/** Claves namespaced de preferencias UI (`usuario_preferencia_ui`). */
export const USUARIO_PREFERENCIA_UI_CLAVES = {
  NOMINA_CALCULO_EXPAND_DESGLOSE: 'nomina.calculo.expand_desglose.v1',
} as const;

export type UsuarioPreferenciaUiClave =
  (typeof USUARIO_PREFERENCIA_UI_CLAVES)[keyof typeof USUARIO_PREFERENCIA_UI_CLAVES];

/** Valor por defecto al marcar un hint/coach mark como cerrado. */
export const PREFERENCIA_UI_VALOR_CERRADO = { cerrado: true } as const;
