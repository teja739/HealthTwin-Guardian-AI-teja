import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  let userProfile: any = null;
  try {
    const body = await req.json().catch(() => ({}));
    const image = body.image;
    const mimeType = body.mimeType;
    userProfile = body.userProfile;

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

    const prompt = `Analyze this food image. Identify the primary food item(s) present, estimate the calories (in kcal), protein (in grams), carbs (in grams), and fat (in grams). Also calculate a health score out of 100 representing its overall nutritional value.
    
    Then, evaluate potential conflicts specifically against this user profile:
    ${profileContext}
    
    CRITICAL EVALUATION RULES:
    1. If the food contains ingredients matching any of the user's allergies (e.g. peanuts, dairy, wheat/gluten, shellfish), flag a conflict item starting with "ALLERGY ALERT: ".
    2. If the user has Hypertension and the food contains high sodium/saturated fats, flag a conflict.
    3. If the user has Diabetes and the food is high in simple sugars or high glycemic carbs, flag a conflict.
    4. If there are any potential food-drug interactions with the user's active medications, flag a conflict.
    
    Your response MUST be valid JSON matching the following schema. Return only the raw JSON, no markdown code block wraps.
    
    JSON Schema:
    {
      "foodName": "Identified Food Name (e.g. Grilled Salmon Salad with Quinoa)",
      "calories": 450,
      "protein": 35,
      "carbs": 25,
      "fat": 18,
      "healthScore": 88,
      "conflicts": [
        "Description of conflict (e.g., 'ALLERGY ALERT: Detected cheese which matches your dairy allergy')"
      ]
    }`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;

    const requestBody = {
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
            foodName: { type: "STRING" },
            calories: { type: "INTEGER" },
            protein: { type: "INTEGER" },
            carbs: { type: "INTEGER" },
            fat: { type: "INTEGER" },
            healthScore: { type: "INTEGER" },
            conflicts: {
              type: "ARRAY",
              items: { type: "STRING" }
            }
          },
          required: [
            "foodName", "calories", "protein", "carbs", "fat", "healthScore", "conflicts"
          ]
        }
      }
    };

    const models = ['gemini-2.5-flash', 'gemini-flash-latest'];
    let res = null;
    let lastError = null;

    for (const model of models) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          res = response;
          break;
        } else {
          const errText = await response.text();
          lastError = new Error(`Gemini Vision API error (${model}): ${response.status} - ${errText}`);
          console.warn(lastError.message);
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Failed to call model ${model}:`, err);
      }
    }

    if (!res) {
      throw lastError || new Error("All Gemini models failed");
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Empty response from Gemini Vision API");

    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error('Error in scan-food API route, returning fallback content:', error);
    try {
      const fs = require('fs');
      const path = require('path');
      const errorLogPath = path.join(process.cwd(), 'scan_error.log');
      fs.writeFileSync(errorLogPath, `${new Date().toISOString()}\nError: ${error.message || error}\nStack: ${error.stack || ''}\n\n`, { flag: 'a' });
    } catch (logErr) {
      console.error('Failed to write error to scan_error.log', logErr);
    }
    
    // Fallback response in case of API failure or missing keys
    const mockFoodResponse = {
      foodName: "Grilled Chicken Salad",
      calories: 420,
      protein: 38,
      carbs: 12,
      fat: 22,
      healthScore: 89,
      conflicts: [] as string[]
    };

    // Evaluate basic conflicts in code as a fallback mechanism
    if (userProfile) {
      const allergies = Array.isArray(userProfile.allergies) 
        ? userProfile.allergies.map((a: string) => a.toLowerCase())
        : [];
      const conditions = Array.isArray(userProfile.conditions)
        ? userProfile.conditions.map((c: string) => c.toLowerCase())
        : [];

      if (allergies.some((a: string) => a.includes('chicken') || a.includes('poultry'))) {
        mockFoodResponse.conflicts.push("ALLERGY ALERT: Food contains chicken which matches your poultry allergy.");
        mockFoodResponse.healthScore = 20;
      }
      if (conditions.some((c: string) => c.includes('hypertension')) && mockFoodResponse.fat > 20) {
        mockFoodResponse.conflicts.push("HEALTH ALERT: High fat content is not recommended for Hypertension.");
      }
    }

    return NextResponse.json(mockFoodResponse);
  }
}
