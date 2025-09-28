import express from 'express';
import { loginAdmin, getLoginAdmin, registerAdminController } from '../controllers/admin.controller.js';

const router = express.Router();

router.post('/login', loginAdmin);
router.post('/register-admin', registerAdminController);
router.get('/man/logins', getLoginAdmin);

export default router;
