# Matriz de roles y permisos (borrador)

*Nota: La implementacion de roles, JWT y RLS esta en definicion (fase SEG-01). Este documento es un borrador que debe ajustarse cuando se implemente la seguridad real.*

| Rol | Descripcion | Permisos principales |
|-----|-------------|----------------------|
| **Administrador** | Acceso completo al sistema. Puede crear, editar y borrar registros en todos los modulos; puede administrar usuarios y configurar parametros. | CRUD de todos los modulos; configuracion de sistema; administracion de roles. |
| **Analista de remuneraciones** | Gestiona empleados, asignaciones recurrentes y movimientos variables; puede ejecutar prevalidaciones y visualizar reportes. | Crear y editar empleados; gestionar haberes y descuentos; cargar movimientos variables; ejecutar prevalidaciones mensuales. |
| **Auditor** | Acceso de solo lectura a la informacion; puede visualizar reportes y ejecutar auditorias. | Lectura de modulos; acceso a informes; visualizacion de logs de auditoria. |
| **Invitado** | Acceso restringido solo a reportes y paneles autorizados. | Lectura de reportes publicados; sin acceso a edicion. |

Las columnas de permisos especificas (por modulo, accion y estado) se completaran en la fase SEG-01. 
Posteriormente se anadira la configuracion de JWT/RLS en BD y servicios.
