/**
 * Resuelve la empresa activa del usuario logueado.
 *
 * Creado en `NOM-REBUILD-NOMINA-MENSUAL-01` (F3a, 2026-06-04).
 *
 * Estrategia de resolución (BKL-07):
 * 1. JWT (`app_metadata.id_empresa`, SEC-07) — obligatorio
 *    para cargar empresa; consistente con `current_user_empresa_id()` en RLS.
 * 2. Sin `id_empresa` en el JWT: no se consulta BD ni se elige la primera
 *    empresa del tenant (evita filtraciones cross-empresa en sesiones mal configuradas).
 *
 * No persiste cambio de empresa entre sesiones — el JWT manda. Si se necesita
 * cambio multi-empresa por sesión, se introduce `seleccionarEmpresa(idEmpresa)`
 * + persistencia local en fase posterior.
 */

import { computed, inject, Injectable, signal } from '@angular/core';

import { limpiarAlCambiarUsuario } from '../auth/limpiar-al-cambiar-usuario';

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
  private readonly motivoSinEmpresaState = signal<string | null>(null);
  private readonly loadingState = signal(false);
  private cargaInicialPromise: Promise<EmpresaActivaSnapshot | null> | null = null;

  readonly empresa = computed(() => this.state());
  readonly motivoSinEmpresa = computed(() => this.motivoSinEmpresaState());
  readonly empresaActivaId = computed(() => this.state()?.idEmpresa ?? null);
  readonly empresaActivaNombre = computed(() =>
    this.state()?.nombre ?? this.state()?.razonSocial ?? null,
  );
  readonly isLoading = computed(() => this.loadingState());

  private readonly generacionSesion = limpiarAlCambiarUsuario(() => this.limpiar());

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

  /**
   * Lee `app_metadata.id_empresa` del JWT (sin red). Retorna `null` si no está.
   * SEC-07: igual que `current_user_empresa_id()` en la base; `user_metadata` lo
   * edita el propio usuario y nunca define la empresa.
   */
  resolverIdEmpresaDesdeJwt(): number | null {
    const usuario = this.auth.currentUser();
    if (!usuario) return null;

    const appMeta = (usuario.app_metadata ?? {}) as Record<string, unknown>;
    const raw = appMeta['id_empresa'];

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
    this.motivoSinEmpresaState.set(null);
    try {
      const idDesdeJwt = this.resolverIdEmpresaDesdeJwt();
      if (idDesdeJwt == null) {
        this.motivoSinEmpresaState.set(
          'No hay empresa asignada en tu sesión. Contacta al administrador para configurar el acceso.',
        );
        this.state.set(null);
        return null;
      }

      const generacion = this.generacionSesion();
      const { data, error } = await this.supabase
        .from('empresa')
        .select('id_empresa, razon_social, nombre_fantasia, rut, dv')
        .eq('id_empresa', idDesdeJwt)
        .maybeSingle();

      // La sesión cambió mientras se cargaba: no publicar la empresa anterior.
      if (generacion !== this.generacionSesion()) {
        return null;
      }

      if (error || !data) {
        this.motivoSinEmpresaState.set(
          'No fue posible cargar la empresa asignada a tu sesión.',
        );
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
    this.motivoSinEmpresaState.set(null);
    this.cargaInicialPromise = null;
  }
}
