import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, FaceAnalysisResult, HairstyleRequest, LightingCondition, Language, FaceDimensions } from "../types";

// Helper to convert Blob/File to Base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const analyzeFaceShape = async (
  imageBase64: string,
  userProfile: UserProfile,
  lang: Language = 'en'
): Promise<FaceAnalysisResult> => {
  const ai = getClient();
  
  const langInstruction = lang === 'zh' ? 'Output must be in Chinese (Simplified).' : 'Output must be in English.';

  const prompt = `
    Analyze the facial features of the person in this image acting as a professional stylist.
    User Profile: Age ${userProfile.age}, Gender ${userProfile.gender}.
    Hair Characteristics: ${userProfile.hairCurl}, ${userProfile.hairThickness}.
    
    ${langInstruction}
    Return a strictly valid JSON object with the following analysis:
    - faceShape: (e.g., Oval, Square, Round, Heart, Diamond - translated if needed)
    - jawlineCharacteristics: Brief description.
    - foreheadHeight: Brief description.
    - skinToneDescription: Brief professional description of skin tone/undertone.
    - featuresSummary: A 2-sentence summary of key facial landmarks affecting hairstyle choice.
    - recommendedStyles: An array of 4 specific hairstyle names that would suit this face shape.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            faceShape: { type: Type.STRING },
            jawlineCharacteristics: { type: Type.STRING },
            foreheadHeight: { type: Type.STRING },
            skinToneDescription: { type: Type.STRING },
            featuresSummary: { type: Type.STRING },
            recommendedStyles: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as FaceAnalysisResult;
    }
    throw new Error("No analysis returned");
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

export const refineFaceAnalysis = async (
  imageBase64: string,
  userProfile: UserProfile,
  dimensions: FaceDimensions,
  lang: Language = 'en'
): Promise<FaceAnalysisResult> => {
  const ai = getClient();
  const langInstruction = lang === 'zh' ? 'Output must be in Chinese (Simplified).' : 'Output must be in English.';

  const prompt = `
    Re-analyze the facial features of the person in this image acting as a professional stylist.
    The user has provided specific physical measurements to help correct the analysis:
    - Face Length: ${dimensions.faceLength || 'Not provided'}
    - Cheekbone Width: ${dimensions.cheekboneWidth || 'Not provided'}
    - Jawline Width: ${dimensions.jawlineWidth || 'Not provided'}
    - Forehead Width: ${dimensions.foreheadWidth || 'Not provided'}

    User Profile: Age ${userProfile.age}, Gender ${userProfile.gender}.
    Hair Characteristics: ${userProfile.hairCurl}, ${userProfile.hairThickness}.

    Task: Re-calculate the face shape based on the visual evidence combined with these provided measurements.
    (e.g., If Face Length is significantly larger than Width, prioritize Oval/Oblong. If Length ~ Width, prioritize Round/Square).

    ${langInstruction}
    Return a strictly valid JSON object with the following analysis:
    - faceShape: (e.g., Oval, Square, Round, Heart, Diamond - translated if needed)
    - jawlineCharacteristics: Brief description adapting to new info.
    - foreheadHeight: Brief description.
    - skinToneDescription: Brief description.
    - featuresSummary: A 2-sentence summary explaining how the measurements influenced this new analysis.
    - recommendedStyles: An array of 4 specific hairstyle names that suit this corrected face shape.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            faceShape: { type: Type.STRING },
            jawlineCharacteristics: { type: Type.STRING },
            foreheadHeight: { type: Type.STRING },
            skinToneDescription: { type: Type.STRING },
            featuresSummary: { type: Type.STRING },
            recommendedStyles: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as FaceAnalysisResult;
    }
    throw new Error("No refined analysis returned");
  } catch (error) {
    console.error("Refined analysis failed:", error);
    throw error;
  }
};

