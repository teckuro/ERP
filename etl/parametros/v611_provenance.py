"""Origen de datos (scraped/offline/fallback) y validación --strict-sources."""

from __future__ import annotations

from typing import Any, Literal

SourceKind = Literal[
    "scraped",
    "offline",
    "fallback",
    "controlled_matrix",
    "partial",
    "unknown",
]

# En modo estricto estos orígenes no se aceptan para secciones críticas.
STRICT_BLOCKED_KINDS = frozenset({"fallback", "partial", "unknown"})

# Secciones mensuales oficiales: no pueden venir de fallback.
CRITICAL_MENSAL_KEYS = (
    "previred_indicadores",
    "sii_impuesto",
)


def make_source(
    key: str,
    *,
    status: SourceKind,
    url: str | None = None,
    detail: str | None = None,
    ok: bool | None = None,
) -> dict[str, Any]:
    row: dict[str, Any] = {
        "key": key,
        "status": status,
    }
    if url is not None:
        row["url"] = url
    if detail is not None:
        row["detail"] = detail
    if ok is not None:
        row["ok"] = ok
    elif status in {"scraped", "offline", "controlled_matrix"}:
        row["ok"] = True
    elif status in {"fallback", "partial", "unknown"}:
        row["ok"] = False
    return row


def _normativa_flow_kind(flow: dict[str, Any]) -> SourceKind:
    warnings = flow.get("warnings") or []
    status = str(flow.get("status") or "").lower()
    if warnings:
        joined = " | ".join(str(w) for w in warnings).lower()
        if any(
            token in joined
            for token in (
                "se usan valores",
                "se usa calendario",
                "se usa catalogo",
                "se mantiene",
                "no se pudo descargar",
                "no se pudieron descargar",
            )
        ):
            return "fallback"
        return "partial"
    if status in {"ok", "success"}:
        return "scraped"
    # Flujo empresa: placeholders que requieren datos de la compañía (no es fallo de scrape).
    if status in {"requires_company_data", "deferred", "skipped"}:
        return "scraped"
    if status == "partial":
        return "partial"
    return "unknown"


def _ips_kind(ips: dict[str, Any]) -> SourceKind:
    """IPS usa matriz controlada a propósito; no es scrape parseado."""
    return "controlled_matrix"


def collect_source_entries(payload: dict[str, Any]) -> list[dict[str, Any]]:
    """Normaliza provenance desde JSON mensual (o parcial)."""
    entries: list[dict[str, Any]] = []

    metadata = payload.get("metadata")
    if isinstance(metadata, dict):
        explicit = metadata.get("source_status")
        if isinstance(explicit, dict):
            for key, value in explicit.items():
                if isinstance(value, dict):
                    entries.append(
                        make_source(
                            str(key),
                            status=str(value.get("status") or "unknown"),  # type: ignore[arg-type]
                            url=value.get("url"),
                            detail=value.get("detail"),
                            ok=value.get("ok"),
                        )
                    )
                else:
                    entries.append(make_source(str(key), status="unknown", detail=str(value)))
        else:
            # JSON antiguos sin source_status: inferir scraped si hay URLs de origen.
            if metadata.get("previred_indicadores_url"):
                entries.append(
                    make_source(
                        "previred_indicadores",
                        status="scraped",
                        url=str(metadata.get("previred_indicadores_url")),
                        detail="inferido (metadata sin source_status)",
                    )
                )
            if metadata.get("sii_impuesto_url"):
                entries.append(
                    make_source(
                        "sii_impuesto",
                        status="scraped",
                        url=str(metadata.get("sii_impuesto_url")),
                        detail="inferido (metadata sin source_status)",
                    )
                )

    normativa = payload.get("normativa_base")
    if isinstance(normativa, dict):
        offline_flag = bool(normativa.get("offline"))
        if not offline_flag:
            sources = normativa.get("sources")
            if isinstance(sources, list):
                offline_hits = 0
                scraped_hits = 0
                for snap in sources:
                    if not isinstance(snap, dict):
                        continue
                    err = str(snap.get("error") or "")
                    if "offline" in err.lower():
                        offline_hits += 1
                    elif snap.get("ok") is True:
                        scraped_hits += 1
                if offline_hits and not scraped_hits:
                    offline_flag = True

        flows = normativa.get("flows")
        if isinstance(flows, list):
            for flow in flows:
                if not isinstance(flow, dict):
                    continue
                name = str(flow.get("flow") or "normativa")
                # Fallback explícito gana sobre offline (raw vacío / valores conocidos).
                kind = _normativa_flow_kind(flow)
                if kind not in STRICT_BLOCKED_KINDS and offline_flag:
                    kind = "offline"
                detail = None
                warns = flow.get("warnings") or []
                if warns:
                    detail = "; ".join(str(w) for w in warns)
                entries.append(
                    make_source(
                        f"normativa:{name}",
                        status=kind,
                        detail=detail,
                    )
                )

    ips = payload.get("ips_tasas")
    if isinstance(ips, dict):
        entries.append(
            make_source(
                "ips_tasa_basica",
                status=_ips_kind(ips),
                url="https://ips.gob.cl/tasas-ex-cajas-regimen-antiguo",
                detail="Matriz básica versionada en 06_scrape_ips_tasas_v611.py",
            )
        )

    return entries


def summarize_provenance(payload: dict[str, Any]) -> dict[str, Any]:
    entries = collect_source_entries(payload)
    by_status: dict[str, int] = {}
    for entry in entries:
        status = str(entry.get("status") or "unknown")
        by_status[status] = by_status.get(status, 0) + 1
    return {
        "entries": entries,
        "counts_by_status": by_status,
        "has_fallback": any(e.get("status") == "fallback" for e in entries),
        "has_partial": any(e.get("status") == "partial" for e in entries),
    }


def validate_strict_sources(
    payload: dict[str, Any],
    *,
    allow_offline: bool = False,
    allow_controlled_matrix: bool = True,
) -> list[str]:
    """Devuelve errores si el payload no cumple política estricta de origen."""
    errors: list[str] = []
    entries = collect_source_entries(payload)
    by_key = {str(e.get("key")): e for e in entries}

    for critical in CRITICAL_MENSAL_KEYS:
        entry = by_key.get(critical)
        if entry is None:
            # Sin metadata de origen: solo error si el payload pretende ser mensual completo.
            if isinstance(payload.get("parametros_generales_compat"), dict):
                errors.append(
                    f"strict-sources: falta source_status para '{critical}' "
                    "(regenera el JSON con el scraper actualizado)."
                )
            continue
        status = str(entry.get("status") or "unknown")
        if status in STRICT_BLOCKED_KINDS or status == "fallback":
            errors.append(
                f"strict-sources: '{critical}' tiene status={status}. "
                f"Detalle: {entry.get('detail') or entry.get('url') or 'n/a'}"
            )

    for entry in entries:
        key = str(entry.get("key") or "")
        status = str(entry.get("status") or "unknown")

        if key.startswith("normativa:"):
            if status == "scraped":
                continue
            if status == "offline":
                if allow_offline:
                    continue
                errors.append(
                    f"strict-sources: {key} status=offline. "
                    "Usa --allow-offline-sources o regenera normativa online."
                )
                continue
            if status in STRICT_BLOCKED_KINDS or status == "fallback":
                errors.append(
                    f"strict-sources: {key} status={status}. "
                    f"{entry.get('detail') or 'origen no confiable'}"
                )
            continue

        if key == "ips_tasa_basica":
            if status == "controlled_matrix" and allow_controlled_matrix:
                continue
            if status in STRICT_BLOCKED_KINDS:
                errors.append(f"strict-sources: {key} status={status}.")
            continue

    return errors


def enforce_strict_sources(
    payload: dict[str, Any],
    *,
    allow_offline: bool = False,
    allow_controlled_matrix: bool = True,
) -> dict[str, Any]:
    """Adjunta provenance al payload y aborta si hay errores en modo estricto."""
    summary = summarize_provenance(payload)
    metadata = payload.setdefault("metadata", {})
    if not isinstance(metadata, dict):
        metadata = {}
        payload["metadata"] = metadata
    metadata["provenance"] = summary

    errors = validate_strict_sources(
        payload,
        allow_offline=allow_offline,
        allow_controlled_matrix=allow_controlled_matrix,
    )
    if errors:
        raise SystemExit(
            "strict-sources: origen de datos no confiable.\n" + "\n".join(f"- {e}" for e in errors)
        )
    return summary
