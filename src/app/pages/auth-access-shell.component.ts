import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-auth-access-shell',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './auth-access.shared.css',
  template: `
    <main class="login-page">
      <section class="login-brand" aria-label="Sistema ERP">
        <div class="login-brand__grid" aria-hidden="true"></div>
        <div class="login-brand__glow login-brand__glow--top" aria-hidden="true"></div>
        <div class="login-brand__glow login-brand__glow--bottom" aria-hidden="true"></div>

        <div class="login-brand__content">
          <div class="login-brand__logo">
            <div class="login-brand__mark" aria-hidden="true">
              <lucide-icon name="building-2"></lucide-icon>
            </div>
            <div>
              <p class="login-brand__name">ERP System</p>
              <p class="login-brand__caption">Enterprise Portal</p>
            </div>
          </div>

          <div class="login-brand__message">
            <p>{{ brandEyebrow() }}</p>
            <h1>{{ brandTitle() }}</h1>
            <span>{{ brandLead() }}</span>
          </div>

          <div class="login-brand__features" aria-label="Caracteristicas de seguridad">
            <div class="login-feature">
              <span class="login-feature__icon" aria-hidden="true">
                <lucide-icon [name]="featurePrimaryIcon()"></lucide-icon>
              </span>
              <span>
                <strong>{{ featurePrimaryTitle() }}</strong>
                <small>{{ featurePrimaryLead() }}</small>
              </span>
            </div>
            <div class="login-feature">
              <span class="login-feature__icon" aria-hidden="true">
                <lucide-icon [name]="featureSecondaryIcon()"></lucide-icon>
              </span>
              <span>
                <strong>{{ featureSecondaryTitle() }}</strong>
                <small>{{ featureSecondaryLead() }}</small>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section class="login-access">
        <div class="login-access__inner">
          <div class="login-access__mobile-brand">
            <div class="login-access__mobile-mark" aria-hidden="true">
              <lucide-icon name="building-2"></lucide-icon>
            </div>
            <span>ERP System</span>
          </div>

          <ng-content></ng-content>

          @if (showSupport()) {
            <div class="login-support">
              <lucide-icon name="mail" aria-hidden="true"></lucide-icon>
              <p>
                <strong>{{ supportTitle() }}</strong>
                <span>{{ supportLead() }}</span>
              </p>
            </div>
          }

          <p class="login-version">v2.5.4 | Build 20260414</p>
        </div>
      </section>
    </main>
  `,
})
export class AuthAccessShellComponent {
  readonly brandEyebrow = input('Bienvenido al');
  readonly brandTitle = input('Sistema ERP');
  readonly brandLead = input(
    'Acceso seguro a la plataforma de gestion empresarial. Inicia sesion con tus credenciales corporativas.',
  );

  readonly featurePrimaryIcon = input('lock');
  readonly featurePrimaryTitle = input('Conexion Segura');
  readonly featurePrimaryLead = input('Cifrado SSL/TLS de extremo a extremo');

  readonly featureSecondaryIcon = input('check');
  readonly featureSecondaryTitle = input('Proteccion de Datos');
  readonly featureSecondaryLead = input('Cumplimiento con estandares de seguridad');

  readonly supportTitle = input('Necesitas acceso o tienes problemas?');
  readonly supportLead = input('Contacta al administrador del sistema');
  /** Oculta la franja de ayuda inferior (p. ej. estado «correo enviado»). */
  readonly showSupport = input(true);
}
