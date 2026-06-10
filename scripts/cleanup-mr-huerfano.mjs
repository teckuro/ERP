import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const cfg = JSON.parse(readFileSync(resolve('public/app-config.json'), 'utf8').replace(/^\uFEFF/, ''));
const sb = createClient(cfg.supabaseUrl.replace(/\/$/, ''), cfg.supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Borrar el MR huérfano que tenía id_haberdescuento_origen seteado a null
// tras el DELETE en HD (era 'test trigger' / monto 7777).
const { data: huerfanos } = await sb
  .from('movimiento_recurrente')
  .select('id, monto, glosa, id_haberdescuento_origen')
  .is('id_haberdescuento_origen', null);
console.log('Huérfanos detectados:', huerfanos);
if (huerfanos && huerfanos.length > 0) {
  const ids = huerfanos.filter((h) => h.glosa === 'test trigger').map((h) => h.id);
  if (ids.length > 0) {
    const { error } = await sb.from('movimiento_recurrente').delete().in('id', ids);
    console.log('Borrados:', ids, error);
  }
}
