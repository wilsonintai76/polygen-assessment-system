import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val) acc[key] = val.join('=').replace(/['"]/g, '');
  return acc;
}, {} as Record<string, string>);

const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: q } = await supabase.rpc('get_table_columns', { table_name: 'questions' });
  console.log('Questions schema:', q);
  
  const { data: p } = await supabase.rpc('get_table_columns', { table_name: 'assessment_papers' });
  console.log('Papers schema:', p);
}
run();
