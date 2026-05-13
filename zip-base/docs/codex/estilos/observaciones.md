# Observaciones de estilos

## UI-FONTS-LOCAL-01

- Estado: cerrado.
- Fecha: 2026-05-12.
- Se elimino la dependencia runtime de Google Fonts desde `src/index.html`.
- La fuente base queda definida con pila local/sistema en `src/styles.css` mediante `--erp-font-sans`.
- Los componentes deben heredar `--erp-font-sans` o usar `font-family: var(--erp-font-sans, system-ui, sans-serif)`.
- Si se agrega una fuente de marca a futuro, debe publicarse como asset local versionado y documentarse antes de usarla.

## Verificacion

- `rg` sin referencias runtime a `fonts.googleapis.com` o `fonts.gstatic.com` en `src`.
- `npm run build` ejecutado correctamente; solo reporto warnings de budget CSS existentes en componentes de empleados.
