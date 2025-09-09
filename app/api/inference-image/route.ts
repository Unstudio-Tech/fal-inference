import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { fal } from "@fal-ai/client";

export const maxDuration = 800; // 5 minutes

// Set FAL API Key
fal.config({
  credentials: process.env.FAL_KEY!,
});

// Constants
const GEN_MASK_ENDPOINT = "http://18.206.182.174/generate-mask/";
const NEW_MASK_ENDPOINT = "http://52.206.97.181:8000/mask/from-url";
const PASTE_BACK_ENDPOINT = "http://18.206.182.174/paste-back/";

interface LoraInput {
  loraPath: string;
  scale: number;
}

interface RequestBody {
  imageUrl: string;
  loraPaths: LoraInput[];
  strength: number;
  inpaintingStyleLoraScale: number;
  inpaintingCharacterLoraScale: number;
  characterLora: string;
  characterLoraScale: number;
  styleLora: string;
  styleLoraScale: number;
  seed?: number;
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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const {
      imageUrl,
      loraPaths,
      strength,
      inpaintingStyleLoraScale,
      inpaintingCharacterLoraScale,
      characterLora,
      characterLoraScale,
      styleLora,
      styleLoraScale,
      seed,
    } = body;

    console.log('Processing image URL:', imageUrl);

    // Use the provided image URL directly instead of generating new images
    const rawImageUrls: string[] = [imageUrl];

    const finalImageUrls: string[] = [];
    const loraPathsForInpainting = [{path: characterLora, scale: inpaintingCharacterLoraScale}];

    if(styleLora.trim().length > 0){
      let styleLoraObject = {path: styleLora, scale: styleLoraScale}
      loraPathsForInpainting.push(styleLoraObject)
    }
    console.log("Lora paths for inpainting ", loraPathsForInpainting);

    for (const imageUrl of rawImageUrls) {
      console.log("Starting face mask process");
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
      console.log("Starting inpainting");

      // Call new mask endpoint to get mask from cropped image
      console.log("Calling new mask endpoint with cropped image");
      const { data: newMaskData } = await axios.post<NewMaskAPIResponse>(
        NEW_MASK_ENDPOINT,
        {
          url: cropped_image_s3_url,
        }
      );

      const maskUrl = newMaskData.image_url;
      console.log("Received mask URL from new endpoint:", maskUrl);

      // Use FAL for inpainting with the provided LoRAs
      console.log("Starting FAL inpainting with LoRAs");
      const paintRes = await fal.subscribe("fal-ai/flux-lora/inpainting", {
        input: {
          prompt: "UNST, a person standing against a background",
          image_url: cropped_image_s3_url,
          mask_url: maskUrl,
          loras: loraPathsForInpainting,
          strength,
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
        } else {
          console.warn("⚠️ Inpainting result missing. Using original image.");
        }
      }

      const { data: pasteRes } = await axios.post(PASTE_BACK_ENDPOINT, {
        inpaint_url: imageToPaste,
        upscaled_url: upscaled_image_s3_url,
        actual_mask_url: actual_mask_s3_url,
      });

      console.log(pasteRes)
      console.log('Pasted back final image : ', pasteRes.final_image_url);

      finalImageUrls.push(pasteRes.final_image_url);
    }

    console.log("Final image urls ");
    console.log(finalImageUrls);

    return NextResponse.json({ success: true, imageUrls: finalImageUrls });
  } catch (err) {
    console.error("❌ Error in API:", err);
    return NextResponse.json(
      { success: false, error: "Failed to process image" },
      { status: 500 }
    );
  }
}