export const getMoreStyleRecommendations = async (
  faceAnalysis: FaceAnalysisResult,
  currentStyles: string[],
  lang: Language = 'en'
): Promise<string[]> => {
  const ai = getClient();
  const langInstruction = lang === 'zh' ? 'Output in Chinese (Simplified).' : 'Output in English.';
  
  const prompt = `
    Act as a professional hair stylist. 
    Context: A client with ${faceAnalysis.faceShape} face shape and features: ${faceAnalysis.featuresSummary}.
    Previous recommendations were: ${currentStyles.join(', ')}.
    
    Task: Provide 4 NEW and DISTINCT recommended hairstyle names that are different from the previous ones.
    ${langInstruction}
    
    Return ONLY a JSON object with this schema: { "styles": ["style1", "style2", "style3", "style4"] }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            styles: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return data.styles || [];
    }
    return [];
  } catch (error) {
    console.error("Failed to get more styles:", error);
    return [];
  }
};

export const generateHairstyleImage = async (
  inputImageBase64: string,
  faceAnalysis: FaceAnalysisResult,
  request: HairstyleRequest,
  lang: Language = 'en',
  isRelighting: boolean = false
): Promise<string> => {
  const ai = getClient();

  let prompt = '';

  if (isRelighting) {
    // Relighting Mode: Strict consistency required. Input image already has the hairstyle.
    prompt = `
      Photorealistic image editing task.
      Action: Change the lighting environment of the input image to: ${request.lighting}.
      
      CRITICAL INSTRUCTIONS:
      1. DO NOT change the person's face. The facial identity must remain pixel-perfectly identical.
      2. DO NOT change the hairstyle shape, length, or texture.
      3. ONLY adjust the global lighting, shadows, and color temperature to match the requested atmosphere (${request.lighting}).
      4. Output quality: 8k, photorealistic.
    `;
  } else {
    // Generation Mode: Create hairstyle from original image.
    prompt = `
      Photorealistic image editing task.
      Action: Apply a new hairstyle to the person in the input image.
      Target Hairstyle: ${request.styleName} (${request.length}).
      Target Hair Color: ${request.color}.
      Lighting Condition: ${request.lighting}.
      
      CRITICAL INSTRUCTIONS:
      1. PRESERVE THE FACE EXACTLY. Do not alter the eye shape, nose, mouth, or facial structure. The subject must be instantly recognizable as the original person.
      2. Only replace/modify the hair region.
      3. Blend the hair naturally with the ${faceAnalysis.faceShape} face shape.
      4. Image quality: 8k, highly detailed, cinematic texture.
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: inputImageBase64 } },
          { text: prompt }
        ]
      }
    });

    // Find the image part
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Image generation failed:", error);
    throw error;
  }
};

export const modifyHairstyleWithChat = async (
  currentImageBase64: string,
  instruction: string,
  lang: Language = 'en'
): Promise<{ imageUrl: string; reply: string }> => {
  const ai = getClient();

  // Parse Data URI to get clean base64 and mimeType
  let base64Data = currentImageBase64;
  let mimeType = 'image/jpeg';

  if (currentImageBase64.includes('base64,')) {
    const matches = currentImageBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      base64Data = matches[2];
    } else {
      // Fallback simple split if regex fails
      const parts = currentImageBase64.split(';base64,');
      if (parts.length === 2) {
         // try to extract mimetype from first part
         const mimeParts = parts[0].split(':');
         if (mimeParts.length === 2) {
           mimeType = mimeParts[1];
         }
         base64Data = parts[1];
      }
    }
  }

  const prompt = `
    Image Editing Task.
    Input Image: A person with a specific hairstyle.
    User Instruction: "${instruction}"
    
    CRITICAL RULES:
    1. PRESERVE THE FACE IDENTITY EXACTLY. Do not change facial features.
    2. Modify the hairstyle according to the user's instruction (e.g., make it shorter, change color, add bangs).
    3. Maintain photorealism and high quality.
    4. If the instruction is about lighting, adjust the lighting while keeping the hair shape.
    
    After generating the image, also provide a very brief (1 sentence) text confirmation of what was changed in ${lang === 'zh' ? 'Chinese' : 'English'}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Data } },
          { text: prompt }
        ]
      }
    });

    let imageUrl = '';
    let reply = lang === 'zh' ? '已根据您的要求修改发型。' : 'Hairstyle modified as requested.';

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      } else if (part.text) {
        reply = part.text;
      }
    }

    if (!imageUrl) throw new Error("No image generated from chat modification");

    return { imageUrl, reply };
  } catch (error) {
    console.error("Chat modification failed:", error);
    throw error;
  }
};

export const generateBarberInstructions = async (
  faceAnalysis: FaceAnalysisResult,
  request: HairstyleRequest,
  lang: Language = 'en'
): Promise<string> => {
  const ai = getClient();
  
  const langInstruction = lang === 'zh' ? 'Provide the output in Chinese (Simplified).' : 'Provide the output in English.';

  const prompt = `
    Create technical instructions for a professional barber/stylist to achieve the following look:
    Style: ${request.styleName}
    Length Category: ${request.length}
    Client Face Shape: ${faceAnalysis.faceShape}
    Client Hair Type: ${faceAnalysis.featuresSummary} (Contextual)

    ${langInstruction}
    Provide the output in clean Markdown format. Include:
    1. **Guard Numbers/Shear Technique**: Specific lengths in cm/mm and inches for top, sides, and back.
    2. **Texturing**: How to handle weight (e.g., point cutting, thinning shears).
    3. **Finishing**: Styling products recommended.
    4. **Maintenance**: How often to trim.
    
    Keep it concise and practical.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    return response.text || "No instructions generated.";
  } catch (error) {
    console.error("Instruction generation failed:", error);
    return "Could not generate technical instructions at this time.";
  }
};