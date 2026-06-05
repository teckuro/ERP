import { Injectable, computed, signal } from '@angular/core';

import { resolveShellRouteBreadcrumbs } from './shell-route-context.config';

export type ShellStatusChipTone = 'neutral' | 'warning' | 'success' | 'danger';

export type ShellBreadcrumbItem = {
  label: string;
  path?: string;
};

export type ShellPageContext = {
  breadcrumbs: ShellBreadcrumbItem[];
  pageTitle?: string;
  pageSubtitle?: string;
  statusChip?: { label: string; tone: ShellStatusChipTone };
  primaryAction?: {
    label: string;
    disabled?: boolean;
    loading?: boolean;
    actionId: string;
  };
};

export type ShellPrimaryActionHandler = () => void;

/**
 * Token de propiedad del shell. Lo entrega `claimOwnership()` y debe
 * acompañar todas las operaciones de escritura/limpieza para que el servicio
 * pueda ignorar mutaciones de dueños obsoletos (race condition entre destroy
 * del container anterior e init del nuevo en `<router-outlet>`).
 */
export type ShellPageContextOwnerToken = number;

const EMPTY_CONTEXT: ShellPageContext = { breadcrumbs: [] };
const NO_TOKEN: ShellPageContextOwnerToken = 0;

/**
 * Token reservado para llamadas de la API legacy directa (`setContext`,
 * `clearContext`, etc.) y para tests/componentes ad hoc. Se renueva en cada
 * llamada legacy para que la transición de navegación lo identifique como
 * stale igual que cualquier otro dueño.
 */
const LEGACY_OWNER_NAME = -1;

@Injectable({ providedIn: 'root' })
export class ShellPageContextService {
  private readonly contextState = signal<ShellPageContext>(EMPTY_CONTEXT);
  private primaryHandler: ShellPrimaryActionHandler | null = null;
  private bindingActive = false;

  // Tokens monótonos: cada container reclama un token único; sólo el dueño
  // actual puede escribir o liberar el contexto.
  private nextOwnerToken: ShellPageContextOwnerToken = NO_TOKEN;
  private currentOwnerToken: ShellPageContextOwnerToken = NO_TOKEN;

  // Snapshot del dueño al iniciar una navegación; si al terminar nadie nuevo
  // reclamó (`currentOwnerToken === tokenAtNavigationStart`), el dueño actual
  // se considera stale (su container ya no está bajo el outlet) y se libera.
  private tokenAtNavigationStart: ShellPageContextOwnerToken = NO_TOKEN;

  readonly context = this.contextState.asReadonly();

  readonly breadcrumbs = computed(() => this.contextState().breadcrumbs);
  readonly pageTitle = computed(() => this.contextState().pageTitle);
  readonly pageSubtitle = computed(() => this.contextState().pageSubtitle);
  readonly statusChip = computed(() => this.contextState().statusChip);
  readonly primaryAction = computed(() => this.contextState().primaryAction);

  // ---------------------------------------------------------------------------
  // API basada en tokens (usada por `bindShellPageContext`)
  // ---------------------------------------------------------------------------

  /**
   * Reclama la propiedad del shell. El token devuelto identifica al dueño
   * para todas las operaciones posteriores. Cualquier token entregado antes
   * queda invalidado: sus `setContextWithToken` / `releaseOwnership` serán
   * no-op silenciosos.
   */
  claimOwnership(): ShellPageContextOwnerToken {
    this.nextOwnerToken += 1;
    this.currentOwnerToken = this.nextOwnerToken;
    this.bindingActive = true;
    // El handler del dueño anterior queda invalidado: el nuevo dueño debe
    // registrar el suyo vía `registerPrimaryActionHandlerWithToken`.
    this.primaryHandler = null;
    return this.currentOwnerToken;
  }

  /** Publica el contexto si `token` es el dueño actual; si no, no-op. */
  setContextWithToken(token: ShellPageContextOwnerToken, ctx: ShellPageContext): void {
    if (token !== this.currentOwnerToken) return;
    this.contextState.set(ctx);
  }

  /** Mezcla un parche en el contexto si `token` es el dueño actual. */
  patchContextWithToken(token: ShellPageContextOwnerToken, partial: Partial<ShellPageContext>): void {
    if (token !== this.currentOwnerToken) return;
    this.contextState.update((current) => ({ ...current, ...partial }));
  }

  /** Registra el handler primario si `token` es el dueño actual. */
  registerPrimaryActionHandlerWithToken(
    token: ShellPageContextOwnerToken,
    handler: ShellPrimaryActionHandler | null,
  ): void {
    if (token !== this.currentOwnerToken) return;
    this.primaryHandler = handler;
  }

