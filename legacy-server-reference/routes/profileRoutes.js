import { Router } from 'express';
import { getProfile, updateProfile, updatePhoto } from '../controllers/profileController.js';
import { upload } from '../middleware/photoUpload.js';
const router = Router();
router.get('/profile/:id', getProfile);
router.put('/profile/:id', updateProfile);
router.post('/profile/:id/photo', upload.single('photo'), updatePhoto);
export default router;
