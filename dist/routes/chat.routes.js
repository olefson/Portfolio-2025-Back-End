"use strict";
/**
 * Chat API Routes
 *
 * Public endpoint for chatbot functionality
 * POST /api/chat - Send a message and get AI response
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const validate_1 = require("../middleware/validate");
const schemas_1 = require("../validation/schemas");
const ChatService_1 = require("../data/services/ChatService");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Initialize ChatService
const chatService = new ChatService_1.ChatService(prisma);
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
router.post('/', (0, validate_1.validate)(schemas_1.chatMessageSchema), async (req, res) => {
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
    }
    catch (error) {
        console.error('Error in chat endpoint:', error);
        res.status(500).json({
            error: 'Failed to generate chat response',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
