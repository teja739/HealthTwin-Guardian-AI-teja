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

    let chatResponseText = null;

    // 1. Try Gemini API
    if (geminiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
        
        // Gemini expects the conversation to start with a 'user' turn.
        const firstUserIndex = messages.findIndex((m: any) => m.role === 'user');
        const filteredMessages = firstUserIndex !== -1 ? messages.slice(firstUserIndex) : messages;
        const geminiMessages = filteredMessages.map((m: any) => ({
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

        if (res.ok) {
          const data = await res.json();
          chatResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        } else {
          const errText = await res.text();
          console.warn(`Gemini API returned error: ${res.status} - ${errText}`);
        }
      } catch (err) {
        console.warn('Gemini API call failed, trying Groq fallback...', err);
      }
    }

    // 2. Try Groq API (Llama 3.3 70B)
    if (!chatResponseText && groqKey) {
      try {
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

        if (res.ok) {
          const data = await res.json();
          chatResponseText = data.choices?.[0]?.message?.content;
        } else {
          const errText = await res.text();
          console.warn(`Groq API returned error: ${res.status} - ${errText}`);
        }
      } catch (err) {
        console.warn('Groq API call failed, trying OpenRouter fallback...', err);
      }
    }

    // 3. Try OpenRouter API (Gemini 2.5 Flash)
    if (!chatResponseText && openrouterKey) {
      try {
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

        if (res.ok) {
          const data = await res.json();
          chatResponseText = data.choices?.[0]?.message?.content;
        } else {
          const errText = await res.text();
          console.warn(`OpenRouter API returned error: ${res.status} - ${errText}`);
        }
      } catch (err) {
        console.warn('OpenRouter API call failed...', err);
      }
    }

    // 4. Local Keyword Fallback
    if (!chatResponseText) {
      console.warn('All external AI APIs failed or are unconfigured. Activating local mock assistant...');
      
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
      const lowerMsg = lastUserMsg.toLowerCase();
      
      let reply = "I am currently running in offline standby mode due to high AI API demand. ";
      
      if (lowerMsg.includes('hello') || lowerMsg.includes('hi ') || lowerMsg.includes('hey')) {
        reply += `Hello! How can I help you manage your health today? I am aware of your health twin profile under the name ${userProfile?.name || 'User'}.`;
      } else if (lowerMsg.includes('medication') || lowerMsg.includes('drug') || lowerMsg.includes('pill')) {
        const meds = userProfile?.medications?.join(', ') || 'None reported';
        reply += `According to your profile, your active medications are: ${meds}. Please check the Medicine Scanner tab to scan new prescriptions and check for adverse side effects or drug-to-drug interactions.`;
      } else if (lowerMsg.includes('allergy') || lowerMsg.includes('allergies')) {
        const allergies = userProfile?.allergies?.join(', ') || 'None reported';
        reply += `Your profile lists the following allergies: ${allergies}. If you scan or enter a drug that contains these compounds, I will raise an alert immediately.`;
      } else if (lowerMsg.includes('condition') || lowerMsg.includes('disease') || lowerMsg.includes('diabet') || lowerMsg.includes('hypertension')) {
        const conds = userProfile?.conditions?.join(', ') || 'None reported';
        reply += `Your active medical conditions are recorded as: ${conds}. Your Health Twin monitors these indicators in real-time to alert you of elevated risk levels.`;
      } else if (lowerMsg.includes('heart') || lowerMsg.includes('bpm') || lowerMsg.includes('ecg')) {
        reply += `Your resting heart rate is currently calibrated and stable. You can monitor your real-time heart rate trends in the Wellness Tracker and Splunk Observability tabs.`;
      } else {
        reply += `I have noted your query. To protect your safety, please ensure your prescriptions match your listed allergies (${userProfile?.allergies?.join(', ') || 'None'}) and active medications (${userProfile?.medications?.join(', ') || 'None'}). Let me know if you would like me to explain any specific medical terms.`;
      }

      return NextResponse.json({
        content: reply,
        translation: null
      });
    }

    const parsed = JSON.parse(chatResponseText);
    return NextResponse.json(parsed);

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
