import express from 'express';
import passport from '../services/auth.service';
import { isAuthenticated } from '../services/auth.service';

const router = express.Router();

// Google OAuth routes
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        // Successful authentication, redirect to frontend
        res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
    }
);

// Get current user
router.get('/me', isAuthenticated, (req, res) => {
    res.json(req.user);
});

// Logout
router.get('/logout', (req, res) => {
    req.logout(() => {
        res.json({ message: 'Logged out successfully' });
    });
});

export default router; 