import openai from "../config/openaiClient.js";
import { query } from "../config/db.js";

// ✅ Cache menu để tránh query DB mỗi request
let cachedMenu = null;
let cacheTime = null;
const CACHE_DURATION = 20 * 60 * 1000; // 20 phút

/**
 * Lấy menu từ cache hoặc DB
 */
async function getMenu() {
  if (cachedMenu && cacheTime && Date.now() - cacheTime < CACHE_DURATION) {
    return cachedMenu;
  }

  // Query menu với đầy đủ thông tin
  const items = await query(`
    select mi.*, mc.name as category_name, mc.description as category_description
	  from menu_items as mi
    join menu_item_categories as mic on mi.id = mic.item_id
    join menu_categories as mc on mic.category_id = mc.id
    where mi.deleted_at is null && mc.deleted_at is null and mi.is_available = 1 and mc.is_available = 1
    order by mc.name
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
  // ✅ TẮT auto-detect - không tự động tạo card nhỏ cho món được nhắc trong text
  // Nếu muốn bật lại, uncomment block bên dưới
  const mentionedItems = [];

  /*
  // AUTO-DETECT DISABLED - Uncomment to enable
  const textContent = gptResponse.intro || gptResponse.text || '';
  if (textContent && suggestedItems.length > 0) {
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
  */

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

  // 🎯 Build _historyContext - text đầy đủ để lưu vào history
  const historyParts = [];

  // Text chính
  if (gptResponse.intro || gptResponse.text) {
    historyParts.push(gptResponse.intro || gptResponse.text);
  }

  // Danh sách món gợi ý
  if (suggestedItems.length > 0) {
    const itemsList = suggestedItems
      .map(item => `- ${item.name} (${item.price?.toLocaleString()}đ)${item.reason ? `: ${item.reason}` : ''}`)
      .join("\n");
    historyParts.push(`Món đã gợi ý:\n${itemsList}`);
  }

  // Món được đề cập
  if (mentionedItems.length > 0) {
    const itemsList = mentionedItems
      .map(item => `- ${item.name} (${item.price?.toLocaleString()}đ)`)
      .join("\n");
    historyParts.push(`Món được đề cập:\n${itemsList}`);
  }

  // 🎯 Return unified response structure
  return {
    message: originalMessage,
    response_type: 'rich_content',
    contents: contents,
    // ✅ Field để lưu vào history - đảm bảo context đầy đủ 100%
    _historyContext: historyParts.join("\n\n"),
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
 * @param {Array} history - Conversation history [{from: "user"/"bot", text: "...", type: "...", ...}]
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
      .map((i) => `-tên món: ${i.name} - giá: (${i.price}₫) - mô tả: ${i.description || ""} - hình ảnh: ${i.image_url || "https://via.placeholder.com/150?text=No+Image"} - danh mục: ${i.category_name || "Không rõ"} - Thời gian tạo: ${i.created_at || "Không rõ"}`)
      .join("\n");

    // Build system prompt với menu
    const systemPrompt = `
      Bạn là trợ lý AI thân thiện của nhà hàng, chuyên hỗ trợ khách hàng tìm hiểu về menu và giải thích mọi câu hỏi của khách hàng.
      Đây là menu hiện có:
      ${menuList}

      Nhiệm vụ:
      - Giới thiệu menu, các món ăn có trong nhà hàng từ 3 - 5 món phù hợp nhất với yêu cầu của khách
      - Trả lời thắc mắc về giá cả, mô tả món ăn (bạn có thể dùng thông tin từ internet nếu cần thiết)
      - Cung cấp thông tin về danh mục món ăn
      - CHỈ chọn món CÓ TRONG MENU, KHÔNG bịa thêm

      ## Không hỗ trợ:
      - Đặt món (khách hàng tự đặt qua ứng dụng)
      - Gọi nhân viên (khách dùng nút gọi riêng)
      - Thanh toán (khách thanh toán qua ứng dụng)

      ## Định dạng văn bản (Markdown):
      Trong trường "intro", bạn CÓ THỂ sử dụng Markdown để làm nội dung đẹp và dễ đọc hơn:
      - **in đậm** cho tên món hoặc điểm nhấn quan trọng
      - *in nghiêng* cho mô tả nhẹ nhàng
      - Dùng emoji phù hợp 🍜🔥✨ để tăng sự thân thiện
      - Xuống dòng bằng 2 dấu cách cuối dòng hoặc \n
      - Có thể dùng bullet points nếu liệt kê nhiều thông tin

      Trả về JSON format:
      {
        "intro": "Câu trả lời của bạn (có thể dùng **Markdown**)",
        "suggestions": [
          {
            "name": "Tên món (chính xác từ menu)",
            "reason": "Lý do gợi ý ngắn gọn"
          }
        ]
      }
      Nếu khách hỏi thông tin thêm hoặc chat thường, trả về:
      {
        "intro": "Câu trả lời của bạn",
        "suggestions": []
      }
    `;

    // ✅ Build messages array - System prompt LUÔN được thêm đầu tiên
    const messages = [
      {
        role: "system",
        content: systemPrompt,
      }
    ];

    // ✅ Giới hạn history: chỉ lấy 10 tin nhắn gần nhất để tránh tốn token
    const MAX_HISTORY = 100;
    const recentHistory = history.slice(-MAX_HISTORY);

    // ✅ Xử lý history - convert từ frontend format sang OpenAI format
    recentHistory.forEach((msg) => {
      if (msg.from === "user") {
        // User message
        if (msg.text) {
          messages.push({
            role: "user",
            content: msg.text,
          });
        }
      } else if (msg.from === "bot") {
        // Bot message - ƯU TIÊN dùng _historyContext nếu có (đảm bảo context 100%)
        let assistantContent = "";

        // ✅ Ưu tiên dùng _historyContext - field được tạo sẵn với đầy đủ context
        if (msg._historyContext) {
          assistantContent = msg._historyContext;
        }
        // Fallback: xử lý các format cũ
        else if (msg.type === "rich_content" && msg.contents) {
          // Rich content: trích xuất text + menu_items từ contents
          const parts = [];

          // Lấy text content
          const textContent = msg.contents
            .filter(c => c.type === "text")
            .map(c => c.value)
            .join("\n");
          if (textContent) parts.push(textContent);

          // Lấy danh sách món đã gợi ý
          const menuItemsContent = msg.contents.find(c => c.type === "menu_items");
          if (menuItemsContent && menuItemsContent.items && menuItemsContent.items.length > 0) {
            const itemsList = menuItemsContent.items
              .map(item => `- ${item.name} (${item.price?.toLocaleString()}đ)${item.reason ? `: ${item.reason}` : ''}`)
              .join("\n");
            parts.push(`Món đã gợi ý:\n${itemsList}`);
          }

          // Lấy mentioned items
          const mentionedItemsContent = msg.contents.find(c => c.type === "mentioned_items");
          if (mentionedItemsContent && mentionedItemsContent.items && mentionedItemsContent.items.length > 0) {
            const itemsList = mentionedItemsContent.items
              .map(item => `- ${item.name} (${item.price?.toLocaleString()}đ)`)
              .join("\n");
            parts.push(`Món được đề cập:\n${itemsList}`);
          }

          assistantContent = parts.join("\n\n") || "Đã gợi ý món ăn";

        } else if (msg.type === "suggestions") {
          // Suggestions format - bao gồm cả intro và danh sách món
          const parts = [];
          if (msg.intro) parts.push(msg.intro);

          if (msg.suggestions && msg.suggestions.length > 0) {
            const itemsList = msg.suggestions
              .map(item => `- ${item.name} (${item.price?.toLocaleString()}đ)${item.reason ? `: ${item.reason}` : ''}`)
              .join("\n");
            parts.push(`Món đã gợi ý:\n${itemsList}`);
          }

          assistantContent = parts.join("\n\n");

        } else if (msg.type === "text_with_items") {
          // Text with mentioned items
          const parts = [];
          if (msg.text) parts.push(msg.text);

          if (msg.mentioned_items && msg.mentioned_items.length > 0) {
            const itemsList = msg.mentioned_items
              .map(item => `- ${item.name} (${item.price?.toLocaleString()}đ)`)
              .join("\n");
            parts.push(`Món được đề cập:\n${itemsList}`);
          }

          assistantContent = parts.join("\n\n");

        } else if (msg.text) {
          // Plain text
          assistantContent = msg.text;
        }

        // Chỉ thêm nếu có content
        if (assistantContent) {
          messages.push({
            role: "assistant",
            content: assistantContent,
          });
        }
      }
    });

    // ✅ Thêm tin nhắn hiện tại của user
    messages.push({
      role: "user",
      content: message,
    });

    console.debug("[ChatbotV2] Sending messages to OpenAI:", JSON.stringify(messages, null, 2));

    const completion = await openai.chat.completions.create({
      model: "gemini-2.5-flash-lite",
      // model: "gemini-robotics-er-1.5-preview",
      messages: messages,
      // temperature: 0.7,
      // max_tokens: 100,
      response_format: { type: "json_object" }, // Force JSON response
    });

    // Parse GPT response
    let gptResponse;
    try {
      const rawResponse = completion.choices[0].message.content.trim();
      gptResponse = JSON.parse(rawResponse);
      console.log("Raw GPT Response:", rawResponse);
      console.log("GPT Response:", gptResponse);

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
