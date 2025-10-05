import * as chatbotService from "../services/chatbot.service.js";

export async function chatWithBot(req, res) {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ status: 400, message: "Thiếu nội dung message" });
    }

    // Pass conversation history to service (default to empty array)
    const result = await chatbotService.reply(message, history || []);
    res.status(200).json({ status: 200, data: result });
  } catch (err) {
    console.error("chatWithBot error:", err);
    res.status(500).json({ status: 500, message: "Internal server error" });
  }
}
