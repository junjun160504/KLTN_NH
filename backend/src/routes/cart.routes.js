import express from 'express';
import { getCart, addToCart} from '../controllers/cart.controller.js';

const router = express.Router();

router.get('/cus/cart/', getCart);    
router.post('/cus/cart/', addToCart);     


export default router;
