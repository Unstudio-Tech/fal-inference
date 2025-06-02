import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { fal } from "@fal-ai/client";
export const maxDuration = 800; // 5 minutes;

// Set FAL API Key
fal.config({
  credentials: process.env.FAL_KEY!,
});

// Constants
const GEN_MASK_ENDPOINT = 'http://35.224.44.188:8000/generate-mask/';
const PASTE_BACK_ENDPOINT = 'http://35.224.44.188:8000/paste-back/';

interface LoraInput {
  loraPath: string;
  scale: number;
}

interface RequestBody {
  prompt: string;
  loraPaths: LoraInput[];
  numberOfImages: number;
  strength: number;
  inpaintingStyleLoraScale:number;
}

interface MaskAPIResponse {
  upscaled_image_s3_url: string;
  cropped_image_s3_url: string;
  cropped_image_mask_s3_url: string;
  actual_mask_s3_url: string;
  cropped_image_mask_dims: { width: number; height: number };
}

//export const maxDuration = 900; // 15 minutes timeout

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const { prompt, loraPaths, numberOfImages, strength,inpaintingStyleLoraScale } = body;
    //console.log('Lora paths initially : ', loraPaths)
    const loraPathsForInference = loraPaths;
    //console.log(loraPathsForInference)

    const imageGenerationPromises = Array.from({ length: numberOfImages }, (_, i) => {

      const payload = {
        prompt,
        loras: loraPathsForInference.map(lora => ({
            path: lora.loraPath, // <-- Fix here
            scale: lora.scale,
          })),        guidance_scale: 3.5,
        image_size: { width: 800, height: 1200 },
        num_inference_steps: 28}

      console.log("Payload ")
      console.log(payload)

      return fal.subscribe('fal-ai/flux-lora', {
        input: payload
      });
    });
    console.log('Starting fal inferences')
    const responses = await Promise.all(imageGenerationPromises);
    const rawImageUrls: string[] = responses.map((res) => res?.data?.images?.[0]?.url).filter(Boolean);
    console.log('FAL Inferences done!')

    const loraPathsForInpainting = loraPaths;
    

    const finalImageUrls: string[] = [];
    for (const imageUrl of rawImageUrls) {
    console.log('Starting face mask process')
      const { data: maskData } = await axios.post<MaskAPIResponse>(GEN_MASK_ENDPOINT, {
        image_url: imageUrl,
      });

      const {
        upscaled_image_s3_url,
        cropped_image_s3_url,
        cropped_image_mask_s3_url,
        actual_mask_s3_url,
        cropped_image_mask_dims,
      } = maskData;

      const { width, height } = cropped_image_mask_dims;
      console.log('Starting inpainting')
      const paintRes = await fal.subscribe('fal-ai/flux-lora/inpainting', {
        input: {
          prompt: 'UNST, a person standing against a background',
          image_url: cropped_image_s3_url,
          mask_url: cropped_image_mask_s3_url,
          loras: loraPathsForInference.map((lora, index) => ({
            path: lora.loraPath,
            scale: index === 1 ? inpaintingStyleLoraScale : lora.scale,
          })),
          strength,
          image_size: { width, height },
        },
        logs: true,
      });

      const inpaintImg = paintRes.data?.images?.[0]?.url;
      console.log('Inpainting result : ', inpaintImg)
      if (!inpaintImg) continue;
      
      const { data: pasteRes } = await axios.post(PASTE_BACK_ENDPOINT, {
        inpaint_url: inpaintImg,
        upscaled_url: upscaled_image_s3_url,
        actual_mask_url: actual_mask_s3_url,
      });
          
      finalImageUrls.push(pasteRes.final_image_url);
    }

    console.log("Final image urls ")
    console.log(finalImageUrls);
      

    return NextResponse.json({ success: true, imageUrls: finalImageUrls });
  } catch (err) {
    console.error('❌ Error in API:', err);
    return NextResponse.json({ success: false, error: 'Failed to generate images' }, { status: 500 });
  }
}
