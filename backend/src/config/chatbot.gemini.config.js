import { GoogleGenerativeAI } from '@google/generative-ai';


// Khởi tạo gemini AI client
const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
);

// Cấu hình generation mặc định
const defaultGenerationConfig = {
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
};

// Cấu hình safety settings
const defaultSafetySettings = [
    {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
];


// System instructions cho chatbot
const systemInstruction = `
    Bạn là trợ lý ảo AI của nhà hàng "Bếp Việt".
    Phong cách: Thân thiện, dùng emoji 🍜, ngắn gọn.
    
    DỮ LIỆU NHÀ HÀNG:
    1. Giờ mở cửa: 10:00 - 22:00.
    2. Menu & Ảnh (Khi nhắc đến món nào, PHẢI chèn ảnh món đó bằng cú pháp Markdown):
       - Phở Bò (50k): ![Phở Bò](https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400)
       - Bún Chả (60k): ![Bún Chả](https://images.unsplash.com/photo-1585325701165-351af916e581?w=400)
       - Nem Rán (20k): ![Nem Rán](https://images.unsplash.com/photo-1606850780554-b55d26027b40?w=400)
    
    QUY TẮC:
    - Nếu khách hỏi món không có, hãy xin lỗi và gợi ý món khác.
    - Luôn dùng Markdown để định dạng (in đậm tên món, xuống dòng rõ ràng).
  `;

// Cấu hình model
const modelConfig = {
    modelName: 'gemini-2.5-flash',
    generationConfig: defaultGenerationConfig,
    safetySettings: defaultSafetySettings,
    systemInstruction: systemInstruction,

}


// Export config object
const geminiConfig = {
    client: genAI,
    modelName: modelConfig.modelName,
    generationConfig: defaultGenerationConfig,
    safetySettings: defaultSafetySettings,
    systemInstruction,

    // Hàm lấy model instance
    getModel: (customConfig = {}) => {
        return genAI.getGenerativeModel({
            model: customConfig.modelName || modelConfig.modelName,
            generationConfig: {
                ...defaultGenerationConfig,
                ...customConfig.generationConfig,
            },
            safetySettings: customConfig.safetySettings || defaultSafetySettings,
            systemInstruction: customConfig.systemInstruction || systemInstruction,
        });
    },
};


export default geminiConfig;