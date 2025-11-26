# 🤖 KẾ HOẠCH CHATBOT AI - ASSISTANTS API (QUY MÔ NHỎ)

## 📋 MỤC LỤC
1. [Tổng quan](#1-tổng-quan)
2. [So sánh với approach cũ](#2-so-sánh-với-approach-cũ)
3. [Kiến trúc hệ thống](#3-kiến-trúc-hệ-thống)
4. [Kế hoạch triển khai](#4-kế-hoạch-triển-khai)
5. [Timeline & Chi phí](#5-timeline--chi-phí)
6. [Code Implementation](#6-code-implementation)

---

## 1. TỔNG QUAN

### 🎯 **Approach: Assistants API + Function Calling + Minimal Logging**

**Tại sao phù hợp cho quy mô nhỏ:**
- ✅ **Đơn giản**: OpenAI quản lý context tự động (threads)
- ✅ **Tiết kiệm**: Chi phí giảm 50% (~$1.5/tháng)
- ✅ **Nhanh**: Deploy trong 3 tuần (thay vì 7 tuần)
- ✅ **Đủ analytics**: Vẫn có dashboard với metadata
- ✅ **Dễ maintain**: Code backend chỉ ~200 lines

### ⚖️ **Trade-offs được chấp nhận:**
- ⚠️ Latency cao hơn ~1s (do polling)
- ⚠️ Không lưu full chat transcript trong DB (nhưng có thể query từ OpenAI)
- ✅ Với quy mô nhỏ, đây là trade-offs hợp lý

---

## 2. SO SÁNH VỚI APPROACH CŨ

| Tiêu chí | Chat Completions<br/>(Hiện tại) | Hybrid Plan<br/>(Plan gốc) | **Assistants API**<br/>**(Đề xuất)** |
|----------|--------------------------------|----------------------------|--------------------------------------|
| **Complexity** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Context Management** | Manual (frontend) | Manual (backend DB) | **Auto (OpenAI threads)** |
| **Cost/tháng** | $4.5 | $3 | **$1.5** ✅ |
| **Dev Time** | Current | 7 tuần | **3 tuần** ✅ |
| **Analytics** | ❌ None | ⭐⭐⭐⭐⭐ Full | **⭐⭐⭐⭐ Sufficient** |
| **Real-time Data** | ❌ Menu only | ✅ Function calling | **✅ Function calling** |
| **Maintenance** | Trung bình | Cao | **Thấp** ✅ |
| **Scale** | 50 users | 500 users | **200 users** ✅ |
| **Phù hợp quy mô nhỏ** | ⚠️ OK | ❌ Overkill | **✅✅✅ Perfect** |

### 💰 **Chi phí chi tiết:**

**Ước tính với 1000 messages/tháng:**

| Approach | Input Tokens | Output Tokens | Cost/tháng |
|----------|-------------|---------------|------------|
| Chat Completions (cũ) | 500k (menu + history) | 100k | **$4.50** |
| Hybrid Plan | 300k (optimized) | 100k | **$3.00** |
| **Assistants API** | **150k** (chỉ message) | 100k | **$1.50** ✅ |

**Tiết kiệm: 67% so với hiện tại!**

---

## 3. KIẾN TRÚC HỆ THỐNG

### 🏗️ **Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  ChatbotsCus.js                                        │    │
│  │  - Chat UI (existing)                                  │    │
│  │  - Store thread_id in localStorage                     │    │
│  │  - Send: { message, thread_id, session_id }           │    │
│  │  - Receive: Rich content response                      │    │
│  └────────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────────┘
                         │ POST /chatbot
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Express.js)                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  chatbot.controller.js                                 │    │
│  │  1. Validate input                                     │    │
│  │  2. Get session info from DB                           │    │
│  │  3. Call assistantService.reply()                      │    │
│  │  4. Log metadata (optional)                            │    │
│  │  5. Return rich content                                │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                          │
│  ┌────────────────────▼───────────────────────────────────┐    │
│  │  assistantService.js (NEW)                             │    │
│  │                                                         │    │
│  │  A. Thread Management:                                 │    │
│  │     - Get existing thread_id OR create new             │    │
│  │     - Store thread_id mapping (session -> thread)      │    │
│  │                                                         │    │
│  │  B. Message Handling:                                  │    │
│  │     - Add user message to thread                       │    │
│  │     - Run assistant                                    │    │
│  │     - Poll for completion (max 30s)                    │    │
│  │                                                         │    │
│  │  C. Function Calling:                                  │    │
│  │     - Detect required_action status                    │    │
│  │     - Execute functions                                │    │
│  │     - Submit tool outputs                              │    │
│  │     - Continue polling                                 │    │
│  │                                                         │    │
│  │  D. Response Parsing:                                  │    │
│  │     - Get messages from thread                         │    │
│  │     - Parse rich content                               │    │
│  │     - Map menu items from DB                           │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                          │
│  ┌────────────────────▼───────────────────────────────────┐    │
│  │  OpenAI Assistants API                                 │    │
│  │                                                         │    │
│  │  • Threads: Auto context management                    │    │
│  │  • Messages: Persistent history                        │    │
│  │  • Runs: Execute assistant with polling                │    │
│  │  • Tools: Function calling enabled                     │    │
│  │  • Model: gpt-4o-mini                                  │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                          │
│  ┌────────────────────▼───────────────────────────────────┐    │
│  │  chatbotFunctions.service.js                           │    │
│  │                                                         │    │
│  │  Functions:                                            │    │
│  │  • search_menu(category, price_range, is_spicy)       │    │
│  │  • check_table_availability(people, date, time)       │    │
│  │  • get_promotions(active_only)                        │    │
│  │  • check_order_status(session_id)                     │    │
│  │  • get_restaurant_info(info_type)                     │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                          │
│  ┌────────────────────▼───────────────────────────────────┐    │
│  │  Lightweight Logging (Optional)                        │    │
│  │                                                         │    │
│  │  INSERT INTO chat_sessions (                           │    │
│  │    thread_id, session_id, message_count,               │    │
│  │    function_calls_count, last_active                   │    │
│  │  )                                                     │    │
│  └─────────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DATABASE (MySQL - Minimal)                     │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ chat_sessions    │  │ function_logs    │  │ menu_items   │  │
│  │ ────────────     │  │ ────────────     │  │ ──────────   │  │
│  │ id (PK)          │  │ id (PK)          │  │ id           │  │
│  │ thread_id        │  │ function_name    │  │ name         │  │
│  │ session_id (FK)  │  │ call_count       │  │ price        │  │
│  │ assistant_id     │  │ avg_exec_time    │  │ category     │  │
│  │ message_count    │  │ success_rate     │  │ is_available │  │
│  │ function_calls   │  │ date             │  │ ...          │  │
│  │ created_at       │  │ created_at       │  │              │  │
│  │ last_active      │  │                  │  │              │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ qr_sessions      │  │ orders           │                    │
│  │ (existing)       │  │ (existing)       │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

### 🔄 **Flow hoạt động:**

```
1. User nhập: "Tìm món cay dưới 100k"
   ↓
2. Frontend gửi: 
   POST /chatbot
   { 
     message: "Tìm món cay dưới 100k",
     thread_id: "thread_abc123" (nếu có),
     session_id: 456
   }
   ↓
3. Backend:
   a. Load/Create thread
   b. Add message to thread
   c. Run assistant
   ↓
4. OpenAI Assistants API:
   a. Analyze message
   b. Decide: Need function calling?
   c. Status: "requires_action"
   ↓
5. Backend detects requires_action:
   a. Parse function call: search_menu({ is_spicy: true, max_price: 100000 })
   b. Execute function → Query DB
   c. Submit tool outputs to OpenAI
   ↓
6. OpenAI continues:
   a. Process function results
   b. Generate response with suggestions
   c. Status: "completed"
   ↓
7. Backend:
   a. Get messages from thread
   b. Parse latest assistant message
   c. Map menu items from DB
   d. Format rich content
   ↓
8. Return to Frontend:
   {
     response_type: "rich_content",
     contents: [
       { type: "text", value: "Mình tìm được mấy món cay ngon..." },
       { type: "menu_items", items: [...] }
     ],
     thread_id: "thread_abc123"
   }
   ↓
9. Frontend renders rich content
```

---

## 4. KẾ HOẠCH TRIỂN KHAI

### 📅 **WEEK 1: Setup Assistants API + Functions**

#### **Day 1-2: Assistant Setup**

**File:** `backend/src/config/assistantSetup.js`

```javascript
import openai from "./openaiClient.js";

/**
 * Create or get assistant
 * Run once during setup
 */
export async function setupAssistant() {
  // Check if assistant exists
  const assistantId = process.env.OPENAI_ASSISTANT_ID;
  
  if (assistantId) {
    try {
      const assistant = await openai.beta.assistants.retrieve(assistantId);
      console.log('✅ Using existing assistant:', assistant.id);
      return assistant;
    } catch (error) {
      console.log('⚠️ Assistant not found, creating new...');
    }
  }

  // Create new assistant
  const assistant = await openai.beta.assistants.create({
    name: "Restaurant AI Assistant",
    instructions: `
Bạn là trợ lý AI thông minh của nhà hàng.

🎯 Nhiệm vụ:
- Tư vấn món ăn, khuyến mãi, đặt bàn
- Sử dụng functions để lấy dữ liệu real-time
- Trả lời thân thiện, chuyên nghiệp, ngắn gọn

📋 Quy tắc trả lời:
1. LUÔN trả về JSON format với structure:
   {
     "intro": "Câu trả lời chính (1-2 câu)",
     "suggestions": [{"name": "Tên món chính xác", "reason": "Lý do gợi ý"}],
     "actions": [{"label": "Text nút", "action": "navigate", "data": "/path"}]
   }

2. Khi cần tìm món ăn → GỌI search_menu function
3. Khi khách hỏi bàn trống → GỌI check_table_availability
4. Khi khách hỏi khuyến mãi → GỌI get_promotions
5. Khi khách hỏi đơn hàng → GỌI check_order_status

⚠️ QUAN TRỌNG: CHỈ gợi ý món có trong kết quả function, KHÔNG bịa tên món.
    `,
    model: "gpt-4o-mini",
    tools: [], // Will be set later with functions
    response_format: { type: "json_object" }
  });

  console.log('✅ Created new assistant:', assistant.id);
  console.log('📝 Add to .env: OPENAI_ASSISTANT_ID=' + assistant.id);
  
  return assistant;
}

/**
 * Update assistant with functions
 */
export async function updateAssistantFunctions(functions) {
  const assistantId = process.env.OPENAI_ASSISTANT_ID;
  
  const assistant = await openai.beta.assistants.update(assistantId, {
    tools: functions
  });

  console.log('✅ Updated assistant with', functions.length, 'functions');
  return assistant;
}
```

**Tasks:**
- [ ] Tạo file `assistantSetup.js`
- [ ] Chạy setup script một lần
- [ ] Lưu `OPENAI_ASSISTANT_ID` vào `.env`
- [ ] Verify assistant trên OpenAI dashboard

---

#### **Day 3-4: Function Definitions**

**File:** `backend/src/services/chatbotFunctions.service.js`

```javascript
import { query } from "../config/db.js";

/**
 * Function definitions for OpenAI
 */
export const CHATBOT_FUNCTIONS = [
  {
    type: "function",
    function: {
      name: "search_menu",
      description: "Tìm kiếm món ăn theo tiêu chí cụ thể (giá, loại, độ cay, có sẵn). LUÔN gọi function này khi khách hỏi về món ăn.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: ["appetizer", "main", "drink", "dessert", "all"],
            description: "Loại món ăn"
          },
          min_price: {
            type: "number",
            description: "Giá tối thiểu (VNĐ)"
          },
          max_price: {
            type: "number",
            description: "Giá tối đa (VNĐ)"
          },
          is_spicy: {
            type: "boolean",
            description: "true = món cay, false = món không cay, null = cả hai"
          },
          keyword: {
            type: "string",
            description: "Từ khóa tìm kiếm trong tên món"
          },
          limit: {
            type: "number",
            description: "Số lượng món trả về (1-10)",
            default: 5
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_table_availability",
      description: "Kiểm tra bàn trống theo số người và thời gian",
      parameters: {
        type: "object",
        properties: {
          people_count: {
            type: "number",
            description: "Số người (2-20)",
            minimum: 2,
            maximum: 20
          },
          date: {
            type: "string",
            description: "Ngày đặt bàn (YYYY-MM-DD), nếu không có thì hôm nay"
          },
          time: {
            type: "string",
            description: "Giờ đặt bàn (HH:MM), nếu không có thì hiện tại"
          }
        },
        required: ["people_count"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_promotions",
      description: "Lấy danh sách khuyến mãi đang có",
      parameters: {
        type: "object",
        properties: {
          active_only: {
            type: "boolean",
            description: "true = chỉ khuyến mãi đang chạy, false = tất cả",
            default: true
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_order_status",
      description: "Kiểm tra trạng thái đơn hàng hiện tại của khách",
      parameters: {
        type: "object",
        properties: {
          session_id: {
            type: "number",
            description: "ID phiên của khách hàng (lấy từ context)"
          }
        },
        required: ["session_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_restaurant_info",
      description: "Lấy thông tin nhà hàng (giờ mở cửa, địa chỉ, liên hệ)",
      parameters: {
        type: "object",
        properties: {
          info_type: {
            type: "string",
            enum: ["hours", "address", "contact", "all"],
            description: "Loại thông tin cần lấy"
          }
        }
      }
    }
  }
];

/**
 * Execute function by name
 */
export async function executeFunction(functionName, args) {
  const startTime = Date.now();
  
  try {
    let result;

    switch (functionName) {
      case 'search_menu':
        result = await searchMenu(args);
        break;
      
      case 'check_table_availability':
        result = await checkTableAvailability(args);
        break;
      
      case 'get_promotions':
        result = await getPromotions(args);
        break;
      
      case 'check_order_status':
        result = await checkOrderStatus(args);
        break;
      
      case 'get_restaurant_info':
        result = await getRestaurantInfo(args);
        break;
      
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }

    return {
      success: true,
      data: result,
      execution_time: Date.now() - startTime
    };

  } catch (error) {
    console.error(`Function ${functionName} error:`, error);
    return {
      success: false,
      error: error.message,
      execution_time: Date.now() - startTime
    };
  }
}

// ============================================
// Function Implementations
// ============================================

async function searchMenu({ 
  category = 'all', 
  min_price = 0, 
  max_price = 999999999, 
  is_spicy = null,
  keyword = null,
  limit = 5 
}) {
  let sql = `
    SELECT id, name, price, description, category, image_url, is_spicy 
    FROM menu_items 
    WHERE is_available = 1 AND price BETWEEN ? AND ?
  `;
  
  const params = [min_price, max_price];

  if (category !== 'all') {
    sql += ` AND category = ?`;
    params.push(category);
  }

  if (is_spicy !== null) {
    sql += ` AND is_spicy = ?`;
    params.push(is_spicy ? 1 : 0);
  }

  if (keyword) {
    sql += ` AND name LIKE ?`;
    params.push(`%${keyword}%`);
  }

  sql += ` ORDER BY RAND() LIMIT ?`;
  params.push(limit);

  const items = await query(sql, params);
  
  return {
    total: items.length,
    filters: { category, min_price, max_price, is_spicy, keyword },
    items: items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      description: item.description,
      category: item.category,
      is_spicy: Boolean(item.is_spicy)
    }))
  };
}

async function checkTableAvailability({ people_count, date, time }) {
  const checkDate = date || new Date().toISOString().split('T')[0];
  const checkTime = time || new Date().toTimeString().split(' ')[0].substring(0, 5);

  const tables = await query(
    `SELECT t.id, t.table_number, t.capacity, t.status 
     FROM tables t 
     WHERE t.capacity >= ? AND t.status = 'AVAILABLE'
     ORDER BY t.capacity ASC 
     LIMIT 5`,
    [people_count]
  );

  return {
    requested: { people_count, date: checkDate, time: checkTime },
    available_count: tables.length,
    tables: tables.map(t => ({
      table_id: t.id,
      table_number: t.table_number,
      capacity: t.capacity
    }))
  };
}

async function getPromotions({ active_only = true }) {
  // TODO: Thay bằng query thật từ DB
  return {
    active_only,
    promotions: [
      {
        id: 1,
        name: "Giảm 20% combo gia đình",
        description: "Áp dụng cho hóa đơn từ 500.000đ",
        discount_percent: 20,
        min_order: 500000,
        valid_until: "2025-12-31"
      }
    ]
  };
}

async function checkOrderStatus({ session_id }) {
  const orders = await query(
    `SELECT o.id, o.status, o.total_price, o.created_at,
            COUNT(oi.id) as item_count
     FROM orders o
     LEFT JOIN order_items oi ON o.id = oi.order_id
     WHERE o.qr_session_id = ?
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [session_id]
  );

  return {
    session_id,
    order_count: orders.length,
    orders: orders.map(o => ({
      order_id: o.id,
      status: o.status,
      total_price: o.total_price,
      item_count: o.item_count,
      ordered_at: o.created_at
    }))
  };
}

async function getRestaurantInfo({ info_type = 'all' }) {
  const info = {
    hours: {
      weekday: "10:00 - 22:00",
      weekend: "09:00 - 23:00",
      closed: "Thứ 2 (nghỉ)"
    },
    address: {
      street: "123 Đường ABC",
      district: "Quận XYZ",
      city: "TP. Hồ Chí Minh"
    },
    contact: {
      phone: "0123-456-789",
      email: "contact@restaurant.com",
      facebook: "facebook.com/restaurant"
    }
  };

  if (info_type === 'all') return info;
  return { [info_type]: info[info_type] };
}
```

**Tasks:**
- [ ] Implement tất cả 5 functions
- [ ] Test từng function riêng lẻ
- [ ] Update assistant với functions (gọi `updateAssistantFunctions()`)
- [ ] Verify trên OpenAI dashboard

---

#### **Day 5-7: Core Assistants Service**

**File:** `backend/src/services/assistants.service.js`

```javascript
import openai from "../config/openaiClient.js";
import { query } from "../config/db.js";
import { executeFunction } from "./chatbotFunctions.service.js";

/**
 * Get or create thread for session
 */
export async function getOrCreateThread(sessionId) {
  try {
    // Check if session already has thread_id
    const [sessions] = await query(
      `SELECT thread_id FROM chat_sessions WHERE session_id = ? LIMIT 1`,
      [sessionId]
    );

    if (sessions && sessions.length > 0 && sessions[0].thread_id) {
      return sessions[0].thread_id;
    }

    // Create new thread
    const thread = await openai.beta.threads.create();
    
    // Save to DB
    await query(
      `INSERT INTO chat_sessions (thread_id, session_id, assistant_id, message_count, created_at, last_active)
       VALUES (?, ?, ?, 0, NOW(), NOW())
       ON DUPLICATE KEY UPDATE thread_id = ?, last_active = NOW()`,
      [thread.id, sessionId, process.env.OPENAI_ASSISTANT_ID, thread.id]
    );

    console.log('✅ Created new thread:', thread.id, 'for session:', sessionId);
    return thread.id;

  } catch (error) {
    console.error('Error in getOrCreateThread:', error);
    throw error;
  }
}

/**
 * Main reply function using Assistants API
 */
export async function reply(message, sessionId, threadId = null) {
  const startTime = Date.now();
  
  try {
    // 1. Get or create thread
    const activeThreadId = threadId || await getOrCreateThread(sessionId);

    // 2. Add user message to thread
    await openai.beta.threads.messages.create(activeThreadId, {
      role: "user",
      content: message
    });

    console.log('📝 Added message to thread:', activeThreadId);

    // 3. Run assistant
    let run = await openai.beta.threads.runs.create(activeThreadId, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID
    });

    console.log('🏃 Started run:', run.id);

    // 4. Poll for completion
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max
    let functionCallsCount = 0;

    while (run.status !== 'completed' && run.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
      
      run = await openai.beta.threads.runs.retrieve(activeThreadId, run.id);
      attempts++;

      console.log(`⏳ Poll attempt ${attempts}: status = ${run.status}`);

      // Handle function calling
      if (run.status === 'requires_action') {
        const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
        
        console.log('🔧 Function calls required:', toolCalls.length);
        functionCallsCount += toolCalls.length;

        // Execute all functions
        const toolOutputs = await Promise.all(
          toolCalls.map(async (toolCall) => {
            const functionName = toolCall.function.name;
            const args = JSON.parse(toolCall.function.arguments);

            console.log(`  → Executing: ${functionName}`, args);

            const result = await executeFunction(functionName, args);

            // Log to DB (optional)
            try {
              await query(
                `INSERT INTO function_logs (function_name, call_count, avg_exec_time, date)
                 VALUES (?, 1, ?, CURDATE())
                 ON DUPLICATE KEY UPDATE 
                   call_count = call_count + 1,
                   avg_exec_time = (avg_exec_time + ?) / 2`,
                [functionName, result.execution_time, result.execution_time]
              );
            } catch (logError) {
              console.error('Failed to log function call:', logError);
            }

            return {
              tool_call_id: toolCall.id,
              output: JSON.stringify(result.data)
            };
          })
        );

        // Submit tool outputs
        run = await openai.beta.threads.runs.submitToolOutputs(
          activeThreadId,
          run.id,
          { tool_outputs: toolOutputs }
        );

        console.log('✅ Submitted tool outputs, continuing run...');
      }

      // Handle other statuses
      if (run.status === 'failed') {
        throw new Error(`Run failed: ${run.last_error?.message || 'Unknown error'}`);
      }

      if (run.status === 'cancelled') {
        throw new Error('Run was cancelled');
      }

      if (run.status === 'expired') {
        throw new Error('Run expired (took too long)');
      }
    }

    if (attempts >= maxAttempts) {
      throw new Error('Run timed out after 30 seconds');
    }

    // 5. Get messages from thread
    const messages = await openai.beta.threads.messages.list(activeThreadId, {
      order: 'desc',
      limit: 1
    });

    const assistantMessage = messages.data[0];
    
    if (!assistantMessage || assistantMessage.role !== 'assistant') {
      throw new Error('No assistant response found');
    }

    // 6. Extract text content
    const textContent = assistantMessage.content.find(c => c.type === 'text');
    
    if (!textContent) {
      throw new Error('No text content in response');
    }

    const responseText = textContent.text.value;

    // 7. Parse JSON response
    let gptResponse;
    try {
      gptResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.warn('Failed to parse JSON, using raw text:', parseError);
      gptResponse = { intro: responseText, suggestions: [] };
    }

    // 8. Update session metadata
    const responseTime = Date.now() - startTime;
    await query(
      `UPDATE chat_sessions 
       SET message_count = message_count + 1,
           function_calls = function_calls + ?,
           last_active = NOW()
       WHERE session_id = ?`,
      [functionCallsCount, sessionId]
    );

    console.log(`✅ Completed in ${responseTime}ms with ${functionCallsCount} function calls`);

    // 9. Get menu items for mapping (if suggestions exist)
    const menuItems = gptResponse.suggestions?.length > 0 
      ? await query(`SELECT id, name, price, description, image_url FROM menu_items WHERE is_available = 1`)
      : [];

    // 10. Parse and return rich content
    return parseRichContentResponse(gptResponse, menuItems, message, activeThreadId);

  } catch (error) {
    console.error('Assistants API error:', error);
    
    // Fallback response
    return {
      message: message,
      type: "text",
      suggestion: "Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau! 🙏",
      thread_id: threadId
    };
  }
}

/**
 * Parse rich content response
 */
function parseRichContentResponse(gptResponse, menuItems, originalMessage, threadId) {
  const contents = [];

  // 1. Text content
  if (gptResponse.intro || gptResponse.text) {
    const text = gptResponse.intro || gptResponse.text;
    
    contents.push({
      type: 'text',
      value: text
    });
  }

  // 2. Suggested menu items
  const suggestedItems = (gptResponse.suggestions || [])
    .map((suggestion) => {
      const foundItem = menuItems.find(
        (item) => item.name.toLowerCase() === suggestion.name.toLowerCase()
      );

      if (foundItem) {
        return {
          id: foundItem.id,
          name: foundItem.name,
          price: foundItem.price,
          description: foundItem.description,
          image_url: foundItem.image_url || "https://via.placeholder.com/150?text=No+Image",
          reason: suggestion.reason,
        };
      }
      return null;
    })
    .filter(Boolean);

  if (suggestedItems.length > 0) {
    contents.push({
      type: 'menu_items',
      items: suggestedItems
    });
  }

  // 3. Action buttons
  if (gptResponse.actions && Array.isArray(gptResponse.actions)) {
    contents.push({
      type: 'actions',
      buttons: gptResponse.actions
    });
  }

  // Return unified response
  return {
    message: originalMessage,
    response_type: 'rich_content',
    contents: contents,
    thread_id: threadId,
    // Legacy support
    type: suggestedItems.length > 0 ? 'suggestions' : 'text',
    intro: gptResponse.intro,
    suggestions: suggestedItems
  };
}
```

**Tasks:**
- [ ] Implement thread management
- [ ] Implement polling logic với timeout
- [ ] Implement function calling handler
- [ ] Test với multiple function calls
- [ ] Add error handling và logging

---

### 📅 **WEEK 2: Integration & Testing**

#### **Day 8-9: Update Controller**

**File:** `backend/src/controllers/chatbot.controller.js`

```javascript
import * as assistantsService from "../services/assistants.service.js";

export async function chatWithBot(req, res) {
  try {
    const { message, thread_id, session_id } = req.body;
    
    // Validate
    if (!message || !session_id) {
      return res.status(400).json({ 
        status: 400, 
        message: "Thiếu thông tin message hoặc session_id" 
      });
    }

    // Call assistants service
    const result = await assistantsService.reply(message, session_id, thread_id);
    
    res.status(200).json({ status: 200, data: result });
    
  } catch (err) {
    console.error("chatWithBot error:", err);
    res.status(500).json({ 
      status: 500, 
      message: "Internal server error",
      error: err.message 
    });
  }
}
```

**Tasks:**
- [ ] Update controller để nhận `thread_id`
- [ ] Add validation
- [ ] Test API endpoint

---

#### **Day 10-11: Update Frontend**

**File:** `frontend/src/page/cus/ChatbotsCus.js`

```javascript
// Add state for thread_id
const [threadId, setThreadId] = useState(() => {
  try {
    const saved = sessionStorage.getItem('chatbot_thread_id');
    return saved || null;
  } catch {
    return null;
  }
});

// Update handleSend function
const handleSend = async (text = input) => {
  const messageText = text.trim();
  if (!messageText) return;

  // Get session_id
  const sessionData = localStorage.getItem('qr_session');
  const session = sessionData ? JSON.parse(sessionData) : null;
  const sessionId = session?.id || session?.session_id;

  if (!sessionId) {
    message.error('Không tìm thấy phiên làm việc!');
    return;
  }

  // Add user message
  const userMessage = { from: "user", type: "text", text: messageText };
  setMessages((prev) => [...prev, userMessage]);
  setInput("");
  setLoading(true);

  try {
    // Call API with thread_id
    const response = await axios.post(`${REACT_APP_API_URL}/chatbot`, {
      message: messageText,
      thread_id: threadId,  // ⭐ Include thread_id
      session_id: sessionId
    });

    const botResponse = response.data.data;

    // Save thread_id if returned
    if (botResponse.thread_id && !threadId) {
      setThreadId(botResponse.thread_id);
      sessionStorage.setItem('chatbot_thread_id', botResponse.thread_id);
    }

    // Handle response (existing code)
    if (botResponse.response_type === 'rich_content') {
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          type: "rich_content",
          contents: botResponse.contents,
        },
      ]);
    }
    // ... rest of handling code

  } catch (error) {
    console.error("Chatbot error:", error);
    // ... error handling
  } finally {
    setLoading(false);
  }
};

