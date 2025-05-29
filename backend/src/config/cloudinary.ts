import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import path from 'path';
import { Request } from 'express';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Define custom interface for CloudinaryStorage params
interface CloudinaryStorageParams {
    folder: (req: Request, file: Express.Multer.File) => string;
    format: (req: Request, file: Express.Multer.File) => Promise<string>;
    public_id: (req: Request, file: Express.Multer.File) => string;
}

// Create dynamic folder structure based on product ID or temporary group ID
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: (req: Request, file: Express.Multer.File) => {
            // For existing products (update), use the product ID from params
            if (req.params.id) {
                return `products/${req.params.id}`;
            }

            // For new products, use a temporary group ID to keep images together
            // If productTempId isn't in the request body, create one and store it
            if (!req.body.productTempId) {
                req.body.productTempId = `temp-${Date.now()}`;
            }

            return `products/${req.body.productTempId}`;
        },
        format: async (req: Request, file: Express.Multer.File) => {
            // Get file extension
            const ext = path.extname(file.originalname).toLowerCase();
            if (ext === '.jpg' || ext === '.jpeg') return 'jpg';
            if (ext === '.png') return 'png';
            if (ext === '.webp') return 'webp';
            return 'jpg'; // Default format
        },
        public_id: (req: Request, file: Express.Multer.File) => {
            // Create unique file name without extension
            return `${Date.now()}-${file.originalname.split('.')[0]}`;
        }
    } as CloudinaryStorageParams
});

// Configure multer for image upload
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
    },
    fileFilter: (req, file, cb) => {
        // Allow only images
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

export { upload, cloudinary };