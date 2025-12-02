/**
 * Chatbot V2 - OpenAI Assistants API
 * 
 * Module này cung cấp chatbot mới sử dụng OpenAI Assistants API
 * với tính năng tự động quản lý context qua Threads
 * 
 * @module services/chatbotV2
 * 
 * @example
 * // Sử dụng cơ bản
 * import { assistantService } from './services/chatbotV2';
 * 
 * const response = await assistantService.chat('Xin chào', sessionId);
 * console.log(response.message);
 */

// Main assistant service
export * as assistantService from './assistant.service.js';
export { default as assistantServiceDefault } from './assistant.service.js';

// Thread management
export * as threadService from './thread.service.js';
export { default as threadServiceDefault } from './thread.service.js';

// Function implementations
export * as chatbotFunctions from './chatbot-functions.service.js';
export { default as chatbotFunctionsDefault } from './chatbot-functions.service.js';

// Function router
export * as functionRouter from './function-router.service.js';
export { default as functionRouterDefault } from './function-router.service.js';

// Re-export main chat function for convenience
export { chat, getChatHistory, clearConversation, healthCheck } from './assistant.service.js';
