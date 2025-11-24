import openai from "../config/openaiClient.js";
import { query } from "../config/db.js";

// ✅ Cache menu để tránh query DB mỗi request
let cachedMenu = null;
let cacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

/**
 * Lấy menu từ cache hoặc DB
 */
async function getMenu() {
  if (cachedMenu && cacheTime && Date.now() - cacheTime < CACHE_DURATION) {
    return cachedMenu;
  }

  // Query menu với đầy đủ thông tin
  const items = await query(`
    SELECT 
      id, 
      name, 
      price, 
      description, 
      image_url
    FROM menu_items 
    WHERE is_available = 1 
    LIMIT 30
  `);

  cachedMenu = items;
  cacheTime = Date.now();
  return items;
}

/**
 * 🎨 Parse rich content response từ GPT
 * Xử lý mọi loại nội dung: text, images, links, suggestions, actions
 */
function parseRichContentResponse(gptResponse, menuItems, originalMessage) {
  const contents = [];

  // 1️⃣ Extract text content
  if (gptResponse.intro || gptResponse.text) {
    const text = gptResponse.intro || gptResponse.text;

    // Extract URLs from text
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex) || [];

    contents.push({
      type: 'text',
      value: text,
      urls: urls.length > 0 ? urls : null
    });
  }

  // 2️⃣ Extract suggested menu items
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

  // 3️⃣ Detect mentioned items in text
  const mentionedItems = [];
  const textContent = gptResponse.intro || gptResponse.text || '';

  if (textContent) {
    menuItems.forEach((item) => {
      const regex = new RegExp(item.name.replace(/[()]/g, '\\$&'), 'gi');
      if (regex.test(textContent) && !suggestedItems.find(s => s.id === item.id)) {
        mentionedItems.push({
          id: item.id,
          name: item.name,
          price: item.price,
          description: item.description,
          image_url: item.image_url || "https://via.placeholder.com/150?text=No+Image",
        });
      }
    });
  }

  if (mentionedItems.length > 0) {
    contents.push({
      type: 'mentioned_items',
      items: mentionedItems
    });
  }

  // 4️⃣ Extract action buttons (if any)
  if (gptResponse.actions && Array.isArray(gptResponse.actions)) {
    contents.push({
      type: 'actions',
      buttons: gptResponse.actions.map(action => ({
        label: action.label || action.text,
        action: action.action || action.type,
        data: action.data || null
      }))
    });
  }

  // 5️⃣ Extract images (if any)
  if (gptResponse.images && Array.isArray(gptResponse.images)) {
    contents.push({
      type: 'images',
      urls: gptResponse.images
    });
  }

  // 🎯 Return unified response structure
  return {
    message: originalMessage,
    response_type: 'rich_content',
    contents: contents,
    // Legacy support (backward compatible)
    type: suggestedItems.length > 0 ? 'suggestions' :
      mentionedItems.length > 0 ? 'text_with_items' : 'text',
    intro: gptResponse.intro || gptResponse.text,
    suggestions: suggestedItems,
    mentioned_items: mentionedItems
  };
}

/**
 * Main chatbot reply function with conversation context
 * @param {string} message - Current user message
 * @param {Array} history - Conversation history [{from: "user"/"bot", text: "..."}]
 */
export async function reply(message, history = []) {
  try {
    // Validate input
    if (!message || message.trim().length < 3) {
      return {
        message,
        type: "text",
        suggestion: "Bạn có thể nói rõ hơn để mình gợi ý món phù hợp nhé! 😊",
      };
    }

    // Lấy menu từ cache hoặc DB
    const menuItems = await getMenu();

    // Format menu cho GPT (chỉ cần name, price, description)
    const menuList = menuItems
      .map((i) => `- ${i.name} (${i.price}₫): ${i.description || ""}`)
      .join("\n");

    // Build system prompt với menu
    const systemPrompt = `
Bạn là trợ lý nhà hàng chuyên nghiệp. 
Đây là menu hiện có:

${menuList}

🎯 Nhiệm vụ:
1. Phân tích ý định của khách (muốn món gì, giá bao nhiêu, khẩu vị ra sao)
2. Gợi ý 1 hoặc nhiều món PHÙ HỢP NHẤT từ menu trên
3. CHỈ chọn món CÓ TRONG MENU, KHÔNG bịa thêm
4. NHỚ lịch sử hội thoại để đưa ra gợi ý phù hợp

📋 Trả về JSON format (KHÔNG có markdown, chỉ pure JSON):
{
  "intro": "Câu trả lời của bạn",
  "suggestions": [
    {
      "name": "Tên món (chính xác từ menu)",
      "reason": "Lý do gợi ý (1 câu ngắn)"
    }
  ]
}

Nếu khách hỏi thông tin thêm hoặc chat thường, trả về:
{
  "intro": "Câu trả lời của bạn",
  "suggestions": []
}
    `;

    // ✅ Build conversation messages with history
    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
    ];

    // Add last 10 messages from history (limit to prevent token overflow)
    const recentHistory = history.slice(-10);
    recentHistory.forEach((msg) => {
      if (msg.from === "user" && msg.text) {
        messages.push({
          role: "user",
          content: msg.text,
        });
      } else if (msg.from === "bot" && msg.text) {
        messages.push({
          role: "assistant",
          content: msg.text,
        });
      }
    });

    // Add current message
    messages.push({
      role: "user",
      content: message,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: "json_object" }, // Force JSON response
    });

    // Parse GPT response
    let gptResponse;
    try {
      const rawResponse = completion.choices[0].message.content.trim();
      gptResponse = JSON.parse(rawResponse);
    } catch (parseError) {
      console.error("Failed to parse GPT JSON:", parseError);
      throw new Error("Invalid JSON response from GPT");
    }

    // 🎨 Parse rich content response
    return parseRichContentResponse(gptResponse, menuItems, message);
  } catch (error) {
    console.error("OpenAI error:", error);

    // Fallback: trả món random từ DB với đầy đủ thông tin
    try {
      const items = await query(`
        SELECT id, name, price, description, image_url
        FROM menu_items 
        WHERE is_available = 1 
        ORDER BY RAND() 
        LIMIT 3
      `);

      return {
        message,
        type: "suggestions",
        intro: "Chatbot tạm thời bận, nhưng mình gợi ý mấy món hot này cho bạn nhé! 🔥",
        suggestions: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          description: item.description,
          image_url: item.image_url || "https://via.placeholder.com/150?text=No+Image",
          reason: "Món được yêu thích",
        })),
      };
    } catch (dbError) {
      console.error("Fallback DB error:", dbError);
      return {
        message,
        type: "text",
        suggestion:
          "Xin lỗi bạn, hệ thống đang gặp sự cố. Vui lòng thử lại sau! 🙏",
      };
    }
  }
}
