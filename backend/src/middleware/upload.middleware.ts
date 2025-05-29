// src/middleware/upload.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { upload } from '../config/cloudinary';

// Middleware for multiple image uploads (only the middleware, no error handling)
export const uploadProductImages = upload.array('images', 10); // Allow up to 10 images

// Create a wrapper function for the upload middleware that includes error handling
export const uploadProductImagesHandler = (req: Request, res: Response, next: NextFunction) => {
    uploadProductImages(req, res, (err) => {
        if (err) {
            console.error('Upload error:', err);
            return res.status(400).json({
                success: false,
                message: 'Error uploading images',
                error: err.message
            });
        }
        next();
    });
};