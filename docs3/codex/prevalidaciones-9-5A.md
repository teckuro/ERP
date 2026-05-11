# Prevalidaciones 9.5A

Documento raiz de compatibilidad para la fase 9.5A.

Fuente canonica del detalle implementado: [`modulos/nomina-mensual/prevalidaciones-9-5A.md`](./modulos/nomina-mensual/prevalidaciones-9-5A.md).

Documentos complementarios DOC-04:

- [`modulos/nomina-mensual/prevalidaciones.md`](./modulos/nomina-mensual/prevalidaciones.md)
- [`modulos/nomina-mensual/integracion-parametros-legales.md`](./modulos/nomina-mensual/integracion-parametros-legales.md)
- [`modulos/nomina-mensual/matriz-bloqueos-periodo.md`](./modulos/nomina-mensual/matriz-bloqueos-periodo.md)

Reglas clave:

- Validar empleados aptos para remuneraciones.
- Validar parametros vigentes del periodo.
- Validar jornada vigente y asignacion familiar cuando corresponda.
- Bloquear si SIS no esta confirmado por fuente oficial mensual.
- No calcular motor ni liquidaciones en esta fase documental.