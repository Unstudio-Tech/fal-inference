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
  const [prompt, setPrompt] = useState("");
  const [loraPath1, setLoraPath1] = useState("");
  const [loraScale1, setLoraScale1] = useState(0.6);
  const [loraPath2, setLoraPath2] = useState("");
  const [loraScale2, setLoraScale2] = useState(0.9);
  const [inpaintingStyleLora, setInpaintingStyleLora] = useState("");
  const [inpaintingStyleLoraScale, setInpaintingStyleLoraScale] = useState(0.6);
  const [inpaintingStyleLoraStrength, setInpaintingStyleLoraStrength] =
    useState(0.5);
  const [resultImages, setResultImages] = useState<string[]>([]);

  const handleForm = async () => {
    if (!prompt || !loraPath1 || !loraPath2 ) {
      alert("Please fill in all required fields");
      return;
    }

    const requestBody = {
      prompt,
      loraPaths: [
        { loraPath: loraPath1, scale: loraScale1 },
        { loraPath: loraPath2, scale: loraScale2 },
        // { loraPath: inpaintingStyleLora, scale: inpaintingStyleLoraScale },
      ],
      numberOfImages: 4, // or any number you want to generate
      strength: inpaintingStyleLoraStrength,
      inpaintingStyleLoraScale,
    };

    try {
      const response = await fetch("/api/inference", {
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
      // TODO: Set to state for preview display
      setResultImages(data.imageUrls);
    } catch (error) {
      console.error("❌ Fetch error:", error);
      alert("An error occurred during inference.");
    }
  };

  const handleReset = () => {
    setPrompt("");
    setLoraPath1("");
    setLoraScale1(0.6);
    setLoraPath2("");
    setLoraScale2(0.9);
    setInpaintingStyleLora("");
    setInpaintingStyleLoraScale(0.6);
    setInpaintingStyleLoraStrength(0.5);
  };

  // Individual reset functions
  const resetLoraPath1 = () => setLoraPath1("");
  const resetLoraScale1 = () => setLoraScale1(0.6);
  const resetLoraPath2 = () => setLoraPath2("");
  const resetLoraScale2 = () => setLoraScale2(0.9);
  const resetInpaintingStyleLora = () => setInpaintingStyleLora("");
  const resetInpaintingStyleLoraScale = () => setInpaintingStyleLoraScale(0.6);
  const resetInpaintingStyleLoraStrength = () =>
    setInpaintingStyleLoraStrength(0.5);

  return (
    <div className="flex min-h-screen bg-[#1e1c1c] text-white">
      {/* Left panel - Input form */}
      <div className="w-full md:w-1/2 p-6 border-r border-gray-800">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Input</h2>
          <Button variant="outline" className="gap-2 text-black">
            <Upload size={16} />
            Form
          </Button>
        </div>

        {/* Prompt */}
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
                value={loraPath1}
                onChange={(e) => setLoraPath1(e.target.value)}
                placeholder="https://v3.fal.media/files/monkey/..."
              />
              <Button
                variant="outline"
                size="icon"
                className="ml-2"
                onClick={resetLoraPath1}
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
                  defaultValue={[0.6]}
                  max={1}
                  step={0.01}
                  value={[loraScale1]}
                  onValueChange={(values) => setLoraScale1(values[0])}
                />
              </div>
              <div className="w-16">
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={loraScale1}
                  onChange={(e) => setLoraScale1(Number(e.target.value))}
                  className="bg-[#1e1e1e] border border-gray-700"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="ml-2 text-black"
                onClick={resetLoraScale1}
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
                value={loraPath2}
                onChange={(e) => setLoraPath2(e.target.value)}
                placeholder="https://v3.fal.media/files/monkey/..."
              />
              <Button
                variant="outline"
                size="icon"
                className="ml-2 text-black"
                onClick={resetLoraPath2}
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
                  defaultValue={[0.9]}
                  max={1}
                  step={0.01}
                  value={[loraScale2]}
                  onValueChange={(values) => setLoraScale2(values[0])}
                />
              </div>
              <div className="w-16">
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={loraScale2}
                  onChange={(e) => setLoraScale2(Number(e.target.value))}
                  className="bg-[#1e1e1e] border border-gray-700"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="ml-2 text-black"
                onClick={resetLoraScale2}
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
              <div className="w-16">
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
                Inpainting style lora strength
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
              <div className="w-16">
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
            className="bg-purple-600 hover:bg-purple-700"
            onClick={handleForm}
          >
            Run
          </Button>
        </div>
      </div>

      {/* Right panel - Results */}
      <div className="hidden md:block w-1/2 p-6">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold mr-2">Result</h2>
            <span className="bg-green-600 text-xs px-2 py-0.5 rounded">
              Completed
            </span>
          </div>
          <Button variant="outline" className="gap-2">
            Preview
          </Button>
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
                    download
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
        </div>{" "}
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
