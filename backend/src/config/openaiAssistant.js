/**
 * OpenAI Assistants API Configuration
 * 
 * File này chứa cấu hình cho OpenAI Assistants API
 * Bao gồm: Assistant ID, Tools definitions, Instructions
 * 
 * @module config/openaiAssistant
 */

import dotenv from 'dotenv';
dotenv.config();

// ============================================
// ASSISTANT CONFIGURATION
// ============================================

/**
 * Assistant ID từ OpenAI Dashboard hoặc tạo via API
 * Cần được lưu trong .env file
 */
export const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID || null;

/**
 * Model được sử dụng cho Assistant
 */
export const ASSISTANT_MODEL = 'gpt-5-nano';

/**
 * Assistant Instructions Template
 * Hướng dẫn cho AI về cách trả lời
 */
export const ASSISTANT_INSTRUCTIONS = `
# Trợ lý AI Menu Nhà Hàng

Bạn là trợ lý AI thân thiện của nhà hàng, chuyên hỗ trợ khách hàng tìm hiểu về menu.

## Vai trò chính:
- Giới thiệu menu, các món ăn có trong nhà hàng
- Gợi ý món ăn theo yêu cầu của khách (món ngon, món phổ biến, món mới)
- Trả lời thắc mắc về giá cả, mô tả món ăn
- Cung cấp thông tin về danh mục món ăn

## Không hỗ trợ:
- Đặt món (khách hàng tự đặt qua ứng dụng)
- Gọi nhân viên (khách dùng nút gọi riêng)
- Thanh toán (khách thanh toán qua ứng dụng)

## Quy tắc trả lời:
1. Luôn lịch sự, thân thiện và nhiệt tình
2. Trả lời bằng tiếng Việt
3. PHẢI sử dụng các function (get_menu, get_categories, get_recommendations) để lấy thông tin chính xác
4. Không bịa đặt thông tin về món ăn hoặc giá cả
5. Format giá tiền: xxx.xxx đ (VD: 50.000 đ)
6. Khi không chắc chắn, hỏi lại khách để hiểu rõ hơn

## Cách sử dụng Function:
- Khi khách hỏi về menu/món ăn → dùng get_menu()
- Khi khách hỏi có những loại món gì → dùng get_categories()
- Khi khách muốn gợi ý món ngon/phổ biến → dùng get_recommendations()
- Có thể kết hợp nhiều function để trả lời đầy đủ

## Format Response:
- Sử dụng bullet points cho danh sách món
- Hiển thị giá rõ ràng bên cạnh tên món
- Thêm mô tả ngắn nếu có
- Dùng emoji phù hợp: 🍜 (món ăn), 💰 (giá), ⭐ (đề xuất), 🔥 (phổ biến)

## Ví dụ trả lời tốt:
"Dạ, nhà hàng có các món phở rất ngon ạ! 🍜

⭐ **Phở bò tái** - 55.000 đ
   Phở với thịt bò tái mềm, nước dùng đậm đà

🔥 **Phở bò chín** - 50.000 đ  
   Phở với thịt bò chín, được yêu thích nhất

Anh/chị muốn biết thêm về món nào ạ?"
`;

// ============================================
// FUNCTION TOOLS DEFINITIONS
// ============================================

/**
 * Tool definitions cho Assistant
 * Định nghĩa các functions mà Assistant có thể gọi
 */
export const ASSISTANT_TOOLS = [
    {
        type: "function",
        function: {
            name: "get_menu",
            description: "Lấy danh sách món ăn từ menu nhà hàng. Có thể lọc theo danh mục hoặc tìm kiếm theo tên.",
            parameters: {
                type: "object",
                properties: {
                    category_id: {
                        type: "integer",
                        description: "ID của danh mục món ăn để lọc (optional). VD: 1 cho Khai vị, 2 cho Món chính"
                    },
                    search: {
                        type: "string",
                        description: "Từ khóa tìm kiếm trong tên hoặc mô tả món ăn (optional). VD: 'phở', 'gà', 'cơm'"
                    },
                    limit: {
                        type: "integer",
                        description: "Số lượng món ăn tối đa trả về (mặc định: 10, tối đa: 20)"
                    }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_categories",
            description: "Lấy danh sách tất cả các danh mục món ăn có trong nhà hàng (VD: Khai vị, Món chính, Đồ uống, Tráng miệng...)",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_recommendations",
            description: "Lấy danh sách món ăn được gợi ý/đề xuất dựa trên tiêu chí: phổ biến nhất, đánh giá cao nhất, hoặc ngẫu nhiên",
            parameters: {
                type: "object",
                properties: {
                    criteria: {
                        type: "string",
                        description: "Tiêu chí gợi ý món ăn",
                        enum: ["popular", "top_rated", "random"]
                    },
                    limit: {
                        type: "integer",
                        description: "Số lượng món gợi ý (mặc định: 3, tối đa: 5)"
                    }
                },
                required: []
            }
        }
    }
];

// ============================================
// ASSISTANT CREATION CONFIG
// ============================================

/**
 * Config đầy đủ để tạo Assistant qua API
 * Sử dụng khi cần tạo Assistant mới programmatically
 */
export const ASSISTANT_CREATE_CONFIG = {
    name: "Restaurant Menu Assistant",
    description: "Trợ lý AI hỗ trợ khách hàng tìm hiểu về menu nhà hàng",
    model: ASSISTANT_MODEL,
    instructions: ASSISTANT_INSTRUCTIONS,
    tools: ASSISTANT_TOOLS,
    metadata: {
        version: "1.0",
        created_by: "KLTN_NH System",
        purpose: "menu_qa"
    }
};

// ============================================
// RUNTIME SETTINGS
// ============================================

/**
 * Cấu hình runtime cho Assistant
 */
export const ASSISTANT_RUNTIME_CONFIG = {
    // Timeout cho việc chờ run hoàn thành (ms)
    runTimeout: 30000,

    // Interval để poll status của run (ms)
    pollInterval: 1000,

    // Max retries khi function call fail
    maxFunctionRetries: 2,

    // Có log debug không
    debug: process.env.NODE_ENV === 'development'
};

/**
 * Mapping function names với descriptions (để log/debug)
 */
export const FUNCTION_DESCRIPTIONS = {
    'get_menu': 'Lấy danh sách món ăn',
    'get_categories': 'Lấy danh mục món ăn',
    'get_recommendations': 'Lấy gợi ý món ăn'
};

export default {
    ASSISTANT_ID,
    ASSISTANT_MODEL,
    ASSISTANT_INSTRUCTIONS,
    ASSISTANT_TOOLS,
    ASSISTANT_CREATE_CONFIG,
    ASSISTANT_RUNTIME_CONFIG,
    FUNCTION_DESCRIPTIONS
};
