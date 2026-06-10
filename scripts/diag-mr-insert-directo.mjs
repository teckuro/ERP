/**
 * ¿El bridge HD → MR no escribe porque alguna policy/check bloquea?
 * Hago un INSERT directo (anon) con los mismos valores que debería emitir
 * el trigger para HD id_asignacion=1 (persona=2, concepto MOVILIZACION).
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const cfg = JSON.parse(readFileSync(resolve('public/app-config.json'), 'utf8').replace(/^\uFEFF/, ''));
const supabase = createClient(cfg.supabaseUrl.replace(/\/$/, ''), cfg.supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const payload = {
  id_empresa: 1,
  id_persona: 2,
  tipo: 'MOVILIZACION',
  categoria: 'haber',
  monto: 20000,
  cantidad: null,
  unidad: null,
  frecuencia: 'mensual',
  activo_desde: '2026-05-01',
  activo_hasta: null,
  estado: 'activo',
  glosa: 'diagnóstico bridge',
  id_haberdescuento_origen: 1,
};

const { data, error } = await supabase
  .from('movimiento_recurrente')
  .insert(payload)
  .select('*');

console.log('insert resultado:', { data, error });

const { data: mrs } = await supabase
  .from('movimiento_recurrente')
  .select('id, id_persona, tipo, monto, id_haberdescuento_origen, activo_desde');
console.log('MR despues:', mrs);
