# Instrucciones para agentes

La documentación operativa del proyecto (`docs/`, `.cursor/`) es **local** y no forma parte del repositorio público.

Antes de cambiar código:

1. Confirmar alcance con el usuario (pantalla/módulo concreto).
2. Preferir diff mínimo y patrones ya usados en el módulo tocado.
3. No commitear secretos (`.env`, `app-config.json` con claves, service role).
4. No tocar estilos globales ni SQL de producción sin pedirlo explícitamente.
