/**
 * Chat API Routes
 * 
 * Public endpoint for chatbot functionality
 * POST /api/chat - Send a message and get AI response
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { validate } from '../middleware/validate';
import { chatMessageSchema } from '../validation/schemas';
import { ChatService } from '../data/services/ChatService';

const router = Router();
const prisma = new PrismaClient();

// Initialize ChatService
const chatService = new ChatService(prisma);

/**
 * POST /api/chat
 * 
 * Send a message to the chatbot and receive a response
 * 
 * Request body:
 * {
 *   message: string,
 *   conversationHistory?: Array<{ role: 'user' | 'assistant', content: string }>
 * }
 * 
 * Response:
 * {
 *   message: string,
 *   contextUsed?: {
 *     diaryCount: number,
 *     projectsCount: number,
 *     toolsCount: number,
 *     jobsCount: number,
 *     educationCount: number
 *   }
 * }
 */
router.post('/', validate(chatMessageSchema), async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    // Validate conversation history format if provided
    if (conversationHistory && !Array.isArray(conversationHistory)) {
      return res.status(400).json({ 
        error: 'conversationHistory must be an array' 
      });
    }

    // Call ChatService to generate response
    const response = await chatService.chat(message, conversationHistory);

    res.json(response);
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to generate chat response',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

