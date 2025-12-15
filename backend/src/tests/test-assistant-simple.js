/**
 * Simple Test Script for Chatbot V2 - OpenAI Assistants API
 * 
 * Chạy: node src/tests/test-assistant-simple.js
 */

import openai from '../config/openaiClient.js';
import { ASSISTANT_ID } from '../config/openaiAssistant.js';
import * as chatbotFunctions from '../services/chatbotV2/chatbot-functions.service.js';
import * as functionRouter from '../services/chatbotV2/function-router.service.js';

// Colors
const log = {
    info: (msg) => console.log(`\x1b[34mℹ️  ${msg}\x1b[0m`),
    success: (msg) => console.log(`\x1b[32m✅ ${msg}\x1b[0m`),
    error: (msg) => console.log(`\x1b[31m❌ ${msg}\x1b[0m`),
    section: (title) => {
        console.log('\n' + '='.repeat(50));
        console.log(`\x1b[36m  ${title}\x1b[0m`);
        console.log('='.repeat(50));
    }
};

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================
// TESTS
// ============================================

async function testOpenAI() {
    log.section('Test 1: OpenAI Connection');
    try {
        const models = await openai.models.list();
        log.success(`Connected! Found ${models.data.length} models`);
        return true;
    } catch (err) {
        log.error(`Failed: ${err.message}`);
        return false;
    }
}

async function testAssistant() {
    log.section('Test 2: Verify Assistant');
    log.info(`Assistant ID: ${ASSISTANT_ID || 'NOT SET'}`);

    if (!ASSISTANT_ID) {
        log.error('OPENAI_ASSISTANT_ID not set in .env');
        return false;
    }

    try {
        const assistant = await openai.beta.assistants.retrieve(ASSISTANT_ID);
        log.success(`Found: "${assistant.name}" (${assistant.model})`);
        log.info(`Tools: ${assistant.tools?.map(t => t.function?.name || t.type).join(', ')}`);
        return true;
    } catch (err) {
        log.error(`Failed: ${err.message}`);
        return false;
    }
}

async function testLocalFunctions() {
    log.section('Test 3: Local Functions (Database)');

    try {
        // Test get_categories
        log.info('Testing get_categories()...');
        const categories = await chatbotFunctions.getCategories();
        log.success(`Found ${categories.length} categories`);

        // Test get_menu (simple query without params)
        log.info('Testing get_menu()...');
        const menu = await chatbotFunctions.getMenu({});
        log.success(`Found ${menu.length} menu items`);

        // Test get_recommendations  
        log.info('Testing get_recommendations()...');
        const recs = await chatbotFunctions.getRecommendations({});
        log.success(`Found ${recs.length} recommendations`);

        return true;
    } catch (err) {
        log.error(`Failed: ${err.message}`);
        console.error(err);
        return false;
    }
}

async function testFullChat() {
    log.section('Test 4: Full Chat Flow');

    let testThreadId = null;
    let testRunId = null;

    try {
        // 1. Create thread
        log.info('Creating thread...');
        const thread = await openai.beta.threads.create();
        testThreadId = thread.id;
        log.success(`Thread: ${testThreadId}`);

        // 2. Send message
        log.info('Sending message: "Xin chào, cho tôi xem menu"');
        await openai.beta.threads.messages.create(testThreadId, {
            role: 'user',
            content: 'Xin chào, cho tôi xem menu có những món gì ngon?'
        });

        // 3. Create run
        log.info('Creating run...');
        const run = await openai.beta.threads.runs.create(testThreadId, {
            assistant_id: ASSISTANT_ID
        });
        testRunId = run.id;
        log.info(`Run: ${testRunId}`);

        // 4. Wait for completion with function handling
        log.info('Waiting for completion...');
        const maxWait = 60000; // 60s
        const startTime = Date.now();

        while (Date.now() - startTime < maxWait) {
            // Retrieve run status - SDK v5: retrieve(runID, { thread_id })
            const currentRun = await openai.beta.threads.runs.retrieve(testRunId, { thread_id: testThreadId });
            log.info(`Status: ${currentRun.status}`);

            if (currentRun.status === 'completed') {
                break;
            }

            if (['failed', 'cancelled', 'expired'].includes(currentRun.status)) {
                log.error(`Run ended with status: ${currentRun.status}`);
                if (currentRun.last_error) {
                    log.error(`Error: ${currentRun.last_error.message}`);
                }
                return false;
            }

            // Handle function calls
            if (currentRun.status === 'requires_action') {
                log.info('Processing function calls...');
                const toolCalls = currentRun.required_action?.submit_tool_outputs?.tool_calls || [];
                const toolOutputs = [];

                for (const call of toolCalls) {
                    if (call.type === 'function') {
                        const name = call.function.name;
                        let args = {};
                        try {
                            args = JSON.parse(call.function.arguments || '{}');
                        } catch (e) { }

                        log.info(`  Calling: ${name}(${JSON.stringify(args)})`);

                        const result = await functionRouter.executeFunction(name, args);
                        toolOutputs.push({
                            tool_call_id: call.id,
                            output: JSON.stringify(result.success ? result.data : { error: result.error })
                        });
                    }
                }

                // Submit outputs - SDK v5: submitToolOutputs(runID, { thread_id, tool_outputs })
                await openai.beta.threads.runs.submitToolOutputs(currentRun.id, {
                    thread_id: testThreadId,
                    tool_outputs: toolOutputs
                });
                log.info('Submitted tool outputs');
            }

            await sleep(1000);
        }

        // 5. Get final run status
        const finalRun = await openai.beta.threads.runs.retrieve(testRunId, { thread_id: testThreadId });

        // Get response if completed
        if (finalRun.status === 'completed') {
            const messages = await openai.beta.threads.messages.list(testThreadId, {
                limit: 1,
                order: 'desc'
            });

            const content = messages.data[0]?.content[0]?.text?.value || '';
            log.success('Response received:');
            console.log('\n' + '-'.repeat(50));
            console.log(content.substring(0, 1000) + (content.length > 1000 ? '...' : ''));
            console.log('-'.repeat(50) + '\n');

            return true;
        }

        return false;

    } catch (err) {
        log.error(`Failed: ${err.message}`);
        console.error(err);
        return false;
    } finally {
        // Cleanup thread
        if (testThreadId) {
            try {
                await openai.beta.threads.del(testThreadId);
                log.info('Cleaned up thread');
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    }
}

// ============================================
// MAIN
// ============================================

async function main() {
    console.log('\n🤖 CHATBOT V2 - ASSISTANT API TEST\n');

    const results = [];

    results.push(await testOpenAI());
    results.push(await testAssistant());
    results.push(await testLocalFunctions());
    results.push(await testFullChat());

    // Summary
    log.section('SUMMARY');
    const passed = results.filter(r => r).length;
    const total = results.length;

    console.log(`\n  Passed: ${passed}/${total}`);

    if (passed === total) {
        log.success('\n🎉 All tests passed! Assistant is ready.\n');
    } else {
        log.error('\n⚠️ Some tests failed. Check errors above.\n');
    }

    process.exit(passed === total ? 0 : 1);
}

main().catch(err => {
    log.error(`Fatal: ${err.message}`);
    process.exit(1);
});