// Update handleClearChat to also clear thread
const handleClearChat = () => {
  sessionStorage.removeItem("chatbot_messages");
  sessionStorage.removeItem("chatbot_thread_id"); // ⭐ Clear thread
  setThreadId(null);
  setMessages([welcomeMessage]);
};
```

**Tasks:**
- [ ] Add `thread_id` state
- [ ] Update API call to include `thread_id`
- [ ] Save `thread_id` to sessionStorage
- [ ] Clear `thread_id` when clearing chat
- [ ] Test full flow

---

#### **Day 12-14: Database Schema & Testing**

**File:** `database/SQL_assistants_chatbot.sql`

```sql
-- ============================================
-- Assistants API Chatbot Schema
-- ============================================

-- Bảng lưu mapping session -> thread
CREATE TABLE IF NOT EXISTS chat_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    thread_id VARCHAR(255) NOT NULL UNIQUE,
    session_id BIGINT NOT NULL,
    assistant_id VARCHAR(255) NOT NULL,
    message_count INT DEFAULT 0,
    function_calls INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (session_id) REFERENCES qr_sessions(id) ON DELETE CASCADE,
    INDEX idx_session (session_id),
    INDEX idx_thread (thread_id),
    INDEX idx_last_active (last_active)
);

-- Bảng log function usage (cho analytics)
CREATE TABLE IF NOT EXISTS function_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    function_name VARCHAR(100) NOT NULL,
    call_count INT DEFAULT 1,
    avg_exec_time INT DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 100.00,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_function_date (function_name, date),
    INDEX idx_date (date),
    INDEX idx_function (function_name)
);

