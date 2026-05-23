import fs from 'fs';
const path = 'src/app/features/empleados/components/form-empleado/form-empleado.html';
let html = fs.readFileSync(path, 'utf8');
const block = `
                                @if (!isHonorariosMode() && altaResumenFaltantes().length > 0) {
                                <section
                                  class="alta-resumen-diagnostico-panel"
                                  aria-label="Pendientes para remuneraciones"
                                >
                                  <div class="alta-resumen-diagnostico-panel__head">
                                    <h4>Pendientes del expediente</h4>
                                    <p>{{ altaResumenEstadoPanel().motivoPrincipal }}</p>
                                  </div>
                                  <ul class="alta-resumen-diagnostico-panel__list">
                                    @for (issue of altaResumenFaltantes(); track issue.claveBloque + issue.mensaje) {
                                      <li>
                                        <button
                                          type="button"
                                          class="alta-resumen-diagnostico-panel__issue"
                                          (click)="irAlFaltanteResumenAlta(issue)"
                                        >
                                          <span class="alta-resumen-diagnostico-panel__block">{{ issue.etiquetaBloque }}</span>
                                          <span class="alta-resumen-diagnostico-panel__msg">{{ issue.mensaje }}</span>
                                        </button>
                                      </li>
                                    }
                                  </ul>
                                </section>
                                }
`;
if (!html.includes('alta-resumen-diagnostico-panel')) {
  html = html.replace(
    '                                <h4 class="resumen-checklist-title">',
    block + '\n                                <h4 class="resumen-checklist-title">',
  );
  fs.writeFileSync(path, html, 'utf8');
  console.log('html ok');
} else {
  console.log('html already');
}