  /**
   * Libera la propiedad si `token` es el dueño actual. Si no lo es (alguien
   * ya tomó el shell), devuelve `false` sin tocar nada. Esto resuelve la
   * race: el container A que se destruye después de que B reclamó no puede
   * borrar el contexto de B.
   */
  releaseOwnership(token: ShellPageContextOwnerToken): boolean {
    if (token !== this.currentOwnerToken) return false;
    this.currentOwnerToken = NO_TOKEN;
    this.bindingActive = false;
    this.primaryHandler = null;
    this.contextState.set(EMPTY_CONTEXT);
    return true;
  }

  // ---------------------------------------------------------------------------
  // Coordinación con el router (invocado por LayoutShellComponent)
  // ---------------------------------------------------------------------------

  /**
   * Marca el dueño al inicio de una navegación. Si nadie nuevo reclama
   * durante la navegación, `resolveNavigationTransition` lo liberará como
   * stale.
   */
  beginNavigationTransition(): void {
    this.tokenAtNavigationStart = this.currentOwnerToken;
  }

  /**
   * Cierre de transición de navegación:
   * - Si el dueño actual sigue siendo el mismo que al iniciar la navegación
   *   y no es `NO_TOKEN`, se considera que el container del lado anterior
   *   se quedó sin destruir todavía o nunca reclamó nuevo dueño (página sin
   *   helper). Lo liberamos para que el header no muestre el shell viejo.
   * - Aplicamos `applyRouteFallback(url)` (breadcrumbs de ruta) si nadie es
   *   dueño activo en este momento.
   */
  resolveNavigationTransition(routeFallbackUrl: string): void {
    const hadStaleOwner =
      this.currentOwnerToken !== NO_TOKEN &&
      this.currentOwnerToken === this.tokenAtNavigationStart;
    if (hadStaleOwner) {
      this.currentOwnerToken = NO_TOKEN;
      this.bindingActive = false;
      this.primaryHandler = null;
      this.contextState.set(EMPTY_CONTEXT);
    }
    this.tokenAtNavigationStart = NO_TOKEN;
    this.applyRouteFallback(routeFallbackUrl);
  }

  // ---------------------------------------------------------------------------
  // API legacy (DEPRECATED). Mantenida para compatibilidad con código y tests
  // existentes; cada llamada genera/usa un token "legacy" propio.
  // ---------------------------------------------------------------------------

  /**
   * @deprecated Usar `bindShellPageContext` (acepta un signal/función que
   * devuelve el contexto). La API directa carece de coordinación entre
   * containers y produce races visibles en la cabecera.
   */
  setContext(context: ShellPageContext): void {
    this.ensureLegacyOwner();
    this.contextState.set(context);
  }

  /**
   * @deprecated Usar `bindShellPageContext`.
   */
  patchContext(partial: Partial<ShellPageContext>): void {
    this.ensureLegacyOwner();
    this.contextState.update((current) => ({ ...current, ...partial }));
  }

  /**
   * @deprecated Usar `bindShellPageContext` (la liberación se hace
   * automáticamente al destruirse el host).
   */
  clearContext(): void {
    this.contextState.set(EMPTY_CONTEXT);
    this.primaryHandler = null;
    this.currentOwnerToken = NO_TOKEN;
    this.bindingActive = false;
  }

  /**
   * @deprecated Usar `bindShellPageContext`.
   */
  setBindingActive(active: boolean): void {
    this.bindingActive = active;
    if (active) {
      this.ensureLegacyOwner();
    } else if (this.currentOwnerToken !== NO_TOKEN) {
      this.currentOwnerToken = NO_TOKEN;
    }
  }

  isBindingActive(): boolean {
    return this.bindingActive;
  }

  applyRouteFallback(url: string): void {
    if (this.bindingActive) {
      return;
    }
    const breadcrumbs = resolveShellRouteBreadcrumbs(url);
    if (breadcrumbs.length) {
      this.contextState.set({ breadcrumbs });
    } else {
      this.contextState.set(EMPTY_CONTEXT);
      this.primaryHandler = null;
    }
  }

  /**
   * @deprecated Usar la opción `onPrimaryAction` del helper
   * `bindShellPageContext`, que asocia el handler al token del container.
   */
  registerPrimaryActionHandler(handler: ShellPrimaryActionHandler | null): void {
    this.ensureLegacyOwner();
    this.primaryHandler = handler;
  }

  invokePrimaryAction(): void {
    this.primaryHandler?.();
  }

  private ensureLegacyOwner(): void {
    // Si nadie reclamó vía la API nueva, generamos un token legacy para que
    // las operaciones tengan dueño identificable durante la transición de
    // navegación. Se renueva siempre para que `tokenAtNavigationStart` lo
    // detecte como stale si no se actualiza.
    this.nextOwnerToken += 1;
    this.currentOwnerToken = this.nextOwnerToken;
    this.bindingActive = true;
    // Anotamos el "nombre" en una variable de instancia opcional para debug;
    // no afecta la lógica. (Mantenemos el simbólico LEGACY_OWNER_NAME para
    // referencia interna).
    void LEGACY_OWNER_NAME;
  }
}
