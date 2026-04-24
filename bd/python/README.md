# Python

Los generadores fuente se ejecutan por fuera desde:

```text
C:\Users\PC\Desktop\ERP\Python
```

Esta carpeta documenta el flujo y puede contener copias locales auxiliares. Los scripts fuente principales son:

- `scrape_semillas_v611_v4.py`: genera `out_v611_seed/data/seed_v611.json` y `seed_v611.sql`.
- `scrape_parametros_mensuales_v611_v3.py`: genera parametros mensuales.
- `out_v611_seed/scripts/mensual/render_parametros_mensuales_v611.py`: renderiza el SQL mensual desde JSON.
- `out_v611_seed/scripts/faltantes/fetch_faltantes_v611.py`: levanta faltantes normativos.
- `out_v611_seed/scripts/auditoria/auditar_seed_v611.py`: audita cobertura de las salidas.

Comando de auditoria:

```powershell
& 'C:\Users\PC\Desktop\ERP\Python\.venv\Scripts\python.exe' 'C:\Users\PC\Desktop\ERP\Python\out_v611_seed\scripts\auditoria\auditar_seed_v611.py'
```

Cuando se regenere `seed_v611.sql`, copiar la salida validada a:

```text
bd/insert/v11/seed_v611.sql
```
