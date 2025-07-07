import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import ApiError from './apiError.js';
import dotenv from 'dotenv';

dotenv.config();

// --- Cloudinary Configuration ---
 cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});
export { cloudinary };


/**
 * A helper function to upload a file buffer to Cloudinary.
 * @param {Buffer} fileBuffer - The file buffer from multer (req.file.buffer).
 * @param {object} options - Optional Cloudinary upload options (e.g., folder, public_id).
 * @returns {Promise<object>} A promise that resolves with the Cloudinary upload result.
 */
export const uploadToCloud = (fileBuffer, options = {}) => {
    return new Promise((resolve, reject) => {
        // Create an upload stream to Cloudinary.
        const uploadStream = cloudinary.uploader.upload_stream(
            options,
            (error, result) => {
                // This callback is executed when the upload is complete or has failed.
                if (error) {
                    // If an error occurs, reject the promise.
                    return reject(new ApiError('Cloud upload failed.', 500));
                }
                // If the upload is successful, resolve the promise with the result.
                resolve(result);
            }
        );

        // Use streamifier to convert the buffer into a readable stream
        // and pipe it to the Cloudinary upload stream.
        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
};

