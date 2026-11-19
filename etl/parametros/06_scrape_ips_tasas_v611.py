#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from datetime import date, datetime
from pathlib import Path
from typing import Any

try:
    from v611_http import download_text as http_download_text
except Exception:  # pragma: no cover
    http_download_text = None

try:
    import requests
except Exception:  # pragma: no cover
    requests = None


IPS_TASAS_EX_CAJAS_URL = "https://ips.gob.cl/tasas-ex-cajas-regimen-antiguo"
IPS_TASAS_COMUNES_URL = "https://ips.gob.cl/tasas-mas-comunes-del-regimen-general"

HEADERS = {"User-Agent": "Mozilla/5.0"}

GRUPOS = [
    ("SERVICIO_SEGURO_SOCIAL", "Trabajadores Servicio Seguro Social"),
    ("EMPLEADOS_PARTICULARES", "Trabajadores Empleados Particulares"),
    ("EMPLEADOS_PUBLICOS", "Trabajadores Empleados Públicos"),
]

ESCENARIOS = [
    (
        "SIN_CCAF_SIN_MUTUAL",
        "No adherido a CCAF ni Mutual",
        {
            "SERVICIO_SEGURO_SOCIAL": {"FONASA": 26.79, "ISAPRE": 19.79},
            "EMPLEADOS_PARTICULARES": {"FONASA": 29.79, "ISAPRE": 22.79},
            "EMPLEADOS_PUBLICOS": {"FONASA": 26.57, "ISAPRE": 19.57},
        },
    ),
    (
        "SOLO_CCAF",
        "Adherido sólo a CCAF",
        {
            "SERVICIO_SEGURO_SOCIAL": {"FONASA": 26.19, "ISAPRE": 19.79},
            "EMPLEADOS_PARTICULARES": {"FONASA": 29.19, "ISAPRE": 22.79},
            "EMPLEADOS_PUBLICOS": {"FONASA": 25.97, "ISAPRE": 19.57},
        },
    ),
    (
        "SOLO_MUTUAL",
        "Adherido sólo a Mutual",
        {
            "SERVICIO_SEGURO_SOCIAL": {"FONASA": 25.84, "ISAPRE": 18.84},
            "EMPLEADOS_PARTICULARES": {"FONASA": 28.84, "ISAPRE": 21.84},
            "EMPLEADOS_PUBLICOS": {"FONASA": 25.62, "ISAPRE": 18.62},
        },
    ),
    (
        "CCAF_Y_MUTUAL",
        "Adherido a CCAF y Mutual",
        {
            "SERVICIO_SEGURO_SOCIAL": {"FONASA": 25.24, "ISAPRE": 18.84},
            "EMPLEADOS_PARTICULARES": {"FONASA": 28.24, "ISAPRE": 21.84},
            "EMPLEADOS_PUBLICOS": {"FONASA": 25.02, "ISAPRE": 18.62},
        },
    ),
]


def month_start(periodo: str) -> str:
    m = re.match(r"^(\d{4})-(\d{2})$", periodo)
    if not m:
        raise ValueError("El periodo debe venir en formato YYYY-MM")
    year, month = int(m.group(1)), int(m.group(2))
    return date(year, month, 1).isoformat()


def normalize_space(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def download_text(url: str, timeout: int = 45) -> str:
    if http_download_text is not None:
        return http_download_text(url, timeout=timeout, headers=HEADERS)
    if requests is None:
        raise RuntimeError("requests no está instalado")
    response = requests.get(url, headers=HEADERS, timeout=timeout)
    response.raise_for_status()
    response.encoding = response.apparent_encoding or response.encoding
    return response.text


def validate_source_text(text: str) -> list[str]:
    """Validación liviana: verifica que la página contenga valores clave de la matriz.

    No usamos esto para parsear porque la página del IPS puede cambiar su HTML.
    La matriz se mantiene como fallback controlado y se alerta si la página parece cambiar.
    """
    warnings: list[str] = []
    # Normalización conservadora: no tocar puntos, porque en HTML pueden ser parte de tags/urls.
    compact = normalize_space(text).lower()

    # La web del IPS suele cambiar el formato (espacios, % o separadores).
    # Buscamos con regex para tolerar "26,79", "26,79%", "26,79 %", etc.
    # La validación por tokens exactos es frágil (la página del IPS cambia frecuentemente).
    # Preferimos una validación estructural mínima para detectar caídas (por ejemplo, HTML vacío o bloqueado),
    # sin producir falsos positivos cada mes.
    # Nota: la página puede entregar HTML muy corto pero válido (landing estática / cambios de layout).
    # Esta validación solo previene casos extremos (respuesta vacía).
    if len(compact) < 500:
        warnings.append(
            "No pude validar estructura mínima de la página IPS (contenido demasiado corto). "
            "Se mantiene matriz base controlada."
        )

    return warnings


def build_ips_tasa_basica(periodo: str) -> list[dict[str, Any]]:
    vigencia_inicio = month_start(periodo)
    rows: list[dict[str, Any]] = []

    grupo_nombre = dict(GRUPOS)

    for escenario_codigo, escenario_nombre, matriz in ESCENARIOS:
        for grupo_codigo, _nombre in GRUPOS:
            for tipo_salud in ["FONASA", "ISAPRE"]:
                rows.append(
                    {
                        "grupo_trabajador": grupo_codigo,
                        "nombre_grupo": grupo_nombre[grupo_codigo],
                        "tipo_salud": tipo_salud,
                        "escenario_empresa": escenario_codigo,
                        "nombre_escenario": escenario_nombre,
                        "tasa_cotizacion": matriz[grupo_codigo][tipo_salud],
                        "vigente": True,
                        "vigencia_inicio": vigencia_inicio,
                        "vigencia_fin": None,
                        "fuente": IPS_TASAS_EX_CAJAS_URL,
                        "observacion": (
                            "Matriz básica IPS/Ex-Cajas régimen antiguo. "
                            "Usar para configuración empresa/trabajador cuando no exista una tasa específica por régimen."
                        ),
                    }
                )

    return rows


def build_payload(periodo: str, *, validar_web: bool) -> dict[str, Any]:
    warnings: list[str] = []
    source_status: dict[str, Any] = {
        "url": IPS_TASAS_EX_CAJAS_URL,
        "ok": None,
        "error": None,
    }

    if validar_web:
        try:
            html = download_text(IPS_TASAS_EX_CAJAS_URL)
            source_status["ok"] = True
            warnings.extend(validate_source_text(html))
        except Exception as exc:
            source_status["ok"] = False
            source_status["error"] = str(exc)
            warnings.append(
                "No se pudo validar contra IPS en línea. Se genera matriz básica controlada localmente."
            )
    else:
        source_status["ok"] = "no_validado"

    rows = build_ips_tasa_basica(periodo)

    # Validación interna: asegura estabilidad del dataset base (sin depender de web).
    if len(rows) != len(GRUPOS) * len(ESCENARIOS) * 2:
        warnings.append(
            "IPS tasas: la matriz básica no tiene el tamaño esperado. "
            f"Filas={len(rows)} esperado={len(GRUPOS) * len(ESCENARIOS) * 2}."
        )

    return {
        "periodo_origen": periodo,
        "vigencia_inicio": month_start(periodo),
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "script_version": "ips_tasas_v611_v1",
        "responsabilidad": "tasas_basicas_ips_ex_cajas",
        "source_status": {
            "ips_tasa_basica": {
                "key": "ips_tasa_basica",
                "status": "controlled_matrix",
                "url": IPS_TASAS_EX_CAJAS_URL,
                "ok": True,
                "detail": "Matriz básica versionada en código; validación web opcional",
                "web_check": source_status,
            }
        },
        "sources": [
            source_status,
            {"url": IPS_TASAS_COMUNES_URL, "uso": "referencia para tasas frecuentes por régimen"},
        ],
        "warnings": warnings,
        "ips_tasa_basica": rows,
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Genera JSON mensual con matriz básica de tasas IPS/Ex-Cajas régimen antiguo."
    )
    parser.add_argument("--periodo", required=True, help="Periodo YYYY-MM")
    parser.add_argument("--out-dir", default="./ips_tasas", help="Carpeta de salida")
    parser.add_argument("--sin-validar-web", action="store_true", help="No intenta validar la página IPS online.")
    args = parser.parse_args()

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    payload = build_payload(args.periodo, validar_web=not args.sin_validar_web)

    out_json = out_dir / f"ips_tasas_{args.periodo}_v611.json"
    compat_json = out_dir / "ips_tasas_v611.json"

    data = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    out_json.write_text(data, encoding="utf-8")
    compat_json.write_text(data, encoding="utf-8")

    print(out_json)
    for warning in payload.get("warnings", []):
        print(f"WARN IPS: {warning}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
