/**
 * Test Script for Chatbot V2 - OpenAI Assistants API
 * 
 * Script này test các chức năng cơ bản của Assistants API:
 * 1. Kết nối OpenAI
 * 2. Verify Assistant tồn tại
 * 3. Test tạo Thread
 * 4. Test gửi message và nhận response
 * 5. Test function calling
 * 
 * Chạy: node src/tests/test-assistant.js
 */

import openai from '../config/openaiClient.js';
import {
    ASSISTANT_ID,
    ASSISTANT_TOOLS,
    ASSISTANT_RUNTIME_CONFIG
} from '../config/openaiAssistant.js';
import * as chatbotFunctions from '../services/chatbotV2/chatbot-functions.service.js';
import * as functionRouter from '../services/chatbotV2/function-router.service.js';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(`  ${title}`, 'cyan');
    console.log('='.repeat(60));
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// ============================================
// TEST FUNCTIONS
// ============================================

/**
 * Test 1: Kiểm tra kết nối OpenAI
 */
async function testOpenAIConnection() {
    logSection('Test 1: OpenAI Connection');

    try {
        // Thử list models để verify API key
        const models = await openai.models.list();
        logSuccess(`Connected to OpenAI API`);
        logInfo(`Available models: ${models.data.length}`);
        return true;
    } catch (error) {
        logError(`Failed to connect: ${error.message}`);
        return false;
    }
}

/**
 * Test 2: Verify Assistant tồn tại
 */
async function testAssistantExists() {
    logSection('Test 2: Verify Assistant');

    if (!ASSISTANT_ID) {
        logError('ASSISTANT_ID not configured in .env');
        return false;
    }

    logInfo(`Assistant ID: ${ASSISTANT_ID}`);

    try {
        const assistant = await openai.beta.assistants.retrieve(ASSISTANT_ID);
        logSuccess(`Assistant found: "${assistant.name}"`);
        logInfo(`Model: ${assistant.model}`);
        logInfo(`Tools: ${assistant.tools?.length || 0} configured`);

        // Log tool names
        if (assistant.tools?.length > 0) {
            assistant.tools.forEach(tool => {
                if (tool.type === 'function') {
                    logInfo(`  - ${tool.function.name}`);
                }
            });
        }

        return true;
    } catch (error) {
        logError(`Assistant not found: ${error.message}`);
        return false;
    }
}

/**
 * Test 3: Test tạo Thread
 */
async function testCreateThread() {
    logSection('Test 3: Create Thread');

    try {
        const thread = await openai.beta.threads.create({
            metadata: {
                test: 'true',
                created_at: new Date().toISOString()
            }
        });

        logSuccess(`Thread created: ${thread.id}`);
        return thread;
    } catch (error) {
        logError(`Failed to create thread: ${error.message}`);
        return null;
    }
}

/**
 * Test 4: Test gửi message đơn giản (không cần function)
 */
async function testSimpleMessage(thread) {
    logSection('Test 4: Simple Message (No Function)');

    if (!thread) {
        logError('No thread available');
        return false;
    }

    try {
        // Gửi message
        await openai.beta.threads.messages.create(thread.id, {
            role: 'user',
            content: 'Xin chào!'
        });
        logInfo('Message sent: "Xin chào!"');

        // Chạy assistant
        const run = await openai.beta.threads.runs.create(thread.id, {
            assistant_id: ASSISTANT_ID
        });
        logInfo(`Run created: ${run.id}`);

        // Chờ hoàn thành
        const completedRun = await waitForRun(thread.id, run.id);

        if (completedRun.status === 'completed') {
            // Lấy response
            const messages = await openai.beta.threads.messages.list(thread.id, {
                limit: 1,
                order: 'desc'
            });

            const response = messages.data[0];
            const content = response.content[0]?.text?.value || '';

            logSuccess('Response received:');
            console.log('\n' + '-'.repeat(40));
            console.log(content.substring(0, 500) + (content.length > 500 ? '...' : ''));
            console.log('-'.repeat(40) + '\n');

            return true;
        } else {
            logError(`Run failed with status: ${completedRun.status}`);
            return false;
        }
    } catch (error) {
        logError(`Error: ${error.message}`);
        return false;
    }
}

/**
 * Test 5: Test Function Calling (get_menu)
 */
async function testFunctionCalling(thread) {
    logSection('Test 5: Function Calling (get_menu)');

    if (!thread) {
        logError('No thread available');
        return false;
    }

    try {
        // Gửi message yêu cầu xem menu
        await openai.beta.threads.messages.create(thread.id, {
            role: 'user',
            content: 'Cho tôi xem menu có những món gì?'
        });
        logInfo('Message sent: "Cho tôi xem menu có những món gì?"');

        // Chạy assistant
        const run = await openai.beta.threads.runs.create(thread.id, {
            assistant_id: ASSISTANT_ID
        });
        logInfo(`Run created: ${run.id}`);

        // Chờ và xử lý function calls
        const completedRun = await waitForRunWithFunctions(thread.id, run.id);

        if (completedRun.status === 'completed') {
            // Lấy response
            const messages = await openai.beta.threads.messages.list(thread.id, {
                limit: 1,
                order: 'desc'
            });

            const response = messages.data[0];
            const content = response.content[0]?.text?.value || '';

            logSuccess('Response with menu data:');
            console.log('\n' + '-'.repeat(40));
            console.log(content.substring(0, 800) + (content.length > 800 ? '...' : ''));
            console.log('-'.repeat(40) + '\n');

            return true;
        } else {
            logError(`Run failed with status: ${completedRun.status}`);
            if (completedRun.last_error) {
                logError(`Error: ${completedRun.last_error.message}`);
            }
            return false;
        }
    } catch (error) {
        logError(`Error: ${error.message}`);
        return false;
    }
}

/**
 * Test 6: Test local functions (không qua OpenAI)
 */
async function testLocalFunctions() {
    logSection('Test 6: Local Function Implementations');

    try {
        // Test get_categories
        logInfo('Testing get_categories()...');
        const categories = await chatbotFunctions.getCategories();
        logSuccess(`Found ${categories.length} categories`);
        if (categories.length > 0) {
            categories.slice(0, 3).forEach(cat => {
                logInfo(`  - ${cat.name} (${cat.item_count} items)`);
            });
        }

        // Test get_menu
        logInfo('\nTesting get_menu({ limit: 5 })...');
        const menu = await chatbotFunctions.getMenu({ limit: 5 });
        logSuccess(`Found ${menu.length} menu items`);
        if (menu.length > 0) {
            menu.slice(0, 3).forEach(item => {
                logInfo(`  - ${item.name}: ${item.price_formatted}`);
            });
        }

        // Test get_recommendations
        logInfo('\nTesting get_recommendations({ criteria: "popular", limit: 3 })...');
        const recommendations = await chatbotFunctions.getRecommendations({
            criteria: 'popular',
            limit: 3
        });
        logSuccess(`Found ${recommendations.length} recommendations`);
        if (recommendations.length > 0) {
            recommendations.forEach(item => {
                logInfo(`  - ${item.name}: ${item.price_formatted} (${item.recommendation_reason})`);
            });
        }

        return true;
    } catch (error) {
        logError(`Error: ${error.message}`);
        return false;
    }
}

/**
 * Test 7: Cleanup - Xóa test thread
 */