-- View cho dashboard analytics
CREATE OR REPLACE VIEW chatbot_daily_stats AS
SELECT 
    DATE(cs.last_active) as date,
    COUNT(DISTINCT cs.id) as total_conversations,
    SUM(cs.message_count) as total_messages,
    AVG(cs.message_count) as avg_messages_per_conversation,
    SUM(cs.function_calls) as total_function_calls,
    COUNT(DISTINCT cs.session_id) as unique_users
FROM chat_sessions cs
GROUP BY DATE(cs.last_active)
ORDER BY date DESC;

-- Insert sample data for testing
-- INSERT INTO chat_sessions (thread_id, session_id, assistant_id, message_count, function_calls)
-- VALUES ('thread_test_123', 1, 'asst_test', 5, 2);
```

**Testing Checklist:**
```
✅ Unit Tests:
  - [ ] search_menu function với nhiều filters
  - [ ] check_table_availability với edge cases
  - [ ] Thread creation và retrieval
  - [ ] Function calling execution

✅ Integration Tests:
  - [ ] Full conversation flow
  - [ ] Multiple function calls trong 1 request
  - [ ] Thread persistence across requests
  - [ ] Error handling và fallback

✅ Performance Tests:
  - [ ] Response time < 3s (95th percentile)
  - [ ] Concurrent users (10 users cùng lúc)
  - [ ] Database query performance

✅ User Acceptance Tests:
  - [ ] Test với real users (5-10 người)
  - [ ] Collect feedback
  - [ ] Fix critical bugs
```

**Tasks:**
- [ ] Chạy migration script
- [ ] Viết và chạy tests
- [ ] Fix bugs
- [ ] Optimize performance

---

### 📅 **WEEK 3: Analytics Dashboard & Deployment**

#### **Day 15-17: Analytics API**

**File:** `backend/src/services/chatbotAnalytics.service.js`

```javascript
import { query } from "../config/db.js";

/**
 * Get daily chatbot stats
 */
export async function getDailyStats(startDate, endDate) {
  const stats = await query(
    `SELECT * FROM chatbot_daily_stats
     WHERE date BETWEEN ? AND ?
     ORDER BY date DESC`,
    [startDate, endDate]
  );

  return stats;
}

/**
 * Get function usage statistics
 */
export async function getFunctionStats(days = 7) {
  const stats = await query(
    `SELECT 
      function_name,
      SUM(call_count) as total_calls,
      AVG(avg_exec_time) as avg_execution_time,
      AVG(success_rate) as success_rate
     FROM function_logs
     WHERE date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY function_name
     ORDER BY total_calls DESC`,
    [days]
  );

  return stats;
}

/**
 * Get overall metrics
 */
