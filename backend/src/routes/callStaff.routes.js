import express from 'express';
import { handleCallStaff } from '../controllers/callStaff.controller.js';

const router = express.Router();

router.get('/', handleCallStaff);

export default router;
