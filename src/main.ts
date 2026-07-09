import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { getConfigLoadError, loadRuntimeConfig } from './app/config/runtime-config';
import { renderConfigErrorScreen } from './app/config/render-config-error-screen';
import { mensajeErrorSupabaseParaUsuario } from './app/core/errors/erp-supabase-user-message';

loadRuntimeConfig()
  .then(() => {
    const configError = getConfigLoadError();
    if (configError) {
      console.error('[ERP] Configuración:', configError);
      renderConfigErrorScreen(configError);
      return;
    }
    return bootstrapApplication(App, appConfig);
  })
  .catch((err) => {
    const message = mensajeErrorSupabaseParaUsuario(err, 'iniciar la aplicación');
    console.error('[ERP] Arranque:', err);
    renderConfigErrorScreen(message);
  });
