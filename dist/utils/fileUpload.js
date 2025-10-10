"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicUrl = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
// Configure storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = (0, uuid_1.v4)();
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    }
});
// File filter to only allow images
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    // Check MIME type
    const isValidMimeType = allowedTypes.includes(file.mimetype);
    // Check file extension as fallback
    const fileExtension = path_1.default.extname(file.originalname).toLowerCase();
    const isValidExtension = allowedExtensions.includes(fileExtension);
    if (isValidMimeType || isValidExtension) {
        cb(null, true);
    }
    else {
        cb(new Error(`Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed. Received: ${file.mimetype} with extension: ${fileExtension}`));
    }
};
// Configure multer
exports.upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit (for large GIFs and project demos)
    }
});
// Helper function to get the public URL for an uploaded file
const getPublicUrl = (filename) => {
    return `/uploads/${filename}`;
};
exports.getPublicUrl = getPublicUrl;
