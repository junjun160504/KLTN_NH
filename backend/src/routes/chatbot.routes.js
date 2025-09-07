import express from 'express';
import { chatWithBot } from '../controllers/chatbot.controller.js';

const router = express.Router();

router.post('/', chatWithBot);

export default router;
