import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();


import menuRoutes from './routes/menu.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import customerRoutes from './routes/customer.routes.js';
import callStaffRoutes from './routes/callStaff.routes.js';
import chatbotRoutes from './routes/chatbot.routes.js';
import reviewRoutes from './routes/review.routes.js';
import adminRoutes from './routes/admin.routes.js';
import qrSessionRoutes from './routes/qrSession.routes.js';   // QR sessions
import staffOrderRoutes from './routes/staffOrder.routes.js'; // Nhân viên xác nhận/huỷ đơn
import tableRoutes from './routes/table.routes.js';           // Quản lý bàn
import auditRoutes from './routes/audit.routes.js';           // Audit log
import menuItem from './routes/menuItem.routes.js'; 

const app = express();
app.use(cors());
app.use(express.json());


app.use('/api/menu', menuRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/call-staff', callStaffRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/qr-sessions', qrSessionRoutes);
app.use('/api/staff/orders', staffOrderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/menu-item', menuItem);


app.get('/', (req, res) => res.send('Restaurant API running...'));


export default app;
