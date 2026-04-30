-- Alinear flags calculo_automatico en bases ya pobladas (ejecutar una vez si el
-- INSERT original no incluía la columna o FALSE en todos). Idempotente.

UPDATE concepto SET calculo_automatico = TRUE WHERE codigo IN (
    'SUELDO_BASE', 'GRATIFICACION', 'HORAS_EXTRAS', 'INASISTENCIA',
    'AFP', 'SALUD', 'CESANTIA', 'IMPUESTO_RENTA', 'ZONA_EXTREMA',
    'AFP_EMPLEADOR', 'SIS_EMPLEADOR', 'AFC_EMPLEADOR'
);

UPDATE concepto SET calculo_automatico = FALSE WHERE codigo IN (
    'PRESTAMO', 'BONO_RESPONSABILIDAD', 'MOVILIZACION'
);
