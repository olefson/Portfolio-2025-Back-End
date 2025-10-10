"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_service_1 = __importDefault(require("../services/auth.service"));
const auth_service_2 = require("../services/auth.service");
const router = express_1.default.Router();
// Google OAuth routes
router.get('/google', auth_service_1.default.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', auth_service_1.default.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    // Successful authentication, redirect to frontend
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
});
// Get current user
router.get('/me', auth_service_2.isAuthenticated, (req, res) => {
    res.json(req.user);
});
// Logout
router.get('/logout', (req, res) => {
    req.logout(() => {
        res.json({ message: 'Logged out successfully' });
    });
});
exports.default = router;
