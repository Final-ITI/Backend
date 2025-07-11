import { GoogleGenerativeAI } from "@google/generative-ai";
import ApiError from "../utils/apiError.js";
import { retryWithBackoff } from "../utils/retryHelper.js";
import sharp from "sharp";

/**
 * Pre-processes an image buffer to improve OCR accuracy.
 * @param {Buffer} imageBuffer - The original image buffer.
 * @returns {Promise<Buffer>} The processed image buffer.
 */
async function preprocessImage(imageBuffer) {
  try {
    console.log("Preprocessing image with sharp...");
    // This pipeline enhances the image for better text recognition.
    return await sharp(imageBuffer)
      .grayscale() // Convert to black and white to improve contrast
      .normalize() // Stretches contrast to cover the full range of brightness
      .sharpen() // Sharpens text edges
      .toBuffer(); // Return the processed image as a new buffer
  } catch (error) {
    console.error("Error during image preprocessing with sharp:", error);
    return imageBuffer; // If processing fails, use the original image
  }
}

// Initialize the client with your API key
const genAI = new GoogleGenerativeAI("AIzaSyA7ockZM7TuXWN2AE-eKZKybd2GP4Qz4Vk");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Extracts structured data from an Egyptian ID card image using a detailed prompt.
 * @param {Buffer} imageBuffer - The image file buffer.
 * @param {('front'|'back')} side - The side of the ID card being analyzed.
 * @returns {Promise<object|null>} An object containing the extracted data.
 */
async function extractDataFromId(imageBuffer, side) {
  console.log(`Starting AI data extraction for ID card [${side}]...`);

  // 2. Pre-process the image to improve clarity before sending it to the AI.
  const processedBuffer = await preprocessImage(imageBuffer);

  // A highly specific prompt to guide the AI
  const prompt = `You are an expert data extraction assistant for Egyptian identity cards.
    Analyze the provided image which is the "${side}" side of the card.
    Extract the following fields based on the side provided:

    If the side is "front":
    - "fullName": The full name as written.
    - "address": The full address.
    - "nationalId": The 14-digit National ID number.

    If the side is "back":
    - "gender": The gender ("ذكر" or "أنثى").
    - "expiryDate": The card's expiry date in YYYY/MM/DD format.

    You MUST return the output ONLY in a valid JSON format. Do not add any introductory text, conversation, or markdown formatting.
    If a field is not visible, return null for its value.

    Example for a "front" image:
    {
      "fullName": "خالد علي محمد احمد",
      "address": "١ ش الزراعيين - تقسيم ٢ اول كفر الشيخ - كفر الشيخ",
      "nationalId": "29501011234567"
    }

    Example for a "back" image:
    {
      "gender": "أنثى",
      "expiryDate": "2028/10/02"
    }`;

  const imagePart = {
    inlineData: {
      data: processedBuffer.toString("base64"),
      mimeType: "image/jpeg",
    },
  };

  // The function that makes the actual API call
  const apiCall = async () => {
    const result = await model.generateContent([prompt, imagePart]);
    return result.response.text();
  };

  try {
    // Wrap the API call in our retry helper
    const responseText = await retryWithBackoff(apiCall);

    console.log(`Raw response from Gemini for [${side}]:`, responseText);

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not find a JSON object in the Gemini response.");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error(`Error processing [${side}] side with Gemini:`, error);
    // Check if the error is from the API or our own parsing
    if (error instanceof ApiError) {
      throw error;
    }
    // Throw a new generic error for other cases
    throw new ApiError(`Failed to process ${side} of ID with Gemini AI.`, 500);
  }
}

// Export the main function to be used in controllers
export const processIdCardSide = extractDataFromId;
