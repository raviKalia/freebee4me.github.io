import { Router } from 'express';
import { demoAuth } from '../middleware/demoAuth.js';
import { getTrade, addMessage, updateStatus } from '../controllers/tradeController.js';
const router = Router();
router.get('/trades/:id', demoAuth, getTrade);
router.post('/trades/:id/messages', demoAuth, addMessage);
router.patch('/trades/:id/status', demoAuth, updateStatus);
export default router;
