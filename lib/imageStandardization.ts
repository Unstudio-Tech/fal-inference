interface StandardizeResponse {
  status: string;
  message?: string;
  data?: {
    url: string;
  };
}

/**
 * Standardize a single image using the standardization API
 * @param imageUrl - URL of the image to standardize
 * @returns Promise<string> - URL of the standardized image (or original if standardization fails)
 */
export const standardizeImage = async (imageUrl: string): Promise<string> => {
    try {
        console.log('🔄 Standardizing image:', imageUrl);
        
        const response = await fetch('http://35.175.150.131:6001/standardize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image_url: imageUrl,
                upload_to_s3: true
            })
        });

        if (!response.ok) {
            throw new Error(`Standardization API returned status: ${response.status}`);
        }

        const result: StandardizeResponse = await response.json();
        
        if (result.status === 'success' && result.data?.url) {
            console.log('✅ Image standardized successfully:', result.data.url);
            return result.data.url;
        } else {
            throw new Error(`Standardization failed: ${result.message || 'Unknown error'}`);
        }
    } catch (error: any) {
        console.warn('⚠️ Image standardization failed, using original URL:', error.message);
        return imageUrl; // Return original URL as fallback
    }
};

/**
 * Standardizes multiple images in parallel
 * @param imageUrls - Array of image URLs to standardize
 * @returns Promise<string[]> - Array of standardized image URLs (or original URLs if standardization fails)
 */
export const standardizeImages = async (imageUrls: string[]): Promise<string[]> => {
    try {
        console.log(`🔄 Standardizing ${imageUrls.length} images in parallel...`);
        
        const standardizationPromises = imageUrls.map(url => standardizeImage(url));
        const standardizedUrls = await Promise.all(standardizationPromises);
        
        console.log('✅ All images processed (standardized or fallback to original)');
        return standardizedUrls;
    } catch (error: any) {
        console.error('❌ Error in batch image standardization:', error);
        // Return original URLs as fallback
        return imageUrls;
    }
};
