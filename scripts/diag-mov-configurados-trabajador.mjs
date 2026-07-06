/**
 * Diagnóstico: por qué un trabajador con movimientos configurados no aparece
 * en el tab "Configurados" de un período concreto.
 *
 * Uso:
 *   node scripts/diag-mov-configurados-trabajador.mjs <RUT> [YYYY-MM]
 *
 * Ej.:
 *   node scripts/diag-mov-configurados-trabajador.mjs 25050001 2026-05
 *
 * Pasos del cruce que se imprimen (replica `listarMovimientosConfigurados`):
 *   1) persona por RUT  →  id_persona, id_empresa actual.
 *   2) movimiento_recurrente de esa persona en esa empresa
 *      (estado, activo_desde, activo_hasta, segmento, scope).
 *   3) nomina_periodo (empresa + periodo)  →  id, estado.
 *   4) segmento_nomina de esa nómina       →  trabajador_ids (¿está la persona?).
 *   5) movimiento_nomina (recurrente + persona)  →  estado existente.
 *
 * El diagnóstico apunta a una de cuatro causas:
 *   a) recurrente inexistente / inactivo / fuera de empresa.
 *   b) nómina no creada para ese período.
 *   c) trabajador NO está en ningún segmento de esa nómina (dotación faltante).
 *   d) ya está aplicado / omitido en la nómina (sale como "ya cargado" / "omitido").
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const rawRut = (process.argv[2] ?? '').replace(/[.\-]/g, '').trim();
if (!rawRut) {
  console.error('Uso: node scripts/diag-mov-configurados-trabajador.mjs <RUT> [YYYY-MM]');
  process.exit(2);
}
const dvProvisto = rawRut.length > 1 ? rawRut.slice(-1) : null;
const rutNumero = rawRut.length > 1 && /[0-9kK]/.test(dvProvisto) ? rawRut.slice(0, -1) : rawRut;
const periodo = process.argv[3] ?? new Date().toISOString().slice(0, 7);

const cfg = JSON.parse(readFileSync(resolve('public/app-config.json'), 'utf8').replace(/^\uFEFF/, ''));
const supabase = createClient(cfg.supabaseUrl.replace(/\/$/, ''), cfg.supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function header(t) {
  console.log(`\n=== ${t} ===`);
}

async function main() {
  console.log(`Diagnóstico para RUT ${rutNumero}${dvProvisto ? `-${dvProvisto}` : ''} · período ${periodo}`);

  // 1) persona (y empresa por contrato vigente)
  header('1) persona');
  const { data: personas, error: ePersona } = await supabase
    .from('persona')
    .select('id_persona, rut, dv, nombres, apellido_paterno, apellido_materno, estado_ficha, estado, apto_para_remuneraciones')
    .eq('rut', rutNumero);
  if (ePersona) {
    console.error('ERROR persona:', ePersona);
    process.exit(1);
  }
  if (!personas || personas.length === 0) {
    console.log('  Sin coincidencias por RUT. Termina aquí.');
    process.exit(0);
  }
  personas.forEach((p) => {
    console.log(`  id_persona=${p.id_persona} | ${p.nombres} ${p.apellido_paterno} ${p.apellido_materno} | rut=${p.rut}-${p.dv} | estado=${p.estado} ficha=${p.estado_ficha} apto=${p.apto_para_remuneraciones}`);
  });
  const persona = personas[0];

  header('1b) contrato vigente (para determinar empresa)');
  const { data: contratos, error: eC } = await supabase
    .from('contrato')
    .select('id_contrato, id_empresa, id_persona, estado, fingreso, fretiro, cargo')
    .eq('id_persona', persona.id_persona)
    .order('id_contrato', { ascending: false });
  if (eC) console.error('  ERROR contrato:', eC);
  if (!contratos || contratos.length === 0) {
    console.log('  Sin contratos (vía tabla contrato). Cae a vw_persona_factores como respaldo.');
  } else {
    contratos.forEach((c) => {
      console.log(`  contrato=${c.id_contrato} | empresa=${c.id_empresa} | estado=${c.estado} | ingreso=${c.fingreso} retiro=${c.fretiro ?? '—'} | cargo=${c.cargo ?? '—'}`);
    });
  }
  // Respaldo: vista que usa la app
  const { data: vista } = await supabase
    .from('vw_persona_factores')
    .select('id_persona, id_contrato, id_empresa, cargo, fingreso, fretiro, estado, estado_contrato, estado_ficha')
    .eq('id_persona', persona.id_persona);
  console.log('  vw_persona_factores:', vista && vista.length ? vista : '(vacío)');
  const idEmpresa = (contratos && contratos.length > 0)
    ? contratos[0].id_empresa
    : (vista && vista.length > 0 ? vista[0].id_empresa : null);
  if (idEmpresa == null) {
    console.log('  No se pudo determinar empresa. Termina aquí.');
    process.exit(0);
  }
  console.log(`  ID empresa resuelto: ${idEmpresa}`);

  // 2) movimiento_recurrente
  header('2) movimiento_recurrente que apuntan a esta persona (cualquier empresa)');
  const { data: recDirectos, error: eRec } = await supabase
    .from('movimiento_recurrente')
    .select('id, id_empresa, id_persona, id_segmento_nomina, id_centro_costo, id_cargo, tipo, categoria, monto, cantidad, frecuencia, estado, activo_desde, activo_hasta, glosa, created_at')
    .eq('id_persona', persona.id_persona);
  if (eRec) console.error('ERROR recurrentes directos:', eRec);
  if (!recDirectos || recDirectos.length === 0) {
    console.log('  Sin recurrentes con id_persona=', persona.id_persona);
  } else {
    recDirectos.forEach((r) => {
      console.log(`  rec=${r.id.slice(0, 8)}… | empresa=${r.id_empresa} | tipo=${r.tipo} | estado=${r.estado} | desde=${r.activo_desde} hasta=${r.activo_hasta ?? '—'} | monto=${r.monto ?? '—'} cant=${r.cantidad ?? '—'} | freq=${r.frecuencia} | segmento=${r.id_segmento_nomina ?? '—'}`);
    });
  }

  // 2b) recurrentes "globales" (sin id_persona) en la empresa del trabajador
  header(`2b) movimiento_recurrente globales (sin id_persona) de empresa ${idEmpresa}`);
  const { data: recGlobales } = await supabase
    .from('movimiento_recurrente')
    .select('id, id_persona, id_segmento_nomina, tipo, estado, activo_desde, activo_hasta')
    .eq('id_empresa', idEmpresa)
    .is('id_persona', null);
  if (!recGlobales || recGlobales.length === 0) {
    console.log('  Sin recurrentes globales para la empresa', idEmpresa);
  } else {
    recGlobales.forEach((r) => {
      console.log(`  rec=${r.id.slice(0, 8)}… | tipo=${r.tipo} | estado=${r.estado} | desde=${r.activo_desde} hasta=${r.activo_hasta ?? '—'} | segmento=${r.id_segmento_nomina ?? '—'}`);
    });
  }

  // 2c) Tabla LEGACY haberdescuento_persona (ficha del trabajador)
  header(`2c) haberdescuento_persona (LEGACY · ficha del trabajador)`);
  const { data: hdLegacy, error: eHd } = await supabase
    .from('haberdescuento_persona')
    .select('id_asignacion, id_concepto, monto, porcentaje, tipo, tipohaber, estado, id_contrato, vigencia_inicio, vigencia_fin, periodicidad, observacion')
    .eq('id_persona', persona.id_persona);
  if (eHd) console.error('  ERROR haberdescuento_persona:', eHd);
  if (!hdLegacy || hdLegacy.length === 0) {
    console.log('  Sin asignaciones en haberdescuento_persona.');
  } else {
    hdLegacy.forEach((h) => {
      console.log(`  hd=${h.id_asignacion} | concepto=${h.id_concepto} | tipo=${h.tipohaber ?? h.tipo} | monto=${h.monto ?? '—'} | %=${h.porcentaje ?? '—'} | estado=${h.estado} | contrato=${h.id_contrato ?? '—'} | desde=${h.vigencia_inicio ?? '—'} hasta=${h.vigencia_fin ?? '—'} | periodicidad=${h.periodicidad ?? '—'} | obs=${h.observacion ?? '—'}`);
    });
  }

  // 2d) Tabla movimiento_variable_mensual (para el período específico)
  header(`2d) movimiento_variable_mensual · período=${periodo}`);
  const { data: movVar, error: eMv } = await supabase
    .from('movimiento_variable_mensual')
    .select('id_movimiento_variable, id_concepto, monto, cantidad, periodo, estado, glosa')
    .eq('id_persona', persona.id_persona);
  if (eMv) console.error('  ERROR movimiento_variable_mensual:', eMv);
  if (!movVar || movVar.length === 0) {
    console.log('  Sin movimientos variables para esta persona (cualquier período).');
  } else {
    movVar.forEach((m) => {
      console.log(`  mv=${m.id_movimiento_variable} | concepto=${m.id_concepto} | periodo=${m.periodo} | monto=${m.monto ?? '—'} cant=${m.cantidad ?? '—'} | estado=${m.estado} | glosa=${m.glosa ?? '—'}`);
    });
  }

  // 3) nomina_periodo del período
  header(`3) nomina_periodo · empresa=${idEmpresa} periodo=${periodo}`);
  const { data: nominas, error: eNom } = await supabase
    .from('nomina_periodo')
    .select('id, periodo, tipo, estado, id_empresa, total_trabajadores, total_segmentos, created_at, updated_at')
    .eq('id_empresa', idEmpresa)
    .eq('periodo', periodo)
    .order('created_at', { ascending: false });
  if (eNom) console.error('ERROR nominas:', eNom);
  if (!nominas || nominas.length === 0) {
    console.log('  No hay nómina creada para ese período en esa empresa.');
    console.log('  →  CAUSA POSIBLE: la pantalla "Configurados" se ve para una nómina distinta a la esperada.');
    process.exit(0);
  }
  nominas.forEach((n) => {
    console.log(`  nomina=${n.id} | estado=${n.estado} | tipo=${n.tipo} | total_trab=${n.total_trabajadores} total_seg=${n.total_segmentos} | created=${n.created_at}`);
  });

  // 4) segmento_nomina de cada nómina → ¿está el trabajador?
  for (const nom of nominas) {
    header(`4) segmento_nomina de la nómina ${nom.id}`);
    const { data: segs } = await supabase
      .from('segmento_nomina')
      .select('id, nombre, ordinal, total_trabajadores, trabajador_ids')
      .eq('id_nomina_periodo', nom.id)
      .order('ordinal');
    if (!segs || segs.length === 0) {
      console.log('  Sin segmentos. Dotación vacía.');
      console.log('  →  CAUSA: la nómina aún no tiene dotación. `listarMovimientosConfigurados` queda 0 porque `nomina.trabajadorIds = []`.');
      continue;
    }
    let presente = false;
    segs.forEach((s) => {
      const ids = Array.isArray(s.trabajador_ids) ? s.trabajador_ids : [];
      const tiene = ids.includes(persona.id_persona);
      if (tiene) presente = true;
      console.log(`  seg=${s.nombre} (ord ${s.ordinal}) | total=${s.total_trabajadores} | contiene persona ${persona.id_persona}: ${tiene ? 'SÍ' : 'no'}`);
    });
    if (!presente) {
      console.log(`  →  CAUSA: la persona ${persona.id_persona} NO está en ningún segmento de esa nómina. El recurrente existe pero el cruce con dotación lo descarta.`);
    }

    // 5) movimiento_nomina existente con recurrente + persona
    header(`5) movimiento_nomina ya cargados/omitidos en nómina ${nom.id}`);
    const { data: movs } = await supabase
      .from('movimiento_nomina')
      .select('id, id_persona, id_recurrente, tipo, estado, origen, created_at')
      .eq('id_nomina_periodo', nom.id)
      .eq('id_persona', persona.id_persona);
    if (!movs || movs.length === 0) {
      console.log('  Sin movimientos cargados para la persona en esta nómina.');
    } else {
      movs.forEach((m) => {
        console.log(`  mov=${m.id.slice(0, 8)}… | tipo=${m.tipo} | estado=${m.estado} | origen=${m.origen} | recurrente=${m.id_recurrente?.slice(0, 8) ?? '—'}…`);
      });
    }
  }
}

main().catch((err) => {
  console.error('FATAL', err);
  process.exit(1);
});
