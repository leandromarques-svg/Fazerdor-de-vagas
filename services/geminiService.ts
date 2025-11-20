import { GoogleGenAI, Type } from "@google/genai";
import { JobData } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const MODEL_ID = 'gemini-2.5-flash';

export const generateJobDetails = async (jobTitle: string, currentData: JobData): Promise<Partial<JobData>> => {
  try {
    const prompt = `Generate realistic job posting details for a position titled "${jobTitle}" in Brazil. 
    Return a JSON object with a catchy tagline (uppercase), a sector name (uppercase), contract type (e.g., CLT, PJ), modality (e.g., Presencial, Híbrido), and a sample city/state.
    Keep the tone professional but energetic.`;

    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tagline: { type: Type.STRING, description: "A short, punchy tagline in Portuguese, uppercase." },
            sector: { type: Type.STRING, description: "The industry sector in Portuguese, uppercase, e.g., 'SETOR DE TECNOLOGIA'." },
            contractType: { type: Type.STRING, description: "Contract type like CLT, PJ, Estágio." },
            modality: { type: Type.STRING, description: "Work modality like Presencial, Remoto." },
            location: { type: Type.STRING, description: "City and State abbreviation, e.g., São Paulo, SP." },
          },
          required: ["tagline", "sector", "contractType", "modality", "location"],
        },
      },
    });

    if (response.text) {
        const data = JSON.parse(response.text);
        return {
            tagline: data.tagline,
            sector: data.sector,
            contractType: data.contractType,
            modality: data.modality,
            location: data.location
        };
    }
    return {};
  } catch (error) {
    console.error("Error generating job details:", error);
    throw error;
  }
};

export const extractJobFromUrl = async (url: string): Promise<Partial<JobData>> => {
  try {
    // Note: When using googleSearch, we cannot use responseSchema or responseMimeType.
    // We must ask for JSON in the prompt and parse it manually.
    
    const prompt = `Search for the job posting at this URL: "${url}".
    Analyze the content found and extract the following details to fill a job card.
    
    Return ONLY a raw JSON object (no markdown formatting, no code blocks) with these keys:
    - jobTitle: The exact name of the position.
    - tagline: Create a short, punchy tagline based on the company description (max 5 words, Uppercase, Portuguese).
    - sector: The industry sector (e.g., "SETOR FINANCEIRO", Uppercase).
    - contractType: e.g., CLT, PJ, Estágio, Efetivo.
    - modality: e.g., Presencial, Híbrido, Remoto.
    - location: City and State (e.g., "São Paulo, SP").
    - jobCode: If a job code/ID is visible, include it (as string). Otherwise, leave null.
    
    If you cannot find specific info, make a reasonable inference based on the context of the page found.`;

    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    
    // Clean up potential markdown code blocks from the response
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
        const data = JSON.parse(cleanJson);
        
        // Filter out null/undefined values so we don't overwrite existing data with empty stuff if not found
        const result: Partial<JobData> = {};
        if (data.jobTitle) result.jobTitle = data.jobTitle;
        if (data.tagline) result.tagline = data.tagline;
        if (data.sector) result.sector = data.sector;
        if (data.contractType) result.contractType = data.contractType;
        if (data.modality) result.modality = data.modality;
        if (data.location) result.location = data.location;
        if (data.jobCode) result.jobCode = data.jobCode;
        
        // Also update the website URL to the one provided
        result.websiteUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '');

        return result;
    } catch (parseError) {
        console.error("Failed to parse JSON from search result:", text);
        return {};
    }

  } catch (error) {
    console.error("Error extracting job from URL:", error);
    throw error;
  }
};