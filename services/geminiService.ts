import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GenerationType, ImageSize } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert base64 to clean string
const cleanBase64 = (data: string) => data.split(',')[1] || data;

/**
 * Simulates automatic image repair and analysis.
 * Uses a text model to analyze issues and an image model to "fix" them.
 */
export const analyzeAndRepairImage = async (base64Image: string): Promise<{ repairedImage: string, analysis: string }> => {
  try {
    // Step 1: Analyze
    const analysisResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(base64Image) } },
          { text: '分析这张产品图片的质量（清晰度、曝光、噪点）。简要列出3个关键改进点。用中文回答。' }
        ]
      }
    });

    const analysisText = analysisResponse.text || "图片质量分析完成。";

    // Step 2: "Repair" (Generate a high quality variation)
    // Using gemini-2.5-flash-image for image-to-image generation
    const repairResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(base64Image) } },
          { text: '生成这张图片的高清修复版本。保持产品原样，优化光线，去除噪点，校正白平衡，使其看起来像专业摄影棚拍摄。' }
        ]
      }
    });

    let repairedImg = base64Image; // Fallback
    for (const part of repairResponse.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        repairedImg = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    return { repairedImage: repairedImg, analysis: analysisText };

  } catch (error) {
    console.error("Analysis failed", error);
    throw error;
  }
};

/**
 * Generates specific Amazon image types (White BG, Scenario, etc.)
 */
export const generateProductImage = async (
  base64Image: string, 
  type: GenerationType, 
  size: ImageSize,
  customPrompt?: string
): Promise<string> => {
  
  let prompt = "";
  
  switch (type) {
    case GenerationType.WHITE_BG:
      prompt = `
        请将这张图中的产品抠出，放置在纯白背景(#FFFFFF)上。
        保留自然的产品阴影和反光，使其看起来真实。
        产品应居中，占比约为整个画面的85%。
        不要改变产品的外观细节。
      `;
      break;
    case GenerationType.SCENARIO:
      prompt = `
        请识别这个产品的类目，并将其放置在一个合适的生活场景中（例如：厨房、卧室、户外、办公桌等，取决于产品类型）。
        光影必须自然匹配。
        ${customPrompt ? `额外要求: ${customPrompt}` : ''}
      `;
      break;
    case GenerationType.DIMENSION:
      prompt = `
        生成一张该产品的尺寸示意图。
        在产品旁边添加专业的尺寸标注线（长宽高）。
        背景保持简洁或纯白。
        标注文字清晰可见。
      `;
      break;
  }

  // Add sizing context to prompt (Note: GenAI doesn't strictly adhere to pixel output via prompt, 
  // but we guide the aspect ratio. Frontend canvas cropping handles exact pixels).
  prompt += ` 输出图像宽高比应接近 ${size.width}:${size.height}。`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(base64Image) } },
          { text: prompt }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Generation failed", error);
    throw error;
  }
};

/**
 * Chat based image editing/refinement
 */
export const chatEditImage = async (
  base64Image: string,
  userPrompt: string,
  history: {role: string, text: string}[]
): Promise<{ text: string, image?: string }> => {
  
  try {
    // We construct a single turn request for the image model that includes history context if possible,
    // or just the current request. For simplicity and robustness with current API, 
    // we treat this as a fresh generation request based on the image + instructions.
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(base64Image) } },
          { text: `基于这张图片，执行以下指令: ${userPrompt}。如果指令涉及修改图片，请生成新图片。如果只是询问信息，请回答文本。` }
        ]
      }
    });

    let resultText = "";
    let resultImage = undefined;

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        resultImage = `data:image/png;base64,${part.inlineData.data}`;
      } else if (part.text) {
        resultText += part.text;
      }
    }

    if (!resultText && resultImage) {
      resultText = "已根据您的要求生成了新图片。";
    }

    return { text: resultText, image: resultImage };

  } catch (error) {
    console.error("Chat edit failed", error);
    throw error;
  }
};