async function testCleanup(thread) {
    logSection('Test 7: Cleanup');

    if (!thread) {
        logInfo('No thread to cleanup');
        return true;
    }

    try {
        await openai.beta.threads.del(thread.id);
        logSuccess(`Deleted test thread: ${thread.id}`);
        return true;
    } catch (error) {
        logError(`Failed to delete thread: ${error.message}`);
        return false;
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Chờ Run hoàn thành (đơn giản, không xử lý functions)
 */
async function waitForRun(threadId, runId, timeout = 30000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        const run = await openai.beta.threads.runs.retrieve(threadId, runId);

        if (['completed', 'failed', 'cancelled', 'expired'].includes(run.status)) {
            return run;
        }

        // Wait 1 second
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Run timeout');
}

/**
 * Chờ Run hoàn thành với xử lý function calls
 */
async function waitForRunWithFunctions(threadId, runId, timeout = 60000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        const run = await openai.beta.threads.runs.retrieve(threadId, runId);

        log(`  Run status: ${run.status}`, 'yellow');

        if (run.status === 'completed') {
            return run;
        }

        if (['failed', 'cancelled', 'expired'].includes(run.status)) {
            return run;
        }

        if (run.status === 'requires_action') {
            logInfo('Processing function calls...');

            const toolCalls = run.required_action?.submit_tool_outputs?.tool_calls || [];
            const toolOutputs = [];

            for (const toolCall of toolCalls) {
                if (toolCall.type === 'function') {
                    const functionName = toolCall.function.name;
                    let args = {};

                    try {
                        args = JSON.parse(toolCall.function.arguments || '{}');
                    } catch (e) {
                        args = {};
                    }

                    logInfo(`  Calling: ${functionName}(${JSON.stringify(args)})`);

                    // Execute function
                    const result = await functionRouter.executeFunction(functionName, args);

                    toolOutputs.push({
                        tool_call_id: toolCall.id,
                        output: JSON.stringify(result.success ? result.data : { error: result.error })
                    });

                    logSuccess(`  Function ${functionName} executed`);
                }
            }

            // Submit outputs
            await openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
                tool_outputs: toolOutputs
            });

            logInfo('Tool outputs submitted');
        }

        // Wait 1 second
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Run timeout');
}

// ============================================
// MAIN
// ============================================

async function runAllTests() {
    console.log('\n');
    log('🤖 CHATBOT V2 - ASSISTANT API TEST', 'magenta');
    log('===================================', 'magenta');
    console.log('\n');

    const results = {
        total: 0,
        passed: 0,
        failed: 0
    };

    let thread = null;

    // Test 1: OpenAI Connection
    results.total++;
    if (await testOpenAIConnection()) {
        results.passed++;
    } else {
        results.failed++;
        logError('\n⚠️  Cannot proceed without OpenAI connection. Exiting...\n');
        process.exit(1);
    }

    // Test 2: Assistant Exists
    results.total++;
    if (await testAssistantExists()) {
        results.passed++;
    } else {
        results.failed++;
        logError('\n⚠️  Assistant not found. Please check OPENAI_ASSISTANT_ID in .env\n');
    }

    // Test 3: Create Thread
    results.total++;
    thread = await testCreateThread();
    if (thread) {
        results.passed++;
    } else {
        results.failed++;
    }

    // Test 4: Simple Message
    results.total++;
    if (await testSimpleMessage(thread)) {
        results.passed++;
    } else {
        results.failed++;
    }

    // Test 5: Function Calling
    results.total++;
    if (await testFunctionCalling(thread)) {
        results.passed++;
    } else {
        results.failed++;
    }

    // Test 6: Local Functions
    results.total++;
    if (await testLocalFunctions()) {
        results.passed++;
    } else {
        results.failed++;
    }

    // Test 7: Cleanup
    results.total++;
    if (await testCleanup(thread)) {
        results.passed++;
    } else {
        results.failed++;
    }

    // Summary
    logSection('TEST SUMMARY');
    console.log('\n');
    log(`  Total Tests: ${results.total}`, 'cyan');
    log(`  Passed: ${results.passed}`, 'green');
    log(`  Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
    console.log('\n');

    if (results.failed === 0) {
        log('🎉 All tests passed! Assistant is working correctly.', 'green');
    } else {
        log('⚠️  Some tests failed. Please check the errors above.', 'yellow');
    }

    console.log('\n');

    process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
    logError(`\nFatal error: ${error.message}`);
    process.exit(1);
});
