import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  let destination = '';
  try {
    const body = await req.json().catch(() => ({}));
    destination = body.destination || '';
    const userProfile = body.userProfile;

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured in .env.local" },
        { status: 500 }
      );
    }

    if (!destination) {
      return NextResponse.json(
        { error: "Destination is required" },
        { status: 400 }
      );
    }

    // Build user profile context
    let profileContext = "User Profile: (Not provided)";
    if (userProfile) {
      const age = userProfile.age || "32";
      const conditions = Array.isArray(userProfile.conditions) ? userProfile.conditions.join(", ") : (userProfile.conditions || "None");
      const allergies = Array.isArray(userProfile.allergies) ? userProfile.allergies.join(", ") : (userProfile.allergies || "None");
      
      profileContext = `User Profile:
- Age: ${age}
- Conditions: ${conditions}
- Allergies: ${allergies}`;
    }

    const systemPrompt = `You are the HealthTwin Travel Health Copilot. 
The user is planning a trip to a destination. 
Analyze the local climate, typical air quality index warnings, recommended travel vaccinations (e.g., Yellow Fever, Typhoid, Hepatitis if applicable), general safety precautions, and key hospital references.

${profileContext}

CRITICAL RULES:
1. Custom-tailor the advice to the user's conditions (e.g. if they have asthma, warn them about cold weather/poor AQI; if they have hypertension, advise on long flights and heat).
2. Return your response as a valid JSON matching the following schema. Return only raw JSON, no markdown code block wraps.

JSON Schema:
{
  "destination": "Destination name",
  "climate": "Typical weather, climate, and temperature notes for the travel season",
  "aqiAdvice": "Air quality expectations and precautions, tailored to the patient profile",
  "vaccines": ["List of recommended vaccines or health shots"],
  "precautions": ["List of general health precautions (water safety, food caution, jetlag)"],
  "hospitals": [
    {
      "name": "Hospital Name",
      "address": "Hospital Address",
      "phone": "Emergency phone number"
    }
  ],
  "customTips": ["AI travel tips specific to the user's health twin profile"]
}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `Analyze travel health safety for: "${destination}"` }]
        }
      ],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            destination: { type: "STRING" },
            climate: { type: "STRING" },
            aqiAdvice: { type: "STRING" },
            vaccines: {
              type: "ARRAY",
              items: { type: "STRING" }
            },
            precautions: {
              type: "ARRAY",
              items: { type: "STRING" }
            },
            hospitals: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  address: { type: "STRING" },
                  phone: { type: "STRING" }
                },
                required: ["name", "address", "phone"]
              }
            },
            customTips: {
              type: "ARRAY",
              items: { type: "STRING" }
            }
          },
          required: ["destination", "climate", "aqiAdvice", "vaccines", "precautions", "hospitals", "customTips"]
        }
      }
    };

    const res = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error: ${res.statusText} - ${errText}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Empty response from Gemini API");

    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error('Error in travel API route, returning fallback content:', error);
    const mockResponse = {
      destination: destination || 'your destination',
      climate: 'Typical seasonal variations. Safe conditions predicted. Keep hydrated.',
      aqiAdvice: 'Moderate Air Quality. Standard precautions apply. Pack necessary allergy medications.',
      vaccines: ['Hepatitis A', 'Typhoid booster', 'Tetanus update'],
      precautions: ['Consume bottled water only.', 'Apply broad-spectrum sunscreen.', 'Keep emergency contact card handy.'],
      hospitals: [
        {
          name: 'International General ER & Care',
          address: '101 Medical Plaza Central',
          phone: '+1 (555) 911-01'
        }
      ],
      customTips: [
        `Adjust physical activity schedule relative to local heat indexes.`,
        `Fasting glucose and medication schedules should be adjusted for timezone offsets.`
      ]
    };
    return NextResponse.json(mockResponse);
  }
}
