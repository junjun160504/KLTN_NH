import openai from '../config/openaiClient.js';

export async function reply(message) {
    try {
        if (!message || message.trim().length < 3) {
            return {
                message,
                suggestion: 'Bạn có thể nói rõ hơn để mình gợi ý món phù hợp nhé!',
            };
        }

        const prompt = `
Bạn là một trợ lý nhà hàng chuyên nghiệp. Khi khách hàng hỏi món ăn, hãy gợi ý món phù hợp dựa trên yêu cầu. Nếu được hỏi "ít cay", "2 người", "dưới 200k", hãy đưa ra gợi ý combo cụ thể, món chay, món ăn nhẹ, v.v.

Câu hỏi: "${message}"
Trả lời:
    `;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: 'Bạn là nhân viên phục vụ nhà hàng thân thiện.' },
                { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 150,
        });

        const suggestion = completion.choices[0].message.content.trim();

        return {
            message,
            suggestion,
        };
    } catch (error) {
        console.error('OpenAI error:', error);
        return {
            message,
            suggestion: 'Xin lỗi, hiện tại mình không thể phản hồi. Bạn vui lòng thử lại sau nhé!',
        };
    }
}
