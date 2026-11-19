"""Cliente HTTP compartido con retry/backoff para scrapers v6.11."""

from __future__ import annotations

from typing import Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

DEFAULT_TIMEOUT = 45
DEFAULT_HEADERS = {
    "User-Agent": "ERP-Parametros-v611/1.0 (+local-ops; parametros-previsionales)",
    "Accept": "*/*",
}

_SESSION: requests.Session | None = None


def build_retry(
    *,
    total: int = 3,
    backoff_factor: float = 0.8,
    status_forcelist: tuple[int, ...] = (429, 500, 502, 503, 504),
) -> Retry:
    return Retry(
        total=total,
        connect=total,
        read=total,
        status=total,
        backoff_factor=backoff_factor,
        status_forcelist=status_forcelist,
        allowed_methods=frozenset({"GET", "HEAD"}),
        raise_on_status=False,
    )


def get_session(*, force_new: bool = False) -> requests.Session:
    global _SESSION
    if _SESSION is not None and not force_new:
        return _SESSION

    session = requests.Session()
    session.headers.update(DEFAULT_HEADERS)
    adapter = HTTPAdapter(max_retries=build_retry())
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    _SESSION = session
    return session


def download_bytes(
    url: str,
    *,
    timeout: int | float = DEFAULT_TIMEOUT,
    headers: dict[str, str] | None = None,
    expect_pdf: bool = False,
    session: requests.Session | None = None,
) -> bytes:
    sess = session or get_session()
    response = sess.get(url, headers=headers, timeout=timeout)
    response.raise_for_status()
    if expect_pdf:
        content_type = response.headers.get("Content-Type", "")
        content_start = response.content[:8].lstrip()
        if not content_start.startswith(b"%PDF"):
            raise ValueError(
                "La URL no devolvió un PDF válido. "
                f"Content-Type={content_type or 'sin header'}; URL={url}"
            )
    return response.content


def download_text(
    url: str,
    *,
    timeout: int | float = DEFAULT_TIMEOUT,
    headers: dict[str, str] | None = None,
    encoding: str | None = None,
    session: requests.Session | None = None,
) -> str:
    sess = session or get_session()
    response = sess.get(url, headers=headers, timeout=timeout)
    response.raise_for_status()
    if encoding:
        response.encoding = encoding
    else:
        response.encoding = response.apparent_encoding or response.encoding or "utf-8"
    return response.text


def download_response(
    url: str,
    *,
    timeout: int | float = DEFAULT_TIMEOUT,
    headers: dict[str, str] | None = None,
    session: requests.Session | None = None,
) -> requests.Response:
    sess = session or get_session()
    response = sess.get(url, headers=headers, timeout=timeout)
    response.raise_for_status()
    return response


def request_kwargs_compat(**overrides: Any) -> dict[str, Any]:
    """Helpers para scripts que aún pasan headers propios."""
    merged = {"timeout": DEFAULT_TIMEOUT, "headers": dict(DEFAULT_HEADERS)}
    merged.update(overrides)
    return merged
