# admin-usuarios

Administración de usuarios del ERP desde el módulo Administrador (`/administracion`).

Requiere JWT de un usuario con rol admin del sistema en `app_metadata.role`.
Opera solo sobre usuarios de la misma empresa (`app_metadata.id_empresa`).

## Acciones (POST JSON)

| Acción | Payload | Efecto |
|--------|---------|--------|
| `listar` | `{}` | Lista usuarios de la empresa del llamador |
| `crear` | `{ email, password, nombre, idPerfil }` | Crea usuario con contraseña temporal y perfil |
| `asignar_perfil` | `{ userId, idPerfil }` | Cambia el perfil (actualiza `role` + `id_perfil` en `app_metadata`) |
| `desactivar` | `{ userId }` | Bloquea el acceso (ban) |
| `reactivar` | `{ userId }` | Restaura el acceso |

## Variables

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (valida el JWT del llamador)
- `SUPABASE_SERVICE_ROLE_KEY` (Admin API)
- `ERP_ALLOWED_ORIGIN` (opcional, SEC-05/SEC-06): origen del ERP en producción (p. ej. `https://erp.ejemplo.cl`). Si no está definido, CORS responde `*`. Con valor fijo, OPTIONS de origen ajeno responde 403 y no se envía `Allow-Origin` usable.
- Rate limit SEC-06: 30 peticiones / 60s por usuario (en memoria del isolate; se reinicia en cold start).

## Despliegue

```bash
supabase functions deploy admin-usuarios
```

Con verificación de JWT activa (por defecto): la función igual re-valida sesión y rol admin del sistema.
