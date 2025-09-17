# fal-inference

## API Endpoints

### `/api/gemini-inference` - Gemini-based Image Generation and Inpainting

A serverless API endpoint with a 15-minute timeout that combines Gemini AI image generation with advanced inpainting techniques.

#### Request Format

```json
{
  "image_urls": ["string[]"],
  "prompt": "string",
  "characterLora": {
    "path": "string",
    "scale": "number"
  },
  "styleLora": {
    "path": "string", 
    "scale": "number"
  },
  "inpaint_strength": "number (0-1)"
}
```

#### Workflow

1. **Gemini Inference**: Uses Google's Gemini AI to generate images based on the provided prompt and input images
2. **Image Standardization**: Processes generated images through standardization API
3. **Mask Generation**: Creates face masks using the GEN_MASK_ENDPOINT
4. **White Mask Creation**: Generates white masks using the NEW_MASK_ENDPOINT  
5. **FAL Inpainting**: Applies character and style LoRAs using FAL's inpainting service
6. **Paste Back**: Combines inpainted results with original images using PASTE_BACK_ENDPOINT

#### Response Format

```json
{
  "success": true,
  "imageUrls": ["string[]"],
  "metadata": {
    "geminiRunId": "string",
    "geminiLatency": "number",
    "inputImages": "number",
    "generatedImages": "number", 
    "processedImages": "number"
  }
}
```

#### Environment Variables Required

```bash
FAL_KEY=your_fal_api_key
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your_bucket_name
```

### Other Endpoints

#### `/api/inference` - Standard FAL Inference
Standard inference workflow with LoRA support.

#### `/api/inference-image` - Image-based Inference  
Processes existing images through the inpainting pipeline.

## Content
