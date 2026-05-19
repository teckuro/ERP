import { computed, inject, Injectable } from '@angular/core';

import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NominaMensualCapabilitiesService {
  private readonly auth = inject(AuthService);

  readonly modoPruebas = computed(() => !environment.production);

  readonly esAdmin = computed(() => {
    const user = this.auth.currentUser();
    if (!user) return false;
    const appRole = (user.app_metadata as Record<string, unknown> | undefined)?.['role'];
    const userRole = (user.user_metadata as Record<string, unknown> | undefined)?.['role'];
    return appRole === 'admin' || userRole === 'admin';
  });

  readonly puedeAccionesAdminNomina = computed(
    () => this.esAdmin() && this.modoPruebas(),
  );
}
