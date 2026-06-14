import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, language, userProfile } = await req.json();

    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    if (!geminiKey && !groqKey && !openrouterKey) {
      return NextResponse.json(
        {
          content: "API Key not configured. Please add `GEMINI_API_KEY`, `GROQ_API_KEY`, or `OPENROUTER_API_KEY` to your environment variables (.env.local) to enable the AI Assistant.",
          translation: null
        },
        { status: 200 }
      );
    }

    // Build user profile details string for the system prompt
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

    const systemPrompt = `You are the HealthTwin Guardian AI Assistant, a compassionate, professional, and knowledgeable medical/health chatbot.
You help users understand their health metrics, answer medical queries, and analyze symptoms.

${profileContext}

CRITICAL RULES:
1. Always keep the user's conditions, allergies, and medications in mind. If they ask about a medication or food that conflicts with their allergies or existing medications, warn them immediately.
2. Provide practical, easy-to-understand health advice.
3. Be clear that you are an AI assistant, not a doctor. In emergency cases, advise them to click the "Emergency SOS" button or contact emergency services.
4. If the selected language is not English (Selected language: ${language || 'English'}), you must translate your response.
5. Your response MUST be valid JSON matching the following schema:
{
  "content": "A detailed, helpful, and formatted response in English. Use markdown for bullets/bolding where appropriate.",
  "translation": "The exact same response translated to ${language}. If the selected language is English, this MUST be null."
}
Do not return any explanation or markdown wrapping outside of the JSON. Return only the raw JSON.`;

    if (geminiKey) {
      // Call Gemini API
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
      
      const geminiMessages = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const body = {
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: geminiMessages,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              content: { type: "STRING" },
              translation: { type: "STRING" }
            },
            required: ["content"]
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

    } else if (groqKey) {
      // Call Groq API (OpenAI compatible)
      const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
      
      const groqMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: any) => ({
          role: m.role,
          content: m.content
        }))
      ];

      const res = await fetch(groqUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: groqMessages,
          response_format: { type: 'json_object' }
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Groq API error: ${res.statusText} - ${errText}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error("Empty response from Groq API");

      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);

    } else {
      // Call OpenRouter API (OpenAI compatible)
      const openrouterUrl = 'https://openrouter.ai/api/v1/chat/completions';

      const orMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: any) => ({
          role: m.role,
          content: m.content
        }))
      ];

      const res = await fetch(openrouterUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://healthtwin.guardian.ai',
          'X-Title': 'HealthTwin Guardian AI'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: orMessages,
          response_format: { type: 'json_object' }
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenRouter API error: ${res.statusText} - ${errText}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error("Empty response from OpenRouter API");

      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    }

  } catch (error: any) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      {
        content: `Sorry, I encountered an error while communicating with the AI service: ${error.message || error}`,
        translation: null
      },
      { status: 500 }
    );
  }
}
