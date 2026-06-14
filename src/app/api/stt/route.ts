import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json(
        { error: "Groq API key is not configured in .env.local" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const language = formData.get('language') as string;

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Prepare FormData for Groq Transcription API
    const groqFormData = new FormData();
    groqFormData.append('file', file);
    groqFormData.append('model', 'whisper-large-v3-turbo');
    
    if (language) {
      // Whisper expects ISO 639-1 language codes (e.g. 'en', 'hi', 'te', 'es')
      const langCode = language.split('-')[0];
      groqFormData.append('language', langCode);
    }

    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`
      },
      body: groqFormData
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq Whisper API error: ${errText}`);
    }

    const data = await res.json();
    return NextResponse.json({ text: data.text });

  } catch (error: any) {
    console.error("Error in STT route:", error);
    return NextResponse.json(
      { error: error.message || error },
      { status: 500 }
    );
  }
}
