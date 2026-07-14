/** Pantalla estática cuando app-config.json no permite iniciar Supabase. */
export function renderConfigErrorScreen(message: string): void {
  const host = document.querySelector('app-root');
  if (!host) return;

  host.innerHTML = `
    <div class="erp-config-error" role="alert">
      <h1>No se pudo iniciar el ERP</h1>
      <p class="erp-config-error__lead">${escapeHtml(message)}</p>
      <section class="erp-config-error__steps" aria-label="Pasos para corregir">
        <h2>Qué hacer</h2>
        <ol>
          <li>Abra <strong>Supabase Dashboard</strong> → su proyecto → <strong>Settings → API</strong>.</li>
          <li>Copie la <strong>publishable key</strong> (<code>sb_publishable_...</code>) o la clave legacy <strong>anon public</strong> completa.</li>
          <li>Edite <code>public/app-config.json</code> y pegue la clave en <code>supabaseAnonKey</code>.</li>
          <li>Verifique que <code>supabaseUrl</code> sea <code>https://xxxx.supabase.co</code> del mismo proyecto.</li>
          <li>Reinicie <code>npm start</code>.</li>
        </ol>
      </section>
      <p class="erp-config-error__hint">
        Puede partir de <code>public/app-config.example.json</code> si aún no tiene el archivo.
      </p>
    </div>
  `;

  if (!document.getElementById('erp-config-error-style')) {
    const style = document.createElement('style');
    style.id = 'erp-config-error-style';
    style.textContent = `
      .erp-config-error {
        box-sizing: border-box;
        max-width: 40rem;
        margin: 2.5rem auto;
        padding: 1.25rem 1.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        background: #fff;
        color: #1e293b;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.45;
      }
      .erp-config-error h1 {
        margin: 0 0 0.5rem;
        font-size: 1.125rem;
        font-weight: 700;
      }
      .erp-config-error h2 {
        margin: 0 0 0.5rem;
        font-size: 0.8125rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #64748b;
      }
      .erp-config-error__lead {
        margin: 0 0 1rem;
        padding: 0.625rem 0.75rem;
        border-radius: 4px;
        background: #fef2f2;
        color: #b91c1c;
      }
      .erp-config-error__steps {
        margin: 0 0 0.75rem;
      }
      .erp-config-error ol {
        margin: 0;
        padding-left: 1.25rem;
      }
      .erp-config-error li + li {
        margin-top: 0.35rem;
      }
      .erp-config-error code {
        font-size: 0.8125rem;
        background: #f8fafc;
        padding: 0.1rem 0.25rem;
        border-radius: 3px;
      }
      .erp-config-error__hint {
        margin: 0;
        font-size: 0.8125rem;
        color: #64748b;
      }
    `;
    document.head.appendChild(style);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
