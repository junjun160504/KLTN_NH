/**
 * Script tạo OpenAI Assistant mới
 * 
 * Chạy: node src/scripts/create-assistant.js
 * 
 * Script này sẽ:
 * 1. Tạo Assistant mới với cấu hình từ openaiAssistant.js
 * 2. In ra ASSISTANT_ID để lưu vào .env
 */

import openai from '../config/openaiClient.js';
import {
    ASSISTANT_MODEL,
    ASSISTANT_INSTRUCTIONS,
    ASSISTANT_TOOLS
} from '../config/openaiAssistant.js';

async function createAssistant() {
    console.log('\n🤖 Creating new OpenAI Assistant...\n');
    console.log('='.repeat(50));

    try {
        // Kiểm tra kết nối OpenAI
        console.log('📡 Checking OpenAI connection...');
        const models = await openai.models.list();
        console.log(`✅ Connected! (${models.data.length} models available)\n`);

        // Tạo Assistant mới
        console.log('🔨 Creating Assistant...');
        console.log(`   Model: ${ASSISTANT_MODEL}`);
        console.log(`   Tools: ${ASSISTANT_TOOLS.length} functions`);

        const assistant = await openai.beta.assistants.create({
            name: "Restaurant Menu AI Assistant",
            description: "Trợ lý AI hỗ trợ khách hàng tìm hiểu menu nhà hàng",
            model: ASSISTANT_MODEL,
            instructions: ASSISTANT_INSTRUCTIONS,
            tools: ASSISTANT_TOOLS
        });

        console.log('\n' + '='.repeat(50));
        console.log('✅ Assistant created successfully!\n');
        console.log('📋 Assistant Details:');
        console.log(`   ID: ${assistant.id}`);
        console.log(`   Name: ${assistant.name}`);
        console.log(`   Model: ${assistant.model}`);
        console.log(`   Created: ${new Date(assistant.created_at * 1000).toLocaleString()}`);

        console.log('\n' + '='.repeat(50));
        console.log('⚠️  IMPORTANT: Add this to your .env file:\n');
        console.log(`   OPENAI_ASSISTANT_ID=${assistant.id}`);
        console.log('\n' + '='.repeat(50));

        // List tools
        console.log('\n📦 Configured Tools:');
        assistant.tools.forEach((tool, i) => {
            if (tool.type === 'function') {
                console.log(`   ${i + 1}. ${tool.function.name}`);
            }
        });

        console.log('\n🎉 Done! You can now run tests.\n');

        return assistant.id;

    } catch (error) {
        console.error('\n❌ Error creating assistant:', error.message);

        if (error.status === 401) {
            console.error('   → Invalid API key. Check OPENAI_API_KEY in .env');
        } else if (error.status === 429) {
            console.error('   → Rate limit exceeded. Try again later.');
        }

        process.exit(1);
    }
}

// Run
createAssistant();
