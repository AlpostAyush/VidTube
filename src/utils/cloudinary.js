import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'
import logger from './logger.js';
import dotenv from "dotenv";

dotenv.config();

// Configure cloudinary
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper function to safely delete local file
const safeDeleteFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            logger.info(`Local file deleted: ${filePath}`);
        }
    } catch (error) {
        logger.error(`Error deleting local file: ${filePath}`, error);
    }
};

// Upload file to Cloudinary
const uploadOnCloudinary = async (localFilePath, options = {}) => {
    try {
        // Validate input
        if (!localFilePath) {
            logger.warn("No file path provided for upload");
            return null;
        }

        // Check if file exists
        if (!fs.existsSync(localFilePath)) {
            logger.error(`File not found: ${localFilePath}`);
            return null;
        }

        // Default upload options
        const uploadOptions = {
            resource_type: 'auto',
            folder: 'vidtube/users', 
            ...options
        };

        // Debug: Log upload attempt
        console.log('Attempting Cloudinary upload:', {
            filePath: localFilePath,
            options: uploadOptions,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            apiKeyExists: !!process.env.CLOUDINARY_API_KEY,
            apiSecretExists: !!process.env.CLOUDINARY_API_SECRET
        });

        // Upload to Cloudinary
        const cloudinaryResponse = await cloudinary.uploader.upload(localFilePath, uploadOptions);
        
        console.log(' Cloudinary upload successful:', cloudinaryResponse.url);
        
           // Delete local file after successful upload
        safeDeleteFile(localFilePath);
        
        return cloudinaryResponse;

    } catch (error) {
        logger.error(`Cloudinary upload failed for ${localFilePath}:`, error);
        
        // Clean up local file even if upload failed
        safeDeleteFile(localFilePath);
        
        return null;
    }
};
     


// Delete file from Cloudinary
const deletefromCloudinary = async (publicId) => {
    try {
        if (!publicId) {
            logger.warn("No public ID provided for deletion");
            return null;
        }

        const result = await cloudinary.uploader.destroy(publicId);
        
        if (result.result === 'ok') {
            logger.info(`File deleted from Cloudinary: ${publicId}`);
            return result;
        } else {
            logger.warn(`File deletion failed: ${publicId}`, result);
            return null;
        }
        
    } catch (error) {
        logger.error(`Error deleting from Cloudinary: ${publicId}`, error);
        return null;
    }
};

export { uploadOnCloudinary, deletefromCloudinary };
     
     