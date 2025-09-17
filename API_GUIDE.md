# Gemini Inference API Guide

## Overview

The `/api/gemini-inference` endpoint combines Google's Gemini AI with advanced image processing and inpainting techniques. This guide shows you how to call the API with various programming languages and tools.

## API Endpoint

```
POST /api/gemini-inference
Content-Type: application/json
```

## Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `image_urls` | string[] | Yes | Array of image URLs or data URLs to process |
| `prompt` | string | Yes | Text prompt for Gemini AI generation |
| `characterLora` | object | Yes | Character LoRA configuration |
| `characterLora.path` | string | Yes | URL/path to character LoRA file |
| `characterLora.scale` | number | Yes | Scale factor for character LoRA (0.0-2.0) |
| `styleLora` | object | Yes | Style LoRA configuration |
| `styleLora.path` | string | No | URL/path to style LoRA file (can be empty) |
| `styleLora.scale` | number | Yes | Scale factor for style LoRA (0.0-2.0) |
| `inpaint_strength` | number | Yes | Inpainting strength (0.0-1.0) |

## Example Requests

### 1. JavaScript/TypeScript (Fetch API)

```javascript
const response = await fetch('/api/gemini-inference', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    image_urls: [
      "https://example.com/face-image.jpg",
      "https://example.com/reference-image.jpg"
    ],
    prompt: "A professional headshot of a person in business attire, high quality, studio lighting",
    characterLora: {
      path: "https://v3.fal.media/files/character/abc123_pytorch_lora_weights.safetensors",
      scale: 0.8
    },
    styleLora: {
      path: "https://v3.fal.media/files/style/def456_pytorch_lora_weights.safetensors",
      scale: 0.6
    },
    inpaint_strength: 0.75
  })
});

const result = await response.json();

if (result.success) {
  console.log('Generated images:', result.imageUrls);
  console.log('Metadata:', result.metadata);
} else {
  console.error('Error:', result.error);
}
```

### 2. Node.js (Axios)

```javascript
const axios = require('axios');

async function callGeminiInference() {
  try {
    const response = await axios.post('http://localhost:3000/api/gemini-inference', {
      image_urls: [
        "https://example.com/input-image.jpg"
      ],
      prompt: "Transform this person into a fantasy warrior character",
      characterLora: {
        path: "https://v3.fal.media/files/warrior/character_lora.safetensors",
        scale: 1.0
      },
      styleLora: {
        path: "https://v3.fal.media/files/fantasy/style_lora.safetensors",
        scale: 0.7
      },
      inpaint_strength: 0.8
    });

    console.log('Success:', response.data.success);
    console.log('Images:', response.data.imageUrls);
    console.log('Processing stats:', response.data.metadata);
    
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
  }
}

callGeminiInference();
```

### 3. Python (Requests)

```python
import requests
import json

def call_gemini_inference():
    url = "http://localhost:3000/api/gemini-inference"
    
    payload = {
        "image_urls": [
            "https://example.com/source-image.jpg",
            "https://example.com/style-reference.jpg"
        ],
        "prompt": "Create a cinematic portrait with dramatic lighting",
        "characterLora": {
            "path": "https://v3.fal.media/files/portrait/character.safetensors",
            "scale": 0.9
        },
        "styleLora": {
            "path": "https://v3.fal.media/files/cinematic/style.safetensors",
            "scale": 0.5
        },
        "inpaint_strength": 0.7
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        result = response.json()
        
        if result["success"]:
            print("Generated images:", result["imageUrls"])
            print("Metadata:", result["metadata"])
        else:
            print("Error:", result["error"])
            
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")

call_gemini_inference()
```

### 4. cURL

```bash
curl -X POST http://localhost:3000/api/gemini-inference \
  -H "Content-Type: application/json" \
  -d '{
    "image_urls": [
      "https://example.com/input.jpg"
    ],
    "prompt": "Professional business portrait with modern lighting",
    "characterLora": {
      "path": "https://v3.fal.media/files/business/character.safetensors",
      "scale": 0.8
    },
    "styleLora": {
      "path": "",
      "scale": 0.0
    },
    "inpaint_strength": 0.6
  }'
```

### 5. React Component Example

```jsx
import React, { useState } from 'react';

const GeminiInferenceComponent = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/gemini-inference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_urls: formData.imageUrls,
          prompt: formData.prompt,
          characterLora: {
            path: formData.characterLoraPath,
            scale: parseFloat(formData.characterLoraScale)
          },
          styleLora: {
            path: formData.styleLoraPath || "",
            scale: parseFloat(formData.styleLoraScale || 0)
          },
          inpaint_strength: parseFloat(formData.inpaintStrength)
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setResults(result);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Your form UI here */}
      {loading && <p>Processing... This may take up to 15 minutes.</p>}
      {error && <p>Error: {error}</p>}
      {results && (
        <div>
          <h3>Generated Images:</h3>
          {results.imageUrls.map((url, index) => (
            <img key={index} src={url} alt={`Generated ${index}`} />
          ))}
          <p>Processing time: {results.metadata.geminiLatency}s</p>
        </div>
      )}
    </div>
  );
};

export default GeminiInferenceComponent;
```

