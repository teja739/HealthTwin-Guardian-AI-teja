import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image, mimeType, userProfile } = await req.json();

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured in .env.local" },
        { status: 500 }
      );
    }

    if (!image) {
      return NextResponse.json(
        { error: "No image data provided" },
        { status: 400 }
      );
    }

    // Extract raw base64 data if data URI format was passed
    const match = image.match(/^data:(.+);base64,(.+)$/);
    let rawBase64 = image;
    let resolvedMimeType = mimeType || 'image/jpeg';
    if (match) {
      resolvedMimeType = match[1];
      rawBase64 = match[2];
    }

    // Build user profile context for the conflict prompt
    let profileContext = "User Health Profile: (Not provided)";
    if (userProfile) {
      const name = userProfile.name || "User";
      const conditions = Array.isArray(userProfile.conditions) ? userProfile.conditions.join(", ") : (userProfile.conditions || "None");
      const allergies = Array.isArray(userProfile.allergies) ? userProfile.allergies.join(", ") : (userProfile.allergies || "None");
      const medications = Array.isArray(userProfile.medications) ? userProfile.medications.join(", ") : (userProfile.medications || "None");
      const bloodGroup = userProfile.bloodGroup || "Unknown";

      profileContext = `User Health Profile:
- Name: ${name}
- Blood Group: ${bloodGroup}
- Existing Conditions: ${conditions}
- Allergies: ${allergies}
- Active Medications: ${medications}`;
    }

    const prompt = `Analyze this medicine package image. Identify the medicine name, strength, generic/active ingredients, manufacturer, form (e.g. tablet, capsule, liquid), purpose, typical dosage, side effects, and generic drug interactions.
    
    Then, evaluate potential conflicts specifically against this user profile:
    ${profileContext}
    
    CRITICAL EVALUATION RULES:
    1. If the user's allergies include the active ingredient or related compounds of this medicine, flag a "High" severity conflict.
    2. If the user takes any active medications that have moderate or severe drug-to-drug interactions with this medicine, flag a "High" or "Medium" severity conflict.
    3. If the user has any existing conditions that are contraindicated for this medicine (e.g. taking decongestants with high blood pressure), flag a conflict.
    
    Your response MUST be valid JSON matching the following schema. Return only the raw JSON, no markdown code block wraps.
    
    JSON Schema:
    {
      "name": "Medicine Name & Strength (e.g. Tylenol Extra Strength 500mg)",
      "generic": "Active ingredient (e.g. Acetaminophen)",
      "category": "Drug class/category (e.g. Analgesic / Antipyretic)",
      "purpose": "Brief description of what this medicine is used for",
      "dosage": "Typical standard dosage instructions (e.g. 1 tablet every 4-6 hours as needed)",
      "sideEffects": ["list of common side effects"],
      "interactions": ["list of key general drug/food interactions"],
      "prescriptionRequired": false, // true or false
      "safetyScore": 85, // integer out of 100 representing suitability for this specific user
      "manufacturer": "Manufacturer name",
      "form": "Tablet / Capsule / Liquid / Cream",
      "profileConflicts": [
        {
          "severity": "High", // "High" or "Medium"
          "description": "Allergy warning: This medicine contains Penicillin which conflicts with your allergy."
        }
      ]
    }`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;

    const body = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: resolvedMimeType,
                data: rawBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING" },
            generic: { type: "STRING" },
            category: { type: "STRING" },
            purpose: { type: "STRING" },
            dosage: { type: "STRING" },
            sideEffects: {
              type: "ARRAY",
              items: { type: "STRING" }
            },
            interactions: {
              type: "ARRAY",
              items: { type: "STRING" }
            },
            prescriptionRequired: { type: "BOOLEAN" },
            safetyScore: { type: "INTEGER" },
            manufacturer: { type: "STRING" },
            form: { type: "STRING" },
            profileConflicts: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  severity: { type: "STRING" },
                  description: { type: "STRING" }
                },
                required: ["severity", "description"]
              }
            }
          },
          required: [
            "name", "generic", "category", "purpose", "dosage", 
            "sideEffects", "interactions", "prescriptionRequired", 
            "safetyScore", "manufacturer", "form", "profileConflicts"
          ]
        }
      }
    };

    const res = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini Vision API error: ${res.statusText} - ${errText}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Empty response from Gemini Vision API");

    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error('Error in scan API route:', error);
    return NextResponse.json(
      { error: `API Error: ${error.message || error}` },
      { status: 500 }
    );
  }
}
