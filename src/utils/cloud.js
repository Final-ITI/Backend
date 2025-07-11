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


/**
 * Uploads a file buffer to cloud storage with organized folder structure
 * @async
 * @function _uploadFileToCloud
 * @param {Buffer} fileBuffer - The file data as a buffer to be uploaded
 * @param {string} ownerId - The unique identifier of the file owner
 * @param {string} [ownerType="teacher"] - The type of owner (e.g., "teacher", "student")
 * @param {string} [fileType="documents"] - The category/type of file being uploaded
 * @returns {Promise<Object>} The upload result object containing secure_url and other metadata
 * @description Creates a structured folder path in format: motqan/{ownerType}s/{ownerId}/{fileType}
 * and uploads the file with auto-detected resource type
 */
export async function _uploadFileToCloud(fileBuffer, ownerId, ownerType = "teacher", fileType = "documents") {
    const uploadResult = await uploadToCloud(fileBuffer, {
        folder: `motqan/${ownerType}s/${ownerId}/${fileType}`,
        resource_type: "auto",
    });
    if (!uploadResult || !uploadResult.secure_url) {
        throw new ApiError("Failed to upload file to the cloud.", 500);
    }
    return uploadResult;
}