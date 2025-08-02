import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { fal } from "@fal-ai/client";
export const maxDuration = 800; // 5 minutes;

// Set FAL API Key
fal.config({
  credentials: process.env.FAL_KEY!,
});

// Constants
const GEN_MASK_ENDPOINT = "http://18.206.182.174/generate-mask/";
const PASTE_BACK_ENDPOINT = "http://18.206.182.174/paste-back/";

interface LoraInput {
  loraPath: string;
  scale: number;
}

interface RequestBody {
  prompt: string;
  loraPaths: LoraInput[];
  numberOfImages: number;
  strength: number;
  inpaintingStyleLoraScale: number;
  inpaintingCharacterLoraScale: number;
  characterLora: string;
  characterLoraScale: number;
  styleLora: string;
  styleLoraScale: number;
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
    const {
      prompt,
      loraPaths,
      numberOfImages,
      strength,
      inpaintingStyleLoraScale,
      inpaintingCharacterLoraScale,
      characterLora,
      characterLoraScale,
      styleLora,
      styleLoraScale,
    } = body;
    //console.log('Lora paths initially : ', loraPaths)
   
    //console.log(loraPathsForInference)

    var loraPathsforInference = [{path:characterLora, scale:characterLoraScale}]
    if(styleLora.trim().length > 0){
      let styeLoraObject = {path:styleLora, scale:styleLoraScale}
      loraPathsforInference.push(styeLoraObject)
    }
    console.log('Lora paths for inference (1st character lora , 2nd style lora) : ')
    console.log(loraPathsforInference);
    const imageGenerationPromises = Array.from(
      { length: numberOfImages },
      (_, i) => {
        const payload = {
          prompt,
          loras: loraPathsforInference,
          guidance_scale: 3.5,
          image_size: { width: 800, height: 1200 },
          num_inference_steps: 28,
        };

        // console.log("Payload ")
        //  console.log(payload)

        return fal.subscribe("fal-ai/flux-lora", {
          input: payload as any,
        });
      }
    );
    console.log("Starting fal inferences");
    const responses = await Promise.all(imageGenerationPromises);
    const rawImageUrls: string[] = responses
      .map((res) => res?.data?.images?.[0]?.url)
      .filter(Boolean);
    console.log("FAL Inferences done!");


    
    // const loraPathsForInpainting = loraPaths.map((lora, index) => ({
    //   path: lora.loraPath,
    //   scale:
    //     index === 0
    //       ? inpaintingCharacterLoraScale
    //       : index === 1
    //       ? inpaintingStyleLoraScale
    //       : lora.scale,
    // }));

    const finalImageUrls: string[] = [];
    const loraPathsForInpainting = [{path:characterLora, scale:inpaintingCharacterLoraScale}];

  if(styleLora.trim().length > 0){
      let styeLoraObject = {path:styleLora, scale:styleLoraScale}
      loraPathsForInpainting.push(styeLoraObject)
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

      // [
      //   {
      //     path: 'https://v3.fal.media/files/zebra/gZpsusIXhfluewb2xFdBJ_pytorch_lora_weights.safetensors',
      //     scale: 0.3
      //   },
      //   {
      //     path: 'https://v3.fal.media/files/monkey/aFFv3yM2x7v_0t8-ZxdkG_pytorch_lora_weights.safetensors',
      //     scale: 1
      //   }
      // ]

      const { width, height } = cropped_image_mask_dims;
      console.log("Starting inpainting");

  
      const paintRes = await fal.subscribe("fal-ai/flux-lora/inpainting", {
        input: {
          prompt: "UNST, a person standing against a background",
          image_url: cropped_image_s3_url,
          mask_url: cropped_image_mask_s3_url,
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
          console.warn("⚠️ Inpainting result missing. Skipping this image.");
          continue;
        }
      }

      const { data: pasteRes } = await axios.post(PASTE_BACK_ENDPOINT, {
        inpaint_url: imageToPaste,
        upscaled_url: upscaled_image_s3_url,
        actual_mask_url: actual_mask_s3_url,
      });

      console.log('Pasted back final image : ', pasteRes.final_image_url);

      finalImageUrls.push(pasteRes.final_image_url);
    }

    console.log("Final image urls ");
    console.log(finalImageUrls);

    return NextResponse.json({ success: true, imageUrls: finalImageUrls });
  } catch (err) {
    console.error("❌ Error in API:", err);
    return NextResponse.json(
      { success: false, error: "Failed to generate images" },
      { status: 500 }
    );
  }
}
