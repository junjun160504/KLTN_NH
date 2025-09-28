import express from 'express';
import { callStaff } from '../controllers/callStaff.controller.js';

const router = express.Router();

router.get('/', handleCallStaff);

export default router;
