import { OpenAI } from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // nhớ khai báo biến môi trường
});

export default openai;
