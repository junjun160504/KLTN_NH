import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();


import menuRoutes from './routes/menu.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import customerRoutes from './routes/customer.routes.js';
import callStaffRoutes from './routes/callStaff.routes.js';
import chatbotRoutes from './routes/chatbot.routes.js';
import reviewRoutes from './routes/review.routes.js';
import adminRoutes from './routes/admin.routes.js';


const app = express();
app.use(cors());
app.use(express.json());


app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/call-staff', callStaffRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/admin', adminRoutes);


app.get('/', (req, res) => res.send('Restaurant API running...'));


export default app;
