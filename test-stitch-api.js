#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load API key from .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const apiKeyMatch = envContent.match(/GOOGLE_STITCH_API_KEY=(.+)/);

if (!apiKeyMatch) {
  console.error('❌ GOOGLE_STITCH_API_KEY not found in .env.local');
  process.exit(1);
}

const apiKey = apiKeyMatch[1].trim();
const baseUrl = 'https://stitch.googleapis.com/mcp';

const endpoints = [
  '/',
  '',
  '/designs',
  '/list',
  '/api/designs',
  '/api/v1/designs',
];

async function testEndpoint(endpoint) {
  try {
    const url = `${baseUrl}${endpoint}`;
    console.log(`\n📡 Testing: ${endpoint || '(root)'}`);
    console.log('─'.repeat(60));
    console.log(`URL: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Headers:', {
      'content-type': response.headers.get('content-type'),
      'content-length': response.headers.get('content-length'),
    });

    const text = await response.text();
    console.log(`Response body (${text.length} bytes):`);
    console.log(text.substring(0, 500) || '(empty)');

    if (text && text.startsWith('{')) {
      try {
        const json = JSON.parse(text);
        console.log('Parsed JSON:', JSON.stringify(json, null, 2).substring(0, 500));
      } catch (e) {
        console.log('(not valid JSON)');
      }
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function main() {
  console.log('🎨 Google Stitch API Explorer (Detailed)');
  console.log('='.repeat(60));
  console.log(`API Key (first 20 chars): ${apiKey.substring(0, 20)}...`);
  console.log(`Base URL: ${baseUrl}`);

  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ API exploration complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Check which endpoint returned data');
  console.log('2. Share the successful response above');
  console.log('3. Or share your Google Stitch design documentation');
}

main();