export async function getOverallMetrics() {
  const [metrics] = await query(`
    SELECT 
      COUNT(*) as total_conversations,
      SUM(message_count) as total_messages,
      AVG(message_count) as avg_messages_per_conversation,
      SUM(function_calls) as total_function_calls,
      COUNT(DISTINCT session_id) as unique_users
    FROM chat_sessions
  `);

  return metrics[0] || {};
}
```

**File:** `backend/src/controllers/analytics.controller.js`

```javascript
import * as analyticsService from "../services/chatbotAnalytics.service.js";

export async function getChatbotAnalytics(req, res) {
  try {
    const { start_date, end_date, days = 7 } = req.query;

    const [dailyStats, functionStats, overallMetrics] = await Promise.all([
      analyticsService.getDailyStats(
        start_date || new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date || new Date().toISOString().split('T')[0]
      ),
      analyticsService.getFunctionStats(days),
      analyticsService.getOverallMetrics()
    ]);

    res.status(200).json({
      status: 200,
      data: {
        overall: overallMetrics,
        daily: dailyStats,
        functions: functionStats
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ status: 500, message: error.message });
  }
}
```

**Tasks:**
- [ ] Implement analytics service
- [ ] Create API endpoints
- [ ] Test với real data

---

#### **Day 18-19: Update Dashboard**

**File:** `frontend/src/page/management/Main/ReportsChatbots.js`

```javascript
// Replace mock data with real API calls
const [loading, setLoading] = useState(true);
const [analytics, setAnalytics] = useState(null);

useEffect(() => {
  fetchAnalytics();
}, []);

const fetchAnalytics = async () => {
  try {
    setLoading(true);
    const response = await axios.get(`${REACT_APP_API_URL}/analytics/chatbot?days=30`);
    setAnalytics(response.data.data);
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    message.error('Không thể tải dữ liệu báo cáo');
  } finally {
    setLoading(false);
  }
};

// Use real data for stats
const stats = analytics ? [
  { 
    title: "Tổng cuộc hội thoại", 
    value: analytics.overall.total_conversations, 
    icon: <MessageOutlined />, 
    color: "#1677ff" 
  },
  { 
    title: "Tin nhắn TB/cuộc", 
    value: analytics.overall.avg_messages_per_conversation.toFixed(1), 
    icon: <RobotOutlined />, 
    color: "#722ed1" 
  },
  // ...
] : [];
```

**Tasks:**
- [ ] Connect dashboard to real API
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test visualization

---

#### **Day 20-21: Deployment**

**Deployment Checklist:**

```markdown
## Pre-deployment
- [ ] Run all tests (unit + integration)
- [ ] Database migration script ready
- [ ] Environment variables configured (.env)
  - OPENAI_API_KEY
  - OPENAI_ASSISTANT_ID
- [ ] Backup current database
- [ ] Create rollback plan

## Deployment Steps
1. [ ] Deploy database changes
   ```bash
   mysql -u user -p database < SQL_assistants_chatbot.sql
   ```

2. [ ] Deploy backend code
   ```bash
   cd backend
   git pull
   npm install
   pm2 restart backend
   ```

3. [ ] Deploy frontend code
   ```bash
   cd frontend
   git pull
   npm install
   npm run build
   pm2 restart frontend
   ```

4. [ ] Run assistant setup (one-time)
   ```bash
   node scripts/setupAssistant.js
   ```

5. [ ] Verify deployment
   - [ ] Test chatbot endpoint
   - [ ] Test function calling
   - [ ] Check dashboard
   - [ ] Monitor logs

## Post-deployment
- [ ] Monitor error logs (first 24h)
- [ ] Check OpenAI usage dashboard
- [ ] Verify metrics collection
- [ ] Gather user feedback
- [ ] Document any issues
```

**Monitoring Setup:**

```javascript
// Add to backend/src/middleware/monitoring.js
export function monitorChatbot(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log slow requests (>5s)
    if (duration > 5000) {
      console.warn('⚠️ Slow chatbot response:', {
        duration: duration,
        path: req.path,
        body: req.body
      });
    }
  });
  
  next();
}
```

**Tasks:**
- [ ] Setup monitoring
- [ ] Deploy to production
- [ ] Verify all features
- [ ] Monitor first 24h

---

## 5. TIMELINE & CHI PHÍ

### 📅 **Gantt Chart**

```
Tuần 1: [████████████] Setup & Functions
  Day 1-2:   Assistant setup
  Day 3-4:   Function definitions
  Day 5-7:   Core service implementation

