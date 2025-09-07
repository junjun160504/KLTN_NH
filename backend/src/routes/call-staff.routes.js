import express from 'express';
import { callStaff } from '../controllers/call-staff.controller.js';

const router = express.Router();

router.post('/', callStaff);

export default router;
