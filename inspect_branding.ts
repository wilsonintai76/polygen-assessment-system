
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://odzvkxzgoibxxybcocbr.supabase.co';
const supabaseKey = 'sb_publishable_ks7bePDTzSrm4yxylWDh9A_oR9zPcmc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectBrandingTable() {
  console.log('Inspecting institutional_branding table...');
  
  const { data, error } = await supabase.from('institutional_branding').upsert({
    id: 1,
    institution_name: 'TEST INSTITUTION NAME'
  }).select();
  
  if (error) {
    console.error('Error updating institutional_branding:', error);
  } else {
    console.log('Successfully updated institutional_branding:', data);
  }
}

inspectBrandingTable();