## Response Format

### Success Response

```json
{
  "success": true,
  "imageUrls": [
    "https://s3.amazonaws.com/bucket/final-image-1.jpg",
    "https://s3.amazonaws.com/bucket/final-image-2.jpg"
  ],
  "metadata": {
    "geminiRunId": "20250917123456_call1",
    "geminiLatency": 12.5,
    "inputImages": 2,
    "generatedImages": 1,
    "processedImages": 1
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Gemini inference failed: Invalid image format",
  "details": "Error stack trace (in development mode)"
}
```

## Use Cases & Examples

### 1. Portrait Enhancement

```json
{
  "image_urls": ["https://example.com/selfie.jpg"],
  "prompt": "Professional headshot with studio lighting and clean background",
  "characterLora": {
    "path": "https://v3.fal.media/files/portrait/professional.safetensors",
    "scale": 0.9
  },
  "styleLora": {
    "path": "https://v3.fal.media/files/studio/lighting.safetensors",
    "scale": 0.6
  },
  "inpaint_strength": 0.7
}
```

### 2. Style Transfer

```json
{
  "image_urls": ["https://example.com/photo.jpg"],
  "prompt": "Transform into anime art style with vibrant colors",
  "characterLora": {
    "path": "https://v3.fal.media/files/anime/character.safetensors",
    "scale": 0.8
  },
  "styleLora": {
    "path": "https://v3.fal.media/files/anime/vibrant.safetensors",
    "scale": 1.0
  },
  "inpaint_strength": 0.8
}
```

### 3. Character Transformation

```json
{
  "image_urls": ["https://example.com/person.jpg"],
  "prompt": "Transform into a medieval knight with armor and heroic pose",
  "characterLora": {
    "path": "https://v3.fal.media/files/medieval/knight.safetensors",
    "scale": 1.0
  },
  "styleLora": {
    "path": "https://v3.fal.media/files/medieval/armor.safetensors",
    "scale": 0.7
  },
  "inpaint_strength": 0.9
}
```

## Best Practices

### 1. Image URLs
- Use high-quality images (minimum 512x512 pixels)
- Ensure images are publicly accessible
- Support for JPEG, PNG, WebP formats
- Can use data URLs for direct image data

### 2. Prompts
- Be specific and descriptive
- Include lighting, style, and composition details
- Avoid conflicting instructions
- Consider the target use case

### 3. LoRA Configuration
- Character LoRA scale: 0.7-1.0 for strong character features
- Style LoRA scale: 0.5-0.8 for balanced style application
- Leave style LoRA path empty if not needed

### 4. Inpaint Strength
- 0.3-0.5: Subtle changes, preserve original features
- 0.6-0.8: Balanced transformation
- 0.9-1.0: Strong transformation, may lose original features

## Error Handling

Common errors and solutions:

### 1. Timeout Errors
```json
{
  "success": false,
  "error": "Request timeout after 15 minutes"
}
```
**Solution**: Reduce number of input images or simplify the prompt.

### 2. Invalid LoRA Paths
```json
{
  "success": false,
  "error": "Failed to load LoRA: Invalid URL"
}
```
**Solution**: Verify LoRA URLs are accessible and in correct format.

### 3. Image Download Errors
```json
{
  "success": false,
  "error": "Failed to download image: Network error"
}
```
**Solution**: Ensure image URLs are publicly accessible.

### 4. NSFW Content Detection
The API automatically handles NSFW content by using the original image instead of the generated result.

## Rate Limiting & Performance

- **Timeout**: Maximum 15 minutes per request
- **Concurrent requests**: Limited by server capacity
- **Image processing**: Each image processed sequentially
- **Optimal batch size**: 1-3 images per request

## Development vs Production

### Development
```javascript
const API_URL = 'http://localhost:3000/api/gemini-inference';
```

### Production
```javascript
const API_URL = 'https://your-domain.com/api/gemini-inference';
```

## Testing the API

Use this simple test script:

```javascript
// test-api.js
const testData = {
  image_urls: ["https://picsum.photos/512/512"],
  prompt: "A professional portrait with soft lighting",
  characterLora: {
    path: "https://example.com/character.safetensors",
    scale: 0.8
  },
  styleLora: {
    path: "",
    scale: 0.0
  },
  inpaint_strength: 0.7
};

fetch('/api/gemini-inference', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
```

## Support

If you encounter issues:

1. Check the console logs for detailed error messages
2. Verify all required environment variables are set
3. Ensure image URLs are accessible
4. Test with simpler prompts first
5. Check LoRA file accessibility and format

---

*Note: This API requires proper environment setup including FAL_KEY, AWS credentials, and S3 bucket configuration.*
