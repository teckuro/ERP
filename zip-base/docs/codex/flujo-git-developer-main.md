# Flujo Git: developer -> main

## Objetivo

Usar `developer` como rama de trabajo y dejar que los commits cuenten en GitHub al integrarlos despues en `main`.

GitHub cuenta contribuciones cuando los commits estan publicados en la rama default (`main`) o `gh-pages`, y el email del autor esta asociado/verificado en la cuenta.

## 1. Sincronizar `developer` con `main`

Ejecutar esto cuando `developer` quedo divergido o antes de retomar trabajo:

```powershell
git checkout developer
git fetch origin
git rebase origin/main
git push --force-with-lease origin developer
```

Usar `--force-with-lease` solo cuando el rebase reescribe commits locales ya integrados o equivalentes. Es mas seguro que `--force` porque evita pisar cambios remotos nuevos.

## 2. Trabajar y commitear en `developer`

```powershell
git checkout developer
git pull --rebase origin developer
```

Agregar cambios:

```powershell
git add .
```

Commit detallado:

```powershell
git commit -m "feat(scope): resumen corto del cambio" `
  -m "Detalle:" `
  -m "- Cambio funcional 1." `
  -m "- Cambio funcional 2." `
  -m "- Documentacion o migracion relacionada." `
  -m "" `
  -m "Riesgo:" `
  -m "- Bajo/Medio/Alto y por que." `
  -m "" `
  -m "Verificacion:" `
  -m "- npm run build" `
  -m "- test/e2e/script ejecutado si aplica."
```

Publicar `developer`:

```powershell
git push origin developer
```

## 3. Integrar `developer` en `main`

```powershell
git checkout main
git pull --rebase origin main
git merge --no-ff developer -m "merge: integrar developer en main"
git push origin main
```

`--no-ff` deja un commit de merge explicito, util para ver cuando se promovio trabajo desde `developer`.

## 4. Re-alinear `developer`

Despues de subir `main`, volver a dejar `developer` sincronizado:

```powershell
git checkout developer
git merge main
git push origin developer
```

## Checklist rapido

- `git status --short --branch` limpio antes de cambiar ramas.
- `git branch -vv` para confirmar si una rama esta ahead/behind.
- `git log --oneline --decorate --graph --all -12` para revisar la relacion entre `developer`, `main` y remotos.
- El email de `git config user.email` debe estar verificado en GitHub.
- Si el commit solo esta en `developer`, no contara en el grafico global hasta llegar a `main`.
