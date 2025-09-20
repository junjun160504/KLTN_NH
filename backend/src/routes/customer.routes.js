import express from 'express';
import { addCustomer } from '../controllers/customer.controller.js';

const router = express.Router();

router.post('/', addCustomer);
router.get('/', addCustomer);
export default router;
