import openai from "../config/openaiClient.js";
import { query } from "../config/db.js";

export async function reply(message) {
  try {
    if (!message || message.trim().length < 3) {
      return {
        message,
        suggestion: "Bạn có thể nói rõ hơn để mình gợi ý món phù hợp nhé!",
      };
    }

    // ✅ Lấy menu thật từ DB
    const items = await query("SELECT name, price, description FROM menu_items WHERE is_available = 1 LIMIT 20");
    const menuList = items.map(i => `- ${i.name} (${i.price}₫): ${i.description || ""}`).join("\n");

    const prompt = `
Bạn là một trợ lý nhà hàng chuyên nghiệp. 
Đây là danh sách món hiện có trong nhà hàng:

${menuList}

Khách hỏi: "${message}"

👉 Gợi ý 3–5 món phù hợp từ danh sách trên, kèm mô tả ngắn và giá. 
Chỉ chọn món có trong menu, không bịa thêm.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Bạn là nhân viên phục vụ thân thiện." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const suggestion = completion.choices[0].message.content.trim();

    return { message, suggestion };
  } catch (error) {
    console.error("OpenAI error:", error);

    // Fallback: nếu GPT lỗi hoặc quota hết → trả món random từ DB
    const items = await query("SELECT name, price FROM menu_items WHERE is_available = 1 LIMIT 3");
    const suggestion = "Chatbot tạm thời không khả dụng. Bạn thử mấy món này nhé: " +
      items.map(i => `${i.name} (${i.price}₫)`).join(", ");
    return { message, suggestion };
  }
}
