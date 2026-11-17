"""Columnas de parametros_generales alineadas con angular-erp bd/base/v11/partes/02_tablas.sql."""

from __future__ import annotations

# Orden estable: usado en INSERT/SELECT del SQL mensual y tablas temp de comparación.
PARAMETROS_GENERALES_V11_COLUMN_TYPES: list[tuple[str, str]] = [
    ("periodo", "TEXT"),
    ("uf", "NUMERIC"),
    ("utm", "NUMERIC"),
    ("uta", "NUMERIC"),
    ("sueldo_minimo", "NUMERIC"),
    ("sueldo_minimo18_65", "NUMERIC"),
    ("sueldo_minimo_menor18_mayor65", "NUMERIC"),
    ("sueldo_minimo_casa_particular", "NUMERIC"),
    ("ingreso_minimo_no_remuneracional", "NUMERIC"),
    ("gratificacion", "BOOLEAN"),
    ("imm_gratificacion", "NUMERIC"),
    ("tope_afp_uf", "NUMERIC"),
    ("tope_afp", "NUMERIC"),
    ("tope_ips_uf", "NUMERIC"),
    ("tope_ips", "NUMERIC"),
    ("tope_cesantia_uf", "NUMERIC"),
    ("tope_cesantia", "NUMERIC"),
    ("tope_apv_mensual_uf", "NUMERIC"),
    ("tope_apv_mensual", "NUMERIC"),
    ("tope_apv_anual_uf", "NUMERIC"),
    ("tope_apv_anual", "NUMERIC"),
    ("tope_deposito_convenido_anual_uf", "NUMERIC"),
    ("tope_deposito_convenido_anual", "NUMERIC"),
    ("tope_afpvoluntario", "NUMERIC"),
    ("sis", "NUMERIC"),
    ("sanna", "NUMERIC"),
    ("salud_obligatoria", "NUMERIC"),
    ("salud_ccaf", "NUMERIC"),
    ("salud_fonasa_con_ccaf", "NUMERIC"),
    ("dsctosbpordia", "BOOLEAN"),
    ("afc_trabajador_indefinido", "NUMERIC"),
    ("afc_empleador_indefinido", "NUMERIC"),
    ("afc_empleador_plazo", "NUMERIC"),
]

PARAMETROS_GENERALES_V11_COLUMNS: list[str] = [c for c, _ in PARAMETROS_GENERALES_V11_COLUMN_TYPES]
PARAMETROS_GENERALES_V11_TEMP_TYPES: str = ", ".join(f"{c} {t}" for c, t in PARAMETROS_GENERALES_V11_COLUMN_TYPES)

SANNA_TASA_NORMATIVA_DEFAULT = 0.03


def _coerce_numeric(value: object | None) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip().replace(",", ".")
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def resolve_sanna_tasa(
    *,
    compat_sanna: object | None = None,
    parametros_legales: list[dict[str, object]] | None = None,
    ley_sanna: dict[str, object] | None = None,
) -> float:
    """Tasa SANNA (empleador) para parametros_generales: Previred, legales o normativa."""
    direct = _coerce_numeric(compat_sanna)
    if direct is not None:
        return direct

    for row in parametros_legales or []:
        nombre = str(row.get("nombre") or row.get("codigo") or "").strip().upper()
        if nombre != "SANNA":
            continue
        legal = _coerce_numeric(row.get("valor_decimal")) or _coerce_numeric(row.get("tasa_empleador"))
        if legal is not None:
            return legal

    if isinstance(ley_sanna, dict):
        from_ley = _coerce_numeric(ley_sanna.get("valor_decimal")) or _coerce_numeric(
            ley_sanna.get("tasa_empleador")
        )
        if from_ley is not None:
            return from_ley

    return SANNA_TASA_NORMATIVA_DEFAULT


def apply_sanna_to_parametros_generales_compat(
    compat: dict[str, object],
    *,
    parametros_legales: list[dict[str, object]] | None = None,
    ley_sanna: dict[str, object] | None = None,
) -> dict[str, object]:
    """Rellena compat.sanna cuando Previred no trae SANNA (vive en parametros_legales / ley 21.010)."""
    if compat.get("sanna") is None:
        compat["sanna"] = resolve_sanna_tasa(
            compat_sanna=None,
            parametros_legales=parametros_legales,
            ley_sanna=ley_sanna,
        )
    return compat


# Columnas obligatorias del snapshot mensual (alineado a parametros-completitud.rules.ts).
# Sin sueldo_minimo_menor18_mayor65: Previred mensual no lo trae; completitud UI lo evalúa aparte.
PARAMETROS_GENERALES_STRICT_REQUIRED_COLUMNS: tuple[str, ...] = (
    "uf",
    "utm",
    "uta",
    "sueldo_minimo18_65",
    "sueldo_minimo_casa_particular",
    "ingreso_minimo_no_remuneracional",
    "tope_afp_uf",
    "tope_afp",
    "tope_ips_uf",
    "tope_ips",
    "tope_cesantia_uf",
    "tope_cesantia",
    "tope_apv_mensual_uf",
    "tope_apv_mensual",
    "tope_apv_anual_uf",
    "tope_apv_anual",
    "sis",
    "sanna",
    "salud_obligatoria",
    "afc_trabajador_indefinido",
    "afc_empleador_indefinido",
    "afc_empleador_plazo",
)


def finalize_parametros_generales_compat(
    compat: dict[str, object],
    *,
    parametros_legales: list[dict[str, object]] | None = None,
    ley_sanna: dict[str, object] | None = None,
) -> dict[str, object]:
    """Aplica backfills de carga mensual y deja el snapshot listo para INSERT."""
    return apply_sanna_to_parametros_generales_compat(
        compat,
        parametros_legales=parametros_legales,
        ley_sanna=ley_sanna,
    )


def validate_parametros_generales_compat_scalars(
    compat: dict[str, object] | None,
    *,
    required: tuple[str, ...] = PARAMETROS_GENERALES_STRICT_REQUIRED_COLUMNS,
) -> list[str]:
    """Devuelve errores si faltan escalares obligatorios en parametros_generales_compat."""
    if not isinstance(compat, dict):
        return ["Falta parametros_generales_compat."]
    errors: list[str] = []
    for column in required:
        if compat.get(column) is None:
            errors.append(f"parametros_generales_compat.{column} está vacío (snapshot oficial incompleto).")
    return errors
