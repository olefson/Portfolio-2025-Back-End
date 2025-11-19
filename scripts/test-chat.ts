/**
 * Test script for the chat endpoint
 * 
 * Run with: npm run test:chat
 * 
 * This will test the chat API endpoint to verify:
 * 1. The ChatService is working
 * 2. Tag inference works
 * 3. Context building works
 * 4. Response generation works
 */

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

interface ChatResponse {
  message: string;
  contextUsed?: {
    diaryCount: number;
    projectsCount: number;
    toolsCount: number;
    jobsCount: number;
    educationCount: number;
  };
}

async function testChat() {
  console.log('🧪 Testing Chat API endpoint...\n');
  console.log(`📍 Backend URL: ${BACKEND_URL}\n`);

  const testQueries = [
    'Tell me about Jason',
    'What does Jason do for fun?',
    'What is Jason\'s work experience?',
    'Where did Jason go to school?',
  ];

  for (const query of testQueries) {
    try {
      console.log(`\n📤 Sending: "${query}"`);
      
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error (${response.status}):`, errorText);
        continue;
      }

      const data = await response.json() as ChatResponse;
      console.log(`✅ Response received:`);
      console.log(`   Message: ${data.message.substring(0, 200)}${data.message.length > 200 ? '...' : ''}`);
      
      if (data.contextUsed) {
        console.log(`   Context used:`);
        console.log(`     - Diary: ${data.contextUsed.diaryCount}`);
        console.log(`     - Projects: ${data.contextUsed.projectsCount}`);
        console.log(`     - Tools: ${data.contextUsed.toolsCount}`);
        console.log(`     - Jobs: ${data.contextUsed.jobsCount}`);
        console.log(`     - Education: ${data.contextUsed.educationCount}`);
      }
    } catch (error) {
      console.error(`❌ Error testing query "${query}":`, error);
    }
  }

  console.log('\n✅ Chat API test complete!\n');
}

// Run the test
testChat().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

