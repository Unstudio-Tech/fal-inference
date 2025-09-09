"use client";

import { useState } from "react";
import { Info, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Home() {
  // State for form values
  const [inputMode, setInputMode] = useState<"prompt" | "image">("prompt");
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [characterLora, setcharacterLora] = useState("");
  const [styleLora, setstyleLora] = useState("https://v3.fal.media/files/lion/xL15uZku8d1wNj98Z-cSC_pytorch_lora_weights.safetensors");
  const [characterLoraScale, setcharacterLoraScale] = useState(1.2);
  const [styleLoraScale, setStyleLoraScale] = useState(0.1);
  const [inpaintingStyleLora, setInpaintingStyleLora] = useState("");
  const [inpaintingStyleLoraScale, setInpaintingStyleLoraScale] = useState(0.6);
  const [inpaintingCharacterLoraScale, setInpaintingCharacterLoraScale] =
    useState(0.9);
  const [inpaintingStyleLoraStrength, setInpaintingStyleLoraStrength] =
    useState(0.35);
  const [resultImages, setResultImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [noOfImages, setNoOfImages] = useState(2);
  const [seed, setSeed] = useState(0);

  
  const handleForm = async () => {
    // Validate based on input mode
    if (inputMode === "prompt" && (!prompt || !characterLora)) {
      alert("Please fill in prompt and character LoRA fields");
      return;
    }
    if (inputMode === "image" && (!imageUrl || !characterLora)) {
      alert("Please fill in image URL and character LoRA fields");
      return;
    }

    setIsLoading(true); // Start loading
    
    const baseRequestBody = {
      loraPaths: [
        { loraPath: characterLora, scale: characterLoraScale },
        { loraPath: styleLora, scale: styleLoraScale },
      ],
      strength: inpaintingStyleLoraStrength,
      characterLora,
      characterLoraScale,
      styleLora,
      styleLoraScale,
      inpaintingStyleLoraScale,
      inpaintingCharacterLoraScale,
      seed,
    };

    let requestBody;
    let apiEndpoint;

    if (inputMode === "prompt") {
      requestBody = {
        ...baseRequestBody,
        prompt,
        numberOfImages: Number(noOfImages),
      };
      apiEndpoint = "/api/inference";
    } else {
      requestBody = {
        ...baseRequestBody,
        imageUrl,
      };
      apiEndpoint = "/api/inference-image";
    }

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errData = await response.json();
        console.error("❌ Error:", errData);
        alert("Something went wrong. Check the console for more details.");
        return;
      }

      const data = await response.json();
      console.log("✅ Generated image URLs:", data.imageUrls);
      setResultImages(data.imageUrls);
    } catch (error) {
      console.error("❌ Fetch error:", error);
      alert("An error occurred during inference.");
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  const handleReset = () => {
    setInputMode("prompt");
    setPrompt("");
    setImageUrl("");
    setcharacterLora("");
    setcharacterLoraScale(0.6);
    setstyleLora("");
    setStyleLoraScale(0.9);
    setInpaintingStyleLora("");
    setInpaintingStyleLoraScale(0.6);
    setInpaintingStyleLoraStrength(0.5);
    setSeed(0);
  };

  // Individual reset functions
  const resetCharacterLoraPath = () => {
    setcharacterLora("");
  };
  const resetCharacterLoraScale = () => {
    setcharacterLoraScale(0.6);
  };
  const resetStyleLoraPath = () => {
    setstyleLora("");
  };
  const resetStyleLoraScale = () => {
    setStyleLoraScale(0.5);
  };
  const resetInpaintingStyleLoraScale = () => setInpaintingStyleLoraScale(0.6);
  const resetInpaintingStyleLoraStrength = () =>
    setInpaintingStyleLoraStrength(0.5);
  const resetInpaintingCharacterStyleLoraStrength = () =>
    setInpaintingCharacterLoraScale(0.6);
  const resetNoOfImages = () => setNoOfImages(1);
  const resetSeed = () => setSeed(0);

  return (
    <div className="flex min-h-screen bg-[#1e1c1c] text-white">
      {/* Left panel - Input form */}
      <div className="w-full md:w-1/2 p-6 border-r border-gray-800">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Input</h2>
        </div>

        {/* Input Mode Toggle */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <label className="font-medium">Input Mode</label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 ml-2">
                    <Info size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Choose between text prompt or image URL input</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex gap-2">
            <Button
              variant={inputMode === "prompt" ? "default" : "outline"}
              onClick={() => setInputMode("prompt")}
              className={inputMode === "prompt" ? "bg-purple-500 hover:bg-purple-700" : "text-black"}
            >
              Text Prompt
            </Button>
            <Button
              variant={inputMode === "image" ? "default" : "outline"}
              onClick={() => setInputMode("image")}
              className={inputMode === "image" ? "bg-purple-500 hover:bg-purple-700" : "text-black"}
            >
              Image URL
            </Button>
          </div>
        </div>

        {/* Prompt or Image URL */}
        {inputMode === "prompt" ? (
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <label className="font-medium">Prompt</label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5 ml-2">
                      <Info size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter your image generation prompt</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <textarea
              className="w-full h-24 bg-[#1e1e1e] border border-gray-700 rounded-md p-3 text-sm"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
            />
          </div>
        ) : (
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <label className="font-medium">Image URL</label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5 ml-2">
                      <Info size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter the URL of the image you want to process</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              className="w-full bg-[#1e1e1e] border border-gray-700"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        )}

        {/* Loras section */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <label className="font-medium">Loras</label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 ml-2">
                    <Info size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add LoRA models to enhance generation</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* First LoRA Path */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <label className="text-sm font-medium ml-4">
                Character Lora Path
              </label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-2"
                    >
                      <Info size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter the path to your LoRA model</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex">
              <Input
                className="flex-1 bg-[#1e1e1e] border border-gray-700"
                value={characterLora}
                onChange={(e) => setcharacterLora(e.target.value)}
                placeholder="https://v3.fal.media/files/monkey/..."
              />
              <Button
                variant="outline"
                size="icon"
                className="ml-2"
                onClick={resetCharacterLoraPath}
              >
                <span className="sr-only">Delete</span>
                <span>🗑️</span>
              </Button>
            </div>
          </div>

          {/* First LoRA Scale */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <label className="text-sm font-medium ml-4">
                Character Lora Scale
              </label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-2"
                    >
                      <Info size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Adjust the scale of this LoRA model</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center">
              <div className="flex-1 mr-2">
                <Slider
                  defaultValue={[0.9]}
                  max={1}
                  step={0.01}
                  value={[characterLoraScale]}
                  onValueChange={(values) => setcharacterLoraScale(values[0])}
                />
              </div>
              <div className="w-20">
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={characterLoraScale}
                  onChange={(e) =>
                    setcharacterLoraScale(Number(e.target.value))
                  }
                  className="bg-[#1e1e1e] border border-gray-700"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="ml-2 text-black"
                onClick={resetCharacterLoraScale}
              >
                <span className="sr-only">Reset</span>
                <span>↺</span>
              </Button>
            </div>
          </div>

          {/* Second LoRA Path */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <label className="text-sm font-medium ml-4">
                Style Lora Path
              </label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-2"
                    >
                      <Info size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter the path to your LoRA model</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex">
              <Input
                className="flex-1 bg-[#1e1e1e] border border-gray-700"
                value={styleLora}
                onChange={(e) => setstyleLora(e.target.value)}
                placeholder="https://v3.fal.media/files/monkey/..."
              />
              <Button
                variant="outline"
                size="icon"
                className="ml-2 text-black"
                onClick={resetStyleLoraPath}
              >
                <span className="sr-only">Delete</span>
                <span>🗑️</span>
              </Button>
            </div>
          </div>

          {/* Second LoRA Scale */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <label className="text-sm font-medium ml-4">
                Style Lora Scale
              </label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-2"
                    >
                      <Info size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Adjust the scale of this LoRA model</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center">
              <div className="flex-1 mr-2">
                <Slider
                  defaultValue={[0.4]}
                  max={1}
                  step={0.01}
                  value={[styleLoraScale]}
                  onValueChange={(values) => setStyleLoraScale(values[0])}
                />
              </div>
              <div className="w-20">
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={styleLoraScale}
                  onChange={(e) => setStyleLoraScale(Number(e.target.value))}
                  className="bg-[#1e1e1e] border border-gray-700"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="ml-2 text-black"
                onClick={resetStyleLoraScale}
              >
                <span className="sr-only">Reset</span>
                <span>↺</span>
              </Button>
            </div>
          </div>

          {/* New Inpainting Style LoRA */}
          {/* <div className="mb-4">
            <div className="flex items-center mb-2">
              <label className="text-sm font-medium ml-4">Inpainting style lora</label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5 ml-2">
                      <Info size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter the path to your inpainting style LoRA</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex">
              <Input
                className="flex-1 bg-[#1e1e1e] border border-gray-700"
                value={inpaintingStyleLora}
                onChange={(e) => setInpaintingStyleLora(e.target.value)}
                placeholder="Enter inpainting style lora..."
              />
              <Button variant="outline" size="icon" className="ml-2 text-black" onClick={resetInpaintingStyleLora}>
                <span className="sr-only">Reset</span>
                <span>↺</span>
              </Button>
            </div>
          </div> */}
        {/* Inpainting Character Style Lora Scale */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <label className="text-sm font-medium ml-4">
                Inpainting Character style lora scale
              </label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-2"
                    >
                      <Info size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Adjust the scale of the inpainting Character LoRA</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center">
              <div className="flex-1 mr-2">
                <Slider
                  defaultValue={[0.6]}
                  max={1}
                  step={0.01}
                  value={[inpaintingCharacterLoraScale]}
                  onValueChange={(values) =>
                    setInpaintingCharacterLoraScale(values[0])
                  }
                />
              </div>
              <div className="w-20">
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={inpaintingCharacterLoraScale}
                  onChange={(e) =>
                    setInpaintingCharacterLoraScale(Number(e.target.value))
                  }
                  className="bg-[#1e1e1e] border border-gray-700"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="ml-2 text-black"
                onClick={resetInpaintingStyleLoraScale}
              >
                <span className="sr-only">Reset</span>
                <span>↺</span>
              </Button>
            </div>
          </div>

          {/* Inpainting Style LoRA Scale */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <label className="text-sm font-medium ml-4">
                Inpainting style lora scale
              </label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-2"
                    >
                      <Info size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Adjust the scale of the inpainting style LoRA</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center">
              <div className="flex-1 mr-2">
                <Slider
                  defaultValue={[0.6]}
                  max={1}
                  step={0.01}
                  value={[inpaintingStyleLoraScale]}
                  onValueChange={(values) =>
                    setInpaintingStyleLoraScale(values[0])
                  }
                />
              </div>
              <div className="w-20">
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={inpaintingStyleLoraScale}
                  onChange={(e) =>
                    setInpaintingStyleLoraScale(Number(e.target.value))
                  }
                  className="bg-[#1e1e1e] border border-gray-700"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="ml-2 text-black"
                onClick={resetInpaintingStyleLoraScale}
              >
                <span className="sr-only">Reset</span>
                <span>↺</span>
              </Button>
            </div>
          </div>

          {/* Inpainting Style LoRA Strength */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <label className="text-sm font-medium ml-4">
                Inpainting strength
              </label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-2"
                    >
                      <Info size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Adjust the strength of the inpainting style LoRA</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center">
              <div className="flex-1 mr-2">
                <Slider
                  defaultValue={[0.5]}
                  max={1}
                  step={0.01}
                  value={[inpaintingStyleLoraStrength]}
                  onValueChange={(values) =>
                    setInpaintingStyleLoraStrength(values[0])
                  }
                />
              </div>
              <div className="w-20">
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={inpaintingStyleLoraStrength}
                  onChange={(e) =>
                    setInpaintingStyleLoraStrength(Number(e.target.value))
                  }
                  className="bg-[#1e1e1e] border border-gray-700"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="ml-2 text-black"
                onClick={resetInpaintingStyleLoraStrength}
              >
                <span className="sr-only">Reset</span>
                <span>↺</span>
              </Button>
            </div>

            {/* No of images */}
            {/* <div className="mb-4">
              <div className="flex items-center mb-2">
                <label className="text-sm font-medium ml-4">No of images</label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5 ml-2">
                        <Info size={14} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter the number of images to generate</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex">
                <Input
                  className="flex-1 bg-[#1e1e1e] border border-gray-700"
                  type="number"
                  min={1}
                  value={noOfImages}
                  onChange={(e) => setNoOfImages(Number(e.target.value))}
                  placeholder="Enter number of images..."
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="ml-2 text-black"
                  onClick={resetNoOfImages} // <-- make sure this function exists
                >
                  <span className="sr-only">Reset</span>
                  <span>↺</span>
                </Button>
              </div>
            </div> */}
          </div>
          {/* Number of Images - Only show for prompt mode */}
          {inputMode === "prompt" && (
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <label className="text-sm font-medium ml-4">No of images</label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 ml-2"
                      >
                        <Info size={14} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter the number of images to generate</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex">
                <Input
                  className="flex-1 bg-[#1e1e1e] border border-gray-700"
                  type="number"
                  min={1}
                  value={noOfImages}
                  onChange={(e) => {
                    if (e.target.value > "4" || e.target.value < "0") return;

                    setNoOfImages(Number(e.target.value));
                  }}
                  placeholder="Enter number of images..."
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="ml-2 text-black"
                  onClick={resetNoOfImages} // <-- make sure this function exists
                >
                  <span className="sr-only">Reset</span>
                  <span>↺</span>
                </Button>
              </div>
            </div>
          )}

          {/* Seed */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <label className="text-sm font-medium ml-4">Seed</label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-2"
                    >
                      <Info size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Set a seed for reproducible results. Use 0 for random.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex">
              <Input
                className="flex-1 bg-[#1e1e1e] border border-gray-700"
                type="number"
                min={0}
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                placeholder="0 (random)"
              />
              <Button
                variant="outline"
                size="icon"
                className="ml-2 text-black"
                onClick={resetSeed}
              >
                <span className="sr-only">Reset</span>
                <span>↺</span>
              </Button>
            </div>
          </div>

          {/* Add item button */}
          {/* <Button variant="outline" className="mt-2 text-black">
            + Add item
          </Button> */}
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-4 mt-8">
          <Button
            variant="outline"
            className="text-black"
            onClick={handleReset}
          >
            Reset
          </Button>
          <Button
            className="bg-purple-500 hover:bg-purple-700 px-6 py-2"
            onClick={handleForm}
            disabled={isLoading}
          >
            {isLoading ? "Running..." : "Run"}
          </Button>{" "}
        </div>
      </div>

      {/* Right panel - Results */}
      <div className="hidden md:block w-1/2 p-6">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold mr-2">Result</h2>
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                isLoading ? "bg-yellow-500" : "bg-green-600"
              }`}
            >
              {isLoading ? "Generating..." : "Completed"}
            </span>{" "}
          </div>
        </div>
        {/* Results grid */}
        <div className="grid grid-cols-2 gap-4">
          {resultImages.length === 0
            ? [1, 2, 3, 4].map((index) => (
                <div
                  key={index}
                  className="relative bg-gray-800 rounded-md aspect-[3/4]"
                ></div>
              ))
            : resultImages.map((url, index) => (
                <div
                  key={index}
                  className="relative bg-gray-800 rounded-md aspect-[3/4] overflow-hidden"
                >
                  <img
                    src={url}
                    alt={`Generated ${index + 1}`}
                    className="w-full h-full object-cover rounded-md"
                  />
                  <a
                    href={url}
                    download={`generated-image-${index + 1}.jpg`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-black/40 h-8 w-8 rounded-full"
                    >
                      <Download size={16} />
                    </Button>
                  </a>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}

// Hidden Download component for Lucide icon
function Download(props: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  );
}
