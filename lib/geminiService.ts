import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import { S3Service } from './s3Service';

// Gemini API Configuration
const API_KEY = process.env.GEMINI_KEY;
const MODEL = 'gemini-2.5-flash-image-preview';
const TEMPERATURE = 1;
const CANDIDATES = 1;

// Initialize Google GenAI client
const ai = new GoogleGenAI({ apiKey: API_KEY });

interface GeminiCallResult {
  success: boolean;
  imageUrls?: string[];
  error?: string;
  runId?: string;
  latency?: number;
}

/**
 * Generate image using Gemini API with custom prompt and image URLs
 * @param prompt - The text prompt for image generation
 * @param imageUrls - Array of image URLs
 * @returns Promise<GeminiCallResult>
 */
export async function generateGeminiInference(
  prompt: string,
  imageUrls: string[]
): Promise<GeminiCallResult> {
  return makeGeminiApiCall(prompt, imageUrls, 1);
}

/**
 * Make a single Gemini API call with images and prompt
 * @param prompt - The text prompt for image generation
 * @param imageUrls - Array of image URLs (face and fullbody)
 * @param callNumber - Call number for tracking
 * @param retryCount - Current retry attempt (default: 0)
 * @returns Promise<GeminiCallResult>
 */
export async function makeGeminiApiCall(
  prompt: string,
  imageUrls: string[],
  callNumber: number,
  retryCount: number = 0
): Promise<GeminiCallResult> {
  const startTime = new Date();
  const maxRetries = 2; // Maximum 2 retries (3 total attempts)

  try {
    console.log(
      `Making Gemini API call ${callNumber}${
        retryCount > 0 ? ` (retry ${retryCount})` : ''
      } with prompt: ${prompt}`
    );
    console.log(`Image URLs: ${imageUrls.join(', ')}`);

    // Download images from URLs and convert to base64
    const imageParts = await Promise.all(
      imageUrls.map(async (url, index) => {
        try {
          const response = await axios.get(url, { responseType: 'arraybuffer' });
          const base64 = Buffer.from(response.data).toString('base64');

          // Better MIME type detection
          let mimeType = response.headers['content-type'] || 'image/jpeg';

          // Clean up MIME type and ensure it's valid for Gemini
          if (mimeType.includes('application/octet-stream')) {
            // Try to detect from URL extension
            if (url.includes('.png')) {
              mimeType = 'image/png';
            } else if (url.includes('.jpg') || url.includes('.jpeg')) {
              mimeType = 'image/jpeg';
            } else if (url.includes('.webp')) {
              mimeType = 'image/webp';
            } else {
              // Default to JPEG if we can't determine
              mimeType = 'image/jpeg';
            }
          }

          // Ensure MIME type is valid for Gemini API
          const validMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/heic',
            'image/heif'
          ];
          if (!validMimeTypes.includes(mimeType)) {
            mimeType = 'image/jpeg'; // Default fallback
          }

          console.log(`Image ${index + 1} MIME type: ${mimeType}`);

          return {
            inlineData: {
              data: base64,
              mimeType: mimeType
            }
          };
        } catch (error) {
          console.error(`Failed to download image ${index + 1}:`, error);
          throw new Error(`Failed to download image ${index + 1}: ${error}`);
        }
      })
    );

    // Prepare the content parts
    const parts = [{ text: prompt }, ...imageParts];

    // Generate content using the correct API
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ parts }],
      config: {
        temperature: TEMPERATURE,
        candidateCount: CANDIDATES
      }
    });

    const endTime = new Date();
    const latency = (endTime.getTime() - startTime.getTime()) / 1000;

    console.log(`Gemini API call ${callNumber} completed in ${latency}s`);

    // Process the response
    const candidates = response.candidates || [];
    const savedImageUrls: string[] = [];

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const parts = candidate.content?.parts || [];

      for (const part of parts) {
        if (part.inlineData?.data) {
          try {
            // Convert base64 to buffer
            const imageBuffer = Buffer.from(part.inlineData.data, 'base64');

            // Upload to S3
            const fileName = `gemini-inference/${Date.now()}-call${callNumber}-cand${i}.png`;
            const imageUrl = await S3Service.uploadFile(imageBuffer, fileName, 'image/png');

            savedImageUrls.push(imageUrl);
            console.log(`Uploaded generated image to S3: ${imageUrl}`);
          } catch (uploadError) {
            console.error(`Failed to upload generated image:`, uploadError);
          }
        }
      }
    }

    const runId = `${startTime.toISOString().replace(/[:.]/g, '')}_call${callNumber}`;

    return {
      success: true,
      imageUrls: savedImageUrls,
      runId,
      latency
    };
  } catch (error: any) {
    const endTime = new Date();
    const latency = (endTime.getTime() - startTime.getTime()) / 1000;

    console.error(`Gemini API call ${callNumber} failed:`, error);

    // Check if we should retry based on error type
    const shouldRetry =
      retryCount < maxRetries &&
      (error.status === 500 || // Internal server error
        error.status === 429 || // Rate limit
        error.message?.includes('Internal error') ||
        error.message?.includes('rate limit') ||
        error.message?.includes('timeout'));

    if (shouldRetry) {
      console.log(
        `Retrying Gemini API call ${callNumber} in 5 seconds... (attempt ${
          retryCount + 1
        }/${maxRetries})`
      );

      // Wait 5 seconds before retrying
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Retry the call
      return makeGeminiApiCall(prompt, imageUrls, callNumber, retryCount + 1);
    }

    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      latency
    };
  }
}
