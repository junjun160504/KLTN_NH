import express from 'express';
import { addCustomer } from '../controllers/customer.controller.js';

const router = express.Router();

router.post('/', addCustomer);

export default router;
