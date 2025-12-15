import { OpenAI } from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY, // nhớ khai báo biến môi trường
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

export default openai;
