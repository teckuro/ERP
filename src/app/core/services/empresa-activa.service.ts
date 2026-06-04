/**
 * Resuelve la empresa activa del usuario logueado.
 *
 * Creado en `NOM-REBUILD-NOMINA-MENSUAL-01` (F3a, 2026-06-04).
 *
 * Estrategia de resolución:
 * 1. JWT (`app_metadata.id_empresa` o `user_metadata.id_empresa`) — preferido,
 *    consistente con la función `current_user_empresa_id()` de RLS.
 * 2. Fallback: `select * from empresa order by id_empresa limit 1` (RLS server-side
 *    decide qué empresa puede ver el usuario). Coherente con
 *    `proceso-mensual.service.ts:1003` hasta que el JWT incluya `id_empresa`.
 *
 * No persiste cambio de empresa entre sesiones — el JWT manda. Si se necesita
 * cambio multi-empresa por sesión, se introduce `seleccionarEmpresa(idEmpresa)`
 * + persistencia local en fase posterior.
 */

import { computed, inject, Injectable, signal } from '@angular/core';

import { AuthService } from '../auth/auth.service';
import { injectSupabase } from './supabase.service';

interface EmpresaActivaSnapshot {
  idEmpresa: number;
  nombre: string;
  razonSocial: string;
  rut: string;
  dv: string;
}

@Injectable({ providedIn: 'root' })
export class EmpresaActivaService {
  private readonly supabase = injectSupabase();
  private readonly auth = inject(AuthService);

  private readonly state = signal<EmpresaActivaSnapshot | null>(null);
  private readonly loadingState = signal(false);
  private cargaInicialPromise: Promise<EmpresaActivaSnapshot | null> | null = null;

  readonly empresa = computed(() => this.state());
  readonly empresaActivaId = computed(() => this.state()?.idEmpresa ?? null);
  readonly empresaActivaNombre = computed(() =>
    this.state()?.nombre ?? this.state()?.razonSocial ?? null,
  );
  readonly isLoading = computed(() => this.loadingState());

  /**
   * Asegura que la empresa activa esté cargada. Múltiples llamadas concurrentes
   * comparten la misma promesa para evitar consultas duplicadas.
   */
  async asegurarCargada(): Promise<EmpresaActivaSnapshot | null> {
    const snap = this.state();
    if (snap) return snap;

    if (this.cargaInicialPromise) {
      return this.cargaInicialPromise;
    }

    this.cargaInicialPromise = this.cargar();
    try {
      const resuelto = await this.cargaInicialPromise;
      return resuelto;
    } finally {
      this.cargaInicialPromise = null;
    }
  }

  /** Lee `id_empresa` desde el JWT (sin red). Retorna `null` si no está. */
  resolverIdEmpresaDesdeJwt(): number | null {
    const usuario = this.auth.currentUser();
    if (!usuario) return null;

    const appMeta = (usuario.app_metadata ?? {}) as Record<string, unknown>;
    const userMeta = (usuario.user_metadata ?? {}) as Record<string, unknown>;

    const raw =
      appMeta['id_empresa'] ??
      appMeta['idEmpresa'] ??
      userMeta['id_empresa'] ??
      userMeta['idEmpresa'];

    if (raw == null) return null;
    const parsed = typeof raw === 'string' ? Number(raw) : Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  /**
   * Forza recarga desde BD aunque haya snapshot previo.
   * Útil tras un login o cambio de empresa.
   */
  async cargar(): Promise<EmpresaActivaSnapshot | null> {
    this.loadingState.set(true);
    try {
      const idDesdeJwt = this.resolverIdEmpresaDesdeJwt();

      const builder = this.supabase
        .from('empresa')
        .select('id_empresa, razon_social, nombre_fantasia, rut, dv');

      const query = idDesdeJwt != null
        ? builder.eq('id_empresa', idDesdeJwt).maybeSingle()
        : builder.order('id_empresa', { ascending: true }).limit(1).maybeSingle();

      const { data, error } = await query;
      if (error || !data) {
        this.state.set(null);
        return null;
      }

      const nombre = (data.nombre_fantasia ?? data.razon_social ?? '').trim();
      const snapshot: EmpresaActivaSnapshot = {
        idEmpresa: data.id_empresa,
        nombre,
        razonSocial: data.razon_social,
        rut: data.rut,
        dv: data.dv,
      };
      this.state.set(snapshot);
      return snapshot;
    } finally {
      this.loadingState.set(false);
    }
  }

  /** Limpia el snapshot (logout). */
  limpiar(): void {
    this.state.set(null);
    this.cargaInicialPromise = null;
  }
}
