import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { fal } from "@fal-ai/client";
import { generateGeminiInference } from "../../../lib/geminiService";
import { standardizeImages } from "../../../lib/imageStandardization";

export const maxDuration = 800; // 15 minutes

// Set FAL API Key
fal.config({
  credentials: process.env.FAL_KEY!,
});

// Constants
const GEN_MASK_ENDPOINT = "http://18.206.182.174/generate-mask/";
const NEW_MASK_ENDPOINT = "http://52.206.97.181:8000/mask/from-url";
const PASTE_BACK_ENDPOINT = "http://18.206.182.174/paste-back/";

interface LoraConfig {
  path: string;
  scale: number;
}

interface RequestBody {
  image_urls: string[];
  prompt: string;
  characterLora: LoraConfig;
  styleLora: LoraConfig;
  inpaint_strength: number;
  temperature?: number;
}

interface MaskAPIResponse {
  upscaled_image_s3_url: string;
  cropped_image_s3_url: string;
  cropped_image_mask_s3_url: string;
  actual_mask_s3_url: string;
  cropped_image_mask_dims: { width: number; height: number };
}

interface NewMaskAPIResponse {
  image_url: string;
}

interface PasteBackResponse {
  final_image_url: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const {
      image_urls,
      prompt,
      characterLora,
      styleLora,
      inpaint_strength,
      temperature = 1,
    } = body;

    console.log('🚀 Starting Gemini-based inference workflow');
    console.log('📝 Prompt:', prompt);
    console.log('🖼️ Input images:', image_urls.length);
    console.log('🎭 Character LoRA:', characterLora);
    console.log('🎨 Style LoRA:', styleLora);
    console.log('💪 Inpaint strength:', inpaint_strength);
    console.log('🌡️ Temperature:', temperature);

    // Step 1: Generate images using Gemini inference
    console.log('📌 Step 1: Running Gemini inference...');
    const geminiResult = await generateGeminiInference(prompt, image_urls, temperature);
    
    if (!geminiResult.success || !geminiResult.imageUrls || geminiResult.imageUrls.length === 0) {
      throw new Error(`Gemini inference failed: ${geminiResult.error || 'No images generated'}`);
    }

    console.log('✅ Gemini inference completed');
    console.log('🖼️ Generated images:', geminiResult.imageUrls.length);

    // Step 2: Standardize the generated images
    console.log('📌 Step 2: Standardizing images...');
    const standardizedImageUrls = await standardizeImages(geminiResult.imageUrls);
    console.log('✅ Image standardization completed');

    const finalImageUrls: string[] = [];
    
    // Prepare LoRA paths for inpainting
    const loraPathsForInpainting = [
      { path: characterLora.path, scale: characterLora.scale }
    ];
    
    // Add style LoRA if provided
    if (styleLora.path && styleLora.path.trim().length > 0) {
      loraPathsForInpainting.push({
        path: styleLora.path,
        scale: styleLora.scale
      });
    }
    
    console.log('🎨 LoRA paths for inpainting:', loraPathsForInpainting);

    // Step 3-6: Process each standardized image through the inpainting workflow
    for (let i = 0; i < standardizedImageUrls.length; i++) {
      const imageUrl = standardizedImageUrls[i];
      console.log(`📌 Processing image ${i + 1}/${standardizedImageUrls.length}: ${imageUrl}`);

      try {
        // Step 3: Generate mask using GEN_MASK_ENDPOINT
        console.log('🎭 Step 3: Generating face mask...');
        const { data: maskData } = await axios.post<MaskAPIResponse>(
          GEN_MASK_ENDPOINT,
          {
            image_url: imageUrl,
          }
        );

        const {
          upscaled_image_s3_url,
          cropped_image_s3_url,
          cropped_image_mask_s3_url,
          actual_mask_s3_url,
          cropped_image_mask_dims,
        } = maskData;

        const { width, height } = cropped_image_mask_dims;
        console.log('✅ Face mask generated successfully');

        // Step 4: Generate white mask using NEW_MASK_ENDPOINT
        console.log('🔳 Step 4: Generating white mask...');
        const { data: newMaskData } = await axios.post<NewMaskAPIResponse>(
          NEW_MASK_ENDPOINT,
          {
            url: cropped_image_s3_url,
          }
        );

        const maskUrl = newMaskData.image_url;
        console.log('✅ White mask generated:', maskUrl);

        // Step 5: FAL Inpainting with LoRAs
        console.log('🎨 Step 5: Starting FAL inpainting...');
        const paintRes = await fal.subscribe("fal-ai/flux-lora/inpainting", {
          input: {
            prompt: "UNST, a person standing against a background",
            image_url: cropped_image_s3_url,
            mask_url: maskUrl,
            loras: loraPathsForInpainting,
            strength: inpaint_strength,
            image_size: { width, height },
          },
          logs: true,
        });

        const hasNSFW = paintRes.data?.has_nsfw_concepts?.[0] === true;
        let imageToPaste = cropped_image_s3_url;

        if (hasNSFW) {
          console.warn("⚠️ NSFW content detected in inpainting result. Using original cropped image.");
        } else {
          const inpaintImg = paintRes.data?.images?.[0]?.url;
          if (inpaintImg) {
            imageToPaste = inpaintImg;
            console.log('✅ Inpainting completed successfully');
          } else {
            console.warn("⚠️ Inpainting result missing. Using original image.");
          }
        }

        // Step 6: Paste back using PASTE_BACK_ENDPOINT
        console.log('🔄 Step 6: Pasting back final image...');
        const { data: pasteRes } = await axios.post<PasteBackResponse>(
          PASTE_BACK_ENDPOINT,
          {
            inpaint_url: imageToPaste,
            upscaled_url: upscaled_image_s3_url,
            actual_mask_url: actual_mask_s3_url,
          }
        );

        console.log('✅ Paste back completed');
        console.log('🖼️ Final image URL:', pasteRes.final_image_url);

        finalImageUrls.push(pasteRes.final_image_url);
      } catch (imageError) {
        console.error(`❌ Error processing image ${i + 1}:`, imageError);
        // Continue with other images instead of failing completely
        continue;
      }
    }

    if (finalImageUrls.length === 0) {
      throw new Error('No images were successfully processed');
    }

    console.log('🎉 Workflow completed successfully!');
    console.log('📊 Final results:', {
      inputImages: image_urls.length,
      generatedImages: geminiResult.imageUrls?.length || 0,
      processedImages: finalImageUrls.length,
    });

    return NextResponse.json({ 
      success: true, 
      imageUrls: finalImageUrls,
      metadata: {
        geminiRunId: geminiResult.runId,
        geminiLatency: geminiResult.latency,
        inputImages: image_urls.length,
        generatedImages: geminiResult.imageUrls?.length || 0,
        processedImages: finalImageUrls.length,
      }
    });
  } catch (err) {
    console.error("❌ Error in Gemini inference API:", err);
    return NextResponse.json(
      { 
        success: false, 
        error: err instanceof Error ? err.message : "Failed to process images",
        details: err instanceof Error ? err.stack : undefined
      },
      { status: 500 }
    );
  }
}
