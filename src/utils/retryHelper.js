/**
 * A helper function for retrying a failed operation with exponential backoff.
 * It intelligently handles 429 errors by respecting the 'retry-after' advice from the API.
 * @param {Function} fn - The async function to try.
 * @param {number} retries - The number of retries left.
 * @returns {Promise<any>}
 */
export async function retryWithBackoff(fn, retries = 3) {
    try {
        // Attempt to run the function
        return await fn();
    } catch (error) {
        // Check if we should retry based on the error type and remaining retries
        if (retries > 0 && (error.status === 503 || error.status === 429)) {
            let delay = 1000 * Math.pow(2, 4 - retries); // e.g., 2s, 4s, 8s

            // If Google provides a specific retry delay for a 429 error, use it.
            if (error.status === 429 && error.errorDetails?.[2]?.retryDelay) {
                const googleDelay = parseInt(error.errorDetails[2].retryDelay.replace('s', ''));
                delay = googleDelay * 1000 + 500; // Use Google's suggested delay + a small buffer
            }

            console.log(`API Error (${error.status}). Retrying in ${delay / 1000}s... (${retries} retries left)`);
            await new Promise(res => setTimeout(res, delay));
            
            // Recursively call the function with one less retry
            return retryWithBackoff(fn, retries - 1);
        } else {
            // If it's another error or retries are exhausted, throw it to be caught by the outer handler
            throw error;
        }
    }
}