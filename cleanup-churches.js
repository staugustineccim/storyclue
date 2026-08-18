#!/usr/bin/env node
// Direct Supabase query to check and fix church database
import { readFileSync } from 'fs';

// Load .env.local
const envContent = readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim().replace(/^"(.*)"$/, '$1');
});

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

async function main() {
  try {
    // Get all churches
    console.log('Fetching all church records...');
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/church_accounts?select=id,church_name,youtube_url&order=id`,
      {
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    const churches = await res.json();
    console.log(`\nTotal records in database: ${churches.length}`);

    // Count duplicates
    const nameMap = {};
    churches.forEach(c => {
      if (!nameMap[c.church_name]) nameMap[c.church_name] = [];
      nameMap[c.church_name].push(c.id);
    });

    const duplicates = Object.entries(nameMap).filter(([_, ids]) => ids.length > 1);
    console.log(`\nDuplicate church names: ${duplicates.length}`);

    if (duplicates.length > 0) {
      console.log('\nDuplicate breakdown:');
      duplicates.forEach(([name, ids]) => {
        console.log(`  ${name}: ${ids.length} copies (IDs: ${ids.join(', ')})`);
      });
    }

    // Check URLs
    const withUrls = churches.filter(c => c.youtube_url && c.youtube_url.length > 0);
    const withoutUrls = churches.filter(c => !c.youtube_url || c.youtube_url.length === 0);

    console.log(`\nRecords with URLs: ${withUrls.length}`);
    console.log(`Records without URLs: ${withoutUrls.length}`);

    if (withoutUrls.length > 0) {
      console.log('\nChurches missing URLs:');
      withoutUrls.slice(0, 10).forEach(c => {
        console.log(`  ID ${c.id}: ${c.church_name}`);
      });
    }

    // Show first 5 records
    console.log('\nFirst 5 records with URLs:');
    withUrls.slice(0, 5).forEach(c => {
      console.log(`  ${c.church_name}: ${c.youtube_url}`);
    });

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
