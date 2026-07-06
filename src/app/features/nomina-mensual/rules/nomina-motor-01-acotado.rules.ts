/**
 * MOTOR-01 acotado: límites de piloto antes de escala masiva.
 */
export const MOTOR_PILOTO_MAX_TRABAJADORES_DEFAULT = 500;

export function validarAlcanceMotorPiloto(
  trabajadorIds: readonly number[],
  maxTrabajadores: number = MOTOR_PILOTO_MAX_TRABAJADORES_DEFAULT,
): { ok: true } | { ok: false; mensaje: string } {
  const total = trabajadorIds.length;
  if (total <= maxTrabajadores) return { ok: true };
  return {
    ok: false,
    mensaje: `El cálculo piloto admite hasta ${maxTrabajadores} trabajadores por corrida (solicitados: ${total}).`,
  };
}