Tuần 2: [████████████] Integration & Testing  
  Day 8-9:   Controller update
  Day 10-11: Frontend integration
  Day 12-14: Testing & bug fixes

Tuần 3: [████████████] Analytics & Deploy
  Day 15-17: Analytics API
  Day 18-19: Dashboard update
  Day 20-21: Deployment & monitoring
```

### 💰 **Chi phí ước tính**

**Development:**
- 1 Full-stack Developer × 3 tuần = ~$1,500-2,000 (nếu thuê ngoài)
- Hoặc: Developer nội bộ (chi phí cố định)

**Operational (hàng tháng):**
- OpenAI API: ~$1.50 (ước tính 1000 messages/tháng)
- Database storage: Minimal (~$0)
- Server: Existing infrastructure

**Total investment:**
- One-time: $1,500-2,000 (dev cost)
- Monthly: ~$1.50 (operational)

**ROI:**
- Tiết kiệm 67% chi phí API so với hiện tại
- Giảm workload cho staff (tự động trả lời)
- Tăng customer satisfaction
- Data insights từ analytics

---

## 6. CODE IMPLEMENTATION

### 📝 **File Structure**

```
backend/src/
├── config/
│   ├── openaiClient.js (existing)
│   └── assistantSetup.js (NEW)
├── services/
│   ├── assistants.service.js (NEW - main logic)
│   ├── chatbotFunctions.service.js (NEW - functions)
│   ├── chatbotAnalytics.service.js (NEW - analytics)
│   └── chatbot.service.js (OLD - can deprecate later)
├── controllers/
│   ├── chatbot.controller.js (UPDATE)
│   └── analytics.controller.js (NEW)
└── routes/
    ├── chatbot.routes.js (existing)
    └── analytics.routes.js (NEW)

