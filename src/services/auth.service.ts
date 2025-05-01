import { PrismaClient, Role, User } from '@prisma/client';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Request, Response, NextFunction } from 'express';

// Extend the Express Request type to include the user property
declare global {
    namespace Express {
        interface User {
            id: string;
            email: string;
            googleId: string;
            role: Role;
            createdAt: Date;
            updatedAt: Date;
        }
    }
}

const prisma = new PrismaClient();

// Configure Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user exists
        let user = await prisma.user.findUnique({
            where: { googleId: profile.id }
        });

        if (!user) {
            // Create new user if doesn't exist
            user = await prisma.user.create({
                data: {
                    googleId: profile.id,
                    email: profile.emails?.[0]?.value || '',
                    role: Role.EDITOR // Default role
                }
            });
        }

        return done(null, user);
    } catch (error) {
        return done(error as Error);
    }
}));

// Serialize user for the session
passport.serializeUser((user: User, done) => {
    done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id }
        });
        done(null, user);
    } catch (error) {
        done(error);
    }
});

// Middleware to check if user is authenticated
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
};

// Middleware to check if user is admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated() && (req.user as User).role === Role.ADMIN) {
        return next();
    }
    res.status(403).json({ message: 'Forbidden' });
};

export default passport; 