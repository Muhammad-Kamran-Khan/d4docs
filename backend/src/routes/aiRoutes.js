import express from 'express';
import { handleChatRequest } from '../controllers/chatControllers.js';
import { protect } from '../middleware/authMiddlewares.js';

const router = express.Router();

router.post('/chat', protect, handleChatRequest);

export default router;