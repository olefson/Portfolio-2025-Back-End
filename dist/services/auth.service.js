"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.isAuthenticated = void 0;
const client_1 = require("@prisma/client");
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const prisma = new client_1.PrismaClient();
// Configure Google Strategy
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
    var _a, _b;
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
                    email: ((_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) || '',
                    role: client_1.Role.EDITOR // Default role
                }
            });
        }
        return done(null, user);
    }
    catch (error) {
        return done(error);
    }
}));
// Serialize user for the session
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
// Deserialize user from the session
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id }
        });
        done(null, user);
    }
    catch (error) {
        done(error);
    }
});
// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
};
exports.isAuthenticated = isAuthenticated;
// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === client_1.Role.ADMIN) {
        return next();
    }
    res.status(403).json({ message: 'Forbidden' });
};
exports.isAdmin = isAdmin;
exports.default = passport_1.default;
