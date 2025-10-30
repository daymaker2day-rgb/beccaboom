#!/usr/bin/env node

/**
 * Gemini API Test Script
 * Tests the API key and connection to Google Gemini
 */

const apiKey = 'AIzaSyAMWtB8sAX6TCBJ048B18Jkb-_RLJO5c2g';
const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

console.log('🧪 Testing Gemini API...\n');
console.log('📋 Configuration:');
console.log(`  API Key: ${apiKey.substring(0, 20)}...`);
console.log(`  API URL: ${apiUrl}`);
console.log(`  Model: gemini-1.5-flash\n`);

async function testAPI() {
  try {
    console.log('📤 Sending test request...');
    
    const response = await fetch(`${apiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: 'Say "Hello! The API is working perfectly!" in exactly one sentence.',
              },
            ],
          },
        ],
      }),
    });

    console.log(`📨 Response Status: ${response.status} ${response.statusText}\n`);

    const data = await response.json();

    if (response.ok) {
      console.log('✅ API TEST SUCCESSFUL!\n');
      console.log('📝 Response:');
      
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        console.log(`  "${text}"\n`);
        console.log('✨ Gemini API is working correctly!');
      } else {
        console.log('  (No response text)\n');
        console.log('Full response:', JSON.stringify(data, null, 2));
      }
    } else {
      console.log('❌ API ERROR!\n');
      console.log('Error Details:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.error?.message?.includes('API key')) {
        console.log('\n💡 Tip: Check your API key in .env.local');
      } else if (data.error?.message?.includes('quota')) {
        console.log('\n💡 Tip: You may have exceeded your quota. Visit https://aistudio.google.com');
      }
    }
  } catch (error) {
    console.log('❌ CONNECTION ERROR!\n');
    console.log(`Error: ${error.message}\n`);
    console.log('💡 Troubleshooting:');
    console.log('  1. Check your internet connection');
    console.log('  2. Verify the API key is correct');
    console.log('  3. Check Google API status: https://status.cloud.google.com/');
  }
}

testAPI();
