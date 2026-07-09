# SEC — operaciones manuales (cierre AUDIT-SEC-2026-07)

> Complemento de [`auditoria-seguridad-2026-07.md`](./auditoria-seguridad-2026-07.md).  
> **No editar** el plan en `.cursor/plans/`.

---

## A. Desarrollo local (Angular + Supabase)

### A.1 Migraciones SEC en BD local

Si usas **Supabase local** (`supabase start`) o Postgres local:

1. En `.env`, define la conexión local (prioritaria para scripts SEC):

   ```env
   SUPABASE_DB_URL_LOCAL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
   ```

2. Verifica qué falta:

   ```bash
   npm run check:sec-migrations
   ```

3. Aplica la cadena completa (ADMIN-01 + SEC-03 + SEC-02…02e):

   ```bash
   npm run apply:sec-bd
   ```

4. Diagnóstico RLS:

   ```powershell
   psql "$env:SUPABASE_DB_URL_LOCAL" -v ON_ERROR_STOP=1 -f scripts/sec-audit-rls-diagnostics.sql
   ```

   Objetivo: `USING(true) = 0`, grants `anon` tablas = 0.

5. Smoke:

   ```bash
   npm run fixture:sec:consulta
   npm run smoke:sec
   ```

**Nota:** Si solo tienes `SUPABASE_DB_URL` (pooler remoto), los scripts usan esa URL. El código Angular puede correr en local apuntando a BD remota; eso **no** sustituye una BD local propia si quieres aislar datos.

### A.2 CORS Edge en local

- Sin `ERP_ALLOWED_ORIGIN`: las Edge Functions responden con CORS `*` (aceptable en dev).
- Para probar origen acotado desde `ng serve`:

  ```powershell
  $env:SUPABASE_PROJECT_REF = "<ref>"
  $env:ERP_ALLOWED_ORIGIN = "http://localhost:4200"
  .\scripts\sec-deploy-edge-cors.ps1
  ```

### A.3 Pooler (SEC-01) en local

**No aplica** rotación pooler en Postgres local / `supabase start`.  
La rotación es obligatoria solo al **desplegar o compartir** el proyecto remoto en Supabase Cloud.

---

## B. Producción / Supabase Cloud (operador)

### B.1 Rotación pooler (SEC-01) — obligatorio antes de ampliar usuarios

1. Supabase Dashboard → Project → **Database** → reset password / rotate pooler credentials.
2. Actualizar secretos del equipo: `.env`, CI, scripts que usen `SUPABASE_DB_URL`.
3. Verificar: `psql "$env:SUPABASE_DB_URL" -c "select 1"`.
4. Registrar en bitácora: fecha, responsable, project ref.

**Repo privado:** rotar credenciales; **no** usar `git filter-repo` salvo que el repo haya sido público.

### B.2 CORS Edge en producción (SEC-05)

1. Definir dominio real del ERP (ej. `https://erp.empresa.cl`).
2. Ejecutar:

   ```powershell
   $env:SUPABASE_PROJECT_REF = "<ref>"
   $env:ERP_ALLOWED_ORIGIN = "https://erp.empresa.cl"
   .\scripts\sec-deploy-edge-cors.ps1
   ```

3. Comprobar preflight desde el dominio: `Access-Control-Allow-Origin` acotado (no `*`).

---

## C. Validación manual (checklist RRHH)

Ver §9 en [`auditoria-seguridad-2026-07.md`](./auditoria-seguridad-2026-07.md).

Automatizado local:

```bash
npm run test:e2e:sec:guards   # requiere ng serve en :4200
```

---

*Contrastado con EST-008, `estado-fases.md` y plan cierre AUDIT-SEC-2026-07.*
