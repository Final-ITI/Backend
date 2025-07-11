import { GoogleGenerativeAI } from "@google/generative-ai";
import ApiError from "../utils/apiError.js";

// Initialize the client with your API key from environment variables
const genAI = new GoogleGenerativeAI('AIzaSyDbeRrIz7tK3ofacCoHX9X-zPZPmX05h6U');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Extracts data from an ID card image using Gemini.
 * @param {Buffer} imageBuffer - The image file buffer from multer.
 * @returns {Promise<object|null>} An object containing the extracted data (nationalId, name, etc.).
 */
async function extractDataWithGemini(imageBuffer) {
    console.log("Starting data extraction with Gemini...");

    const prompt = `You are an expert data extraction assistant specialized in Egyptian identity cards.
    Analyze the provided image and extract the following fields: the 14-digit National ID number, and the full name as written.

    You MUST return the output ONLY in a valid JSON format. Do not add any introductory text, conversation, or markdown formatting.
    The JSON object should have keys: "nationalId" and "name".

    Example:
    {
      "nationalId": "29501011234567",
      "name": "خالد علي محمد احمد"
    }`;

    const imagePart = {
        inlineData: {
            data: imageBuffer.toString("base64"),
            mimeType: "image/jpeg",
        },
    };

    try {
        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        
        console.log("Raw response from Gemini:", responseText);

        // --- NEW ROBUST PARSING LOGIC ---
        // 1. Use a regular expression to find the JSON block within the response text.
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            throw new Error("Could not find a JSON object in the Gemini response.");
        }

        const jsonString = jsonMatch[0];
        
        // 2. Parse the clean JSON string.
        const extractedData = JSON.parse(jsonString);
        return extractedData;

    } catch (error) {
        console.error("Error calling or parsing Gemini response:", error);
        throw new ApiError("Failed to process document with Gemini AI.", 500);
    }
}


/**
 * Helper function to determine gender from the Egyptian national ID.
 * @param {string} idNumber - The 14-digit national ID.
 * @returns {string|null} 'male' or 'female'.
 */
function getGenderFromId(idNumber) {
    if (!idNumber || idNumber.length !== 14) return null;
    const genderDigit = parseInt(idNumber.charAt(12));
    return (genderDigit % 2 !== 0) ? 'male' : 'female';
}


// Main function that combines all steps
export const processIdCardWithGemini = async (imageBuffer) => {
    // extractedData will be an object like { nationalId: '...', name: '...' }
    const extractedData = await extractDataWithGemini(imageBuffer);

    if (!extractedData || !extractedData.nationalId) {
        return { nationalId: null, name: null, gender: null };
    }

    const gender = getGenderFromId(extractedData.nationalId);

    return {
        nationalId: extractedData.nationalId,
        name: extractedData.name,
        gender: gender,
    };
};