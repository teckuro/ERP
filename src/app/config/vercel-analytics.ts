import { isDevMode } from '@angular/core';
import { inject as injectVercelAnalytics, type BeforeSendEvent } from '@vercel/analytics';

/**
 * Vercel Web Analytics (panel Analytics → Visitors / Page views).
 * El script se sirve desde el mismo dominio (/_vercel/insights/*), así que la CSP actual
 * (`script-src 'self'`, `connect-src 'self'`) no necesita cambios.
 * No se activa en desarrollo ni en localhost: ahí la ruta /_vercel/insights no existe.
 */
export function initVercelAnalytics(): void {
  if (isDevMode() || location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    return;
  }
  injectVercelAnalytics({
    mode: 'production',
    framework: 'angular',
    beforeSend: (event) => (visitaPropia() ? null : sanitizarEvento(event)),
  });
}

/**
 * Excluye las visitas del dueño: Vercel Analytics no filtra por IP, así que se marca el navegador.
 * Activar una vez por navegador/dispositivo en la consola: localStorage.setItem('va-disable', '1')
 */
function visitaPropia(): boolean {
  try {
    return localStorage.getItem('va-disable') !== null;
  } catch {
    return false;
  }
}

/**
 * Decide qué URL llega a Vercel. Devolver `null` descarta el evento.
 * Ejemplos de URLs reales del ERP:
 *   /empleados/8f3c…-uuid          → ficha de un trabajador
 *   /liquidaciones/123              → liquidación concreta
 *   /nominas/45/generador?tab=x     → nómina de un período
 */
export function sanitizarEvento(event: BeforeSendEvent): BeforeSendEvent | null {
  let url: URL;
  try {
    url = new URL(event.url);
  } catch {
    return null;
  }
  // Se descartan query y hash: filtros/búsquedas (posibles RUT) y tokens de Supabase
  // (`#access_token=…` en actualizar-contrasena) nunca salen del navegador.
  const ruta = url.pathname
    .split('/')
    .map((segmento) => (SEGMENTO_SENSIBLE.test(segmento) ? '[id]' : segmento))
    .join('/');
  return { ...event, url: `${url.origin}${ruta}` };
}

/** Id numérico, UUID o RUT chileno (con o sin puntos, DV 0-9/K). */
const SEGMENTO_SENSIBLE =
  /^(\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d{1,2}\.?\d{3}\.?\d{3}-[\dkK])$/i;
