const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing connection to Supabase...');
console.log('URL:', url);
console.log('Key:', key ? `${key.substring(0, 15)}...` : 'undefined');

if (!url || !key) {
  console.error('Error: URL or Key is missing in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

async function runTest() {
  console.log('\n1. Testing reading from "users" table...');
  const { data: selectData, error: selectError } = await supabase
    .from('users')
    .select('*')
    .limit(1);

  if (selectError) {
    console.error('Select error details:', selectError);
  } else {
    console.log('Select successful! Rows found:', selectData.length);
  }

  console.log('\n2. Testing inserting a test user into "users" table...');
  const testEmail = `test_${Date.now()}@healthtwin.com`;
  const { data: insertData, error: insertError } = await supabase
    .from('users')
    .upsert({
      email: testEmail,
      name: 'Supabase Test Connection',
      age: 25,
      weight: 70,
      height: 175,
      blood_group: 'O+',
      allergies: ['Shellfish'],
      medications: ['None'],
      conditions: ['None'],
      goals: ['Test Connection'],
      updated_at: new Date().toISOString()
    })
    .select();

  if (insertError) {
    console.error('Insert/Upsert error details:', insertError);
  } else {
    console.log('Insert/Upsert successful! Row inserted:', insertData);
  }
}

runTest();
