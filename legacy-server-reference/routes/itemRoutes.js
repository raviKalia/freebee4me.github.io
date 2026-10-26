import { Router } from 'express';
import { listItems } from '../controllers/itemController.js';
import { categories } from '../data/categories.js';
const router = Router();
router.get('/items', listItems);
router.get('/categories', (_, res) => res.json(categories));
export default router;
