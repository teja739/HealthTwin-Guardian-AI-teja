import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { symptoms, userProfile } = await req.json();

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured in .env.local" },
        { status: 500 }
      );
    }

    if (!symptoms) {
      return NextResponse.json(
        { error: "No symptoms description provided" },
        { status: 400 }
      );
    }

    // Build user profile context
    let profileContext = "User Profile: (Not provided)";
    if (userProfile) {
      const age = userProfile.age || "32";
      const conditions = Array.isArray(userProfile.conditions) ? userProfile.conditions.join(", ") : (userProfile.conditions || "None");
      const allergies = Array.isArray(userProfile.allergies) ? userProfile.allergies.join(", ") : (userProfile.allergies || "None");
      const medications = Array.isArray(userProfile.medications) ? userProfile.medications.join(", ") : (userProfile.medications || "None");
      
      profileContext = `User Profile:
- Age: ${age}
- Existing Conditions: ${conditions}
- Allergies: ${allergies}
- Active Medications: ${medications}`;
    }

    const systemPrompt = `You are the HealthTwin Guardian AI Symptom Advisor. 
The user describes their symptoms. 
Analyze their symptoms, suggest the potential doctor specialty they should consult (e.g. Cardiologist, Dermatologist, General Physician, Pediatrician, Neurologist, Orthopedic, Ophthalmologist), estimate the urgency level (Critical SOS, Consult within 24 hours, Routine visit), and provide general home-care advice.

${profileContext}

CRITICAL RULES:
1. Clearly note that you do not provide a medical diagnosis, only guidance.
2. If symptoms match heart attacks, severe respiratory issues, or other life-threatening states, set urgency to "Critical SOS" and advise immediate ER visits.
3. Your response MUST be valid JSON matching the following schema. Return only raw JSON, no markdown code block wraps.

JSON Schema:
{
  "specialty": "Recommended Doctor Specialty (e.g., Cardiologist)",
  "urgency": "Urgency Level (Critical SOS / Consult within 24 hours / Routine visit)",
  "analysis": "A brief explanation of what these symptoms might indicate, considering their profile.",
  "advice": "General non-diagnostic home care tips and guidance on what to monitor.",
  "disclaimer": "Standard health disclaimer: This AI symptom analysis is for educational purposes and is not a replacement for professional clinical care."
}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `User symptoms: "${symptoms}"` }]
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
            specialty: { type: "STRING" },
            urgency: { type: "STRING" },
            analysis: { type: "STRING" },
            advice: { type: "STRING" },
            disclaimer: { type: "STRING" }
          },
          required: ["specialty", "urgency", "analysis", "advice", "disclaimer"]
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
      throw new Error(`Gemini API error: ${res.statusText} - ${errText}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Empty response from Gemini API");

    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error('Error in symptoms API route, returning fallback content:', error);
    const mockResponse = {
      specialty: 'General Physician',
      urgency: 'Consult within 24 hours',
      analysis: 'The symptom analyzer is offline or experiencing heavy traffic. Based on standard clinical protocols, a General Physician consultation is recommended.',
      advice: 'Keep a daily log of temperature and symptoms. Remain well-hydrated, rest, and visit a physical clinic if symptoms worsen.',
      disclaimer: 'Standard educational disclaimer: Fallback guidance active.'
    };
    return NextResponse.json(mockResponse);
  }
}
