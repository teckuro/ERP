# Verificación SQL — borrador creación avanzada (local/dev)

Contexto y activación E2E: [`../docs/codex/temas/creacion-avanzada-borrador-tests.md`](../docs/codex/temas/creacion-avanzada-borrador-tests.md) · suite `tests/empleados-borrador-persistencia.spec.ts`.

Ajustar esquema si tu BD usa otros nombres de tabla/columna.

## Borradores con wizard pendiente

```sql
SELECT id_persona, rut, estado, paso_alta_avanzada
FROM persona
WHERE paso_alta_avanzada IS NOT NULL;
```

Esperado: `estado` coherente con borrador (p. ej. `BORRADOR`) y `paso_alta_avanzada` numérico.

## Tras finalizar alta

```sql
SELECT id_persona, estado, paso_alta_avanzada, apto_para_remuneraciones
FROM persona
WHERE id_persona = :id;
```

Esperado: `paso_alta_avanzada IS NULL`; estado operativo según reglas de negocio.

## Duplicados por RUT

```sql
SELECT rut, COUNT(*) AS n
FROM persona
GROUP BY rut
HAVING COUNT(*) > 1;
```

No debería aparecer el RUT de prueba usado en E2E si el flujo actualiza el mismo registro.
