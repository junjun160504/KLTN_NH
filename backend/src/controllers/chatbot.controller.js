import * as chatbotService from '../services/chatbot.service.js';

export async function chatWithBot(req, res) {
    try {
        const { message } = req.body;
        const result = await chatbotService.reply(message);
        res.status(200).json({ status: 200, data: result });
    } catch (err) {
        console.error('chatWithBot error:', err);
        res.status(500).json({ status: 500, message: 'Internal server error' });
    }
}
