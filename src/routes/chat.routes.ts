import express from 'express';
import { validate } from '@src/utils/schema';
import { getChatHistory } from '@src/controllers/chat/index';
import { getChatHistorySchema } from '@src/controllers/chat/getChatHistory.controller';
import { RouterLinks } from '@src/constants/links';
const router = express.Router();

// Get chat history for a session
router.get(RouterLinks.getChatHistory, validate(getChatHistorySchema), getChatHistory);

export default router;
