import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '../core/auth/auth.service';
import { AuthAccessShellComponent } from './auth-access-shell.component';

@Component({
  selector: 'app-recuperar-contrasena-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    AuthAccessShellComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './auth-access.shared.css',
  template: `
    <app-auth-access-shell
      [brandEyebrow]="panel().eyebrow"
      [brandTitle]="panel().title"
      [brandLead]="panel().lead"
      [featurePrimaryIcon]="panel().feature1.icon"
      [featurePrimaryTitle]="panel().feature1.title"
      [featurePrimaryLead]="panel().feature1.lead"
      [featureSecondaryIcon]="panel().feature2.icon"
      [featureSecondaryTitle]="panel().feature2.title"
      [featureSecondaryLead]="panel().feature2.lead"
      [supportTitle]="panel().supportTitle"
      [supportLead]="panel().supportLead"
      [showSupport]="!mensajeExito()"
    >
      <div class="login-card">
        @if (mensajeExito()) {
          <div class="login-result" role="status">
            <p class="login-result__status">Correo enviado</p>
            <h2 id="recovery-title" class="login-card__title">Revisa tu bandeja</h2>

            <p class="login-card__lead">
              Si hay una cuenta activa, el enlace llegó a:
            </p>
            <p class="login-result__email" title="{{ emailEnviado() }}">{{ emailEnviado() }}</p>

            <p class="login-result__hint">
              Abre el mensaje, pulsa <strong>Elegir nueva contraseña</strong> y define la clave en el
              ERP. Revisa spam si no aparece en unos minutos.
            </p>

            <p class="login-result__note">
              Por seguridad no confirmamos si el correo existe.
            </p>

            <div class="login-result__actions">
              <a class="login-submit login-submit--link" routerLink="/login">
                Ir al inicio de sesión
              </a>
              <button class="login-result__secondary" type="button" (click)="reintentar()">
                Usar otro correo
              </button>
            </div>
          </div>
        } @else {
          <a class="login-card__back" routerLink="/login">
            <lucide-icon name="arrow-left" aria-hidden="true"></lucide-icon>
            Volver al inicio de sesión
          </a>

          <div class="login-card__header">
            <h2 id="recovery-title" class="login-card__title">Recuperar contraseña</h2>
            <p class="login-card__lead">
              Indica el correo corporativo. Si la cuenta está activa, enviaremos un enlace seguro.
            </p>
          </div>

          <div class="login-card__divider" aria-hidden="true"></div>

          @if (mensajeError()) {
            <p class="login-error" role="alert">{{ mensajeError() }}</p>
          }

          <form class="login-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <label class="login-field" for="recovery-email">
              <span>Correo corporativo</span>
              <input
                id="recovery-email"
                type="email"
                autocomplete="username"
                formControlName="email"
                placeholder="usuario@empresa.com"
                [class.login-input--invalid]="showEmailError()"
                [attr.aria-invalid]="showEmailError()"
              />
              @if (showEmailError()) {
                <small>Ingresa un correo válido.</small>
              }
            </label>

            <button class="login-submit" type="submit" [disabled]="isSubmitting()">
              @if (isSubmitting()) {
                <span class="login-submit__spinner" aria-hidden="true"></span>
              }
              {{ isSubmitting() ? 'Enviando…' : 'Enviar enlace' }}
            </button>
          </form>
        }
      </div>
    </app-auth-access-shell>
  `,
})
export class RecuperarContrasenaPage {
  private readonly auth = inject(AuthService);

  readonly isSubmitting = signal(false);
  readonly submitted = signal(false);
  readonly mensajeError = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);
  readonly emailEnviado = signal('');

  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  readonly panel = computed(() => {
    if (this.mensajeExito()) {
      return {
        eyebrow: 'Siguiente paso',
        title: 'Revisa el correo',
        lead: 'El enlace es de un solo uso. Cuando lo abras, podrás definir una contraseña nueva.',
        feature1: {
          icon: 'mail',
          title: 'Bandeja o spam',
          lead: 'Si no llega en unos minutos, revisa correo no deseado',
        },
        feature2: {
          icon: 'lock',
          title: 'Enlace temporal',
          lead: 'Caduca pronto y no reutiliza la clave anterior',
        },
        supportTitle: '',
        supportLead: '',
      };
    }

    return {
      eyebrow: 'Recupera el',
      title: 'Acceso al ERP',
      lead: 'Te enviaremos un enlace seguro a tu correo corporativo para definir una nueva contraseña.',
      feature1: {
        icon: 'mail',
        title: 'Enlace seguro',
        lead: 'El correo solo se envía si la cuenta está activa',
      },
      feature2: {
        icon: 'lock',
        title: 'Sesión temporal',
        lead: 'El enlace caduca y no reutiliza tu clave anterior',
      },
      supportTitle: '¿Necesitas ayuda?',
      supportLead: 'Contacta al administrador del sistema',
    };
  });

  showEmailError(): boolean {
    const control = this.form.controls.email;
    return control.invalid && (this.submitted() || control.touched);
  }

  reintentar(): void {
    this.mensajeExito.set(null);
    this.emailEnviado.set('');
    this.mensajeError.set(null);
    this.submitted.set(false);
  }

  async submit(): Promise<void> {
    this.submitted.set(true);
    this.mensajeError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensajeError.set('Ingresa el correo corporativo registrado.');
      return;
    }

    this.isSubmitting.set(true);
    try {
      const email = this.form.controls.email.value.trim();
      await this.auth.solicitarRecuperacionContrasena(email);
      this.emailEnviado.set(email);
      this.mensajeExito.set('ok');
    } catch (error) {
      this.mensajeError.set(error instanceof Error ? error.message : 'No fue posible enviar el correo.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