database/
└── SQL_assistants_chatbot.sql (NEW)

frontend/src/
└── page/
    ├── cus/
    │   └── ChatbotsCus.js (UPDATE - add thread_id)
    └── management/Main/
        └── ReportsChatbots.js (UPDATE - real data)
```

### 🔑 **Environment Variables**

```bash
# .env (backend)

# OpenAI Configuration
OPENAI_API_KEY=sk-...your-key...
OPENAI_ASSISTANT_ID=asst_...assistant-id...  # Get after running setup

# Database (existing)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=restaurant_db
```

### 🚀 **Setup Script**

**File:** `backend/scripts/setupAssistant.js`

```javascript
import { setupAssistant, updateAssistantFunctions } from '../src/config/assistantSetup.js';
import { CHATBOT_FUNCTIONS } from '../src/services/chatbotFunctions.service.js';

async function main() {
  console.log('🚀 Setting up OpenAI Assistant...\n');
  
  try {
    // 1. Create assistant
    const assistant = await setupAssistant();
    
    // 2. Update with functions
    await updateAssistantFunctions(CHATBOT_FUNCTIONS);
    
    console.log('\n✅ Setup completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Add OPENAI_ASSISTANT_ID to .env file');
    console.log('2. Restart backend server');
    console.log('3. Test chatbot endpoint\n');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

main();
```

**Run once:**
```bash
cd backend
node scripts/setupAssistant.js
```

---

## 7. SUCCESS METRICS

### 🎯 **KPIs**

**Before (Baseline):**
- Response time: ~1.5s
- Context: 10 messages (sessionStorage)
- Token cost: $4.5/tháng
- Analytics: ❌ None
- Real-time data: ❌ Menu only

**After (Target):**
- ✅ Response time: <3s (acceptable với function calling)
- ✅ Context: ♾️ Unlimited (OpenAI threads)
- ✅ Token cost: <$1.5/tháng (**67% savings**)
- ✅ Analytics: ✅ Full dashboard
- ✅ Real-time data: ✅ Menu + Tables + Orders + Promotions
- ✅ Function calling accuracy: >90%
- ✅ User satisfaction: >4.5/5

### 📊 **Monitoring Dashboards**

**Metrics to track:**
1. **Performance**
   - Average response time
   - P95 response time
   - Error rate

2. **Usage**
   - Conversations per day
   - Messages per conversation
   - Unique users

3. **Functions**
   - Function call frequency
   - Function execution time
   - Function success rate

4. **Business**
   - Conversion rate (chat → order)
   - Customer satisfaction
   - Staff workload reduction

---

## 8. RISKS & MITIGATION

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **OpenAI API downtime** | High | Low | Fallback to simple responses, cache |
| **Polling timeout** | Medium | Medium | Set max 30s, show loading state |
| **Function calling loops** | Medium | Low | Max 5 iterations limit |
| **Token cost overrun** | Low | Low | Monitor usage, set alerts |
| **Thread not found** | Medium | Low | Auto-create new thread |
| **Database migration issues** | High | Low | Full backup + rollback script |

---

## 9. FUTURE ENHANCEMENTS

### 🚀 **Phase 2 (3-6 tháng sau)**

1. **Advanced Analytics**
   - Sentiment analysis
   - Intent classification
   - Conversation flow visualization
   - A/B testing

2. **More Functions**
   - `create_order()` - Đặt món trực tiếp
   - `book_table()` - Đặt bàn tự động
   - `apply_promotion()` - Áp dụng mã giảm giá
   - `get_reviews()` - Xem review món ăn

3. **Personalization**
   - User preferences learning
   - Recommendation engine
   - Proactive suggestions

4. **Multi-channel**
   - Facebook Messenger integration
   - Zalo integration
   - Voice chatbot (Realtime API)

---

## 10. APPENDIX

### 📚 **References**

- [OpenAI Assistants API Documentation](https://platform.openai.com/docs/assistants/overview)
- [Function Calling Guide](https://platform.openai.com/docs/guides/function-calling)
- [Assistants API Pricing](https://openai.com/api/pricing/)
- [Best Practices for Assistants](https://platform.openai.com/docs/assistants/best-practices)

### 📝 **Change Log**

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-22 | 1.0 | Initial plan created for small-scale deployment |

---

## ✅ CONCLUSION

### **Tại sao approach này tốt nhất cho quy mô nhỏ:**

1. **Simplicity First** ⭐⭐⭐⭐⭐
   - Không cần build context manager phức tạp
   - OpenAI lo hết về thread management
   - Code gọn, dễ maintain

2. **Cost Effective** 💰
   - $1.5/tháng (67% cheaper)
   - Tiết kiệm dev time (3 tuần vs 7 tuần)

3. **Feature Rich** 🎁
   - Function calling cho real-time data
   - Unlimited context (threads)
   - Full analytics capability

4. **Production Ready** 🚀
   - Proven technology (OpenAI Assistants)
   - Easy to scale later
   - Minimal infrastructure changes

### **Next Steps:**

1. ✅ Review và approve plan này
2. ✅ Setup development environment
3. ✅ Kick-off Week 1: Assistant setup
4. ✅ Weekly progress reviews
5. ✅ Deploy to production (Week 3)

---

**Prepared by:** AI Assistant  
**Date:** November 22, 2025  
**Version:** 1.0 (Small-Scale Optimized)  
**Status:** READY FOR IMPLEMENTATION 🚀

**Total Timeline:** 3 weeks  
**Total Cost:** ~$1.5/month operational  
**Recommended for:** Small to medium restaurants (<200 daily users)
