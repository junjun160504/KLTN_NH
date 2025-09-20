import express from 'express';
import { loginAdmin ,getLoginAdmin} from '../controllers/admin.controller.js';

const router = express.Router();

router.post('/login', loginAdmin);
router.get('/man/logins', getLoginAdmin);

export default router;
