import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, voice } = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured in .env.local" },
        { status: 500 }
      );
    }

    if (!text) {
      return NextResponse.json(
        { error: "No text provided for speech synthesis" },
        { status: 400 }
      );
    }

    // Clean markdown characters from the input text before speaking
    const cleanText = text.replace(/[*#_\-`]/g, '');

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "tts-1",
        input: cleanText,
        voice: voice || "shimmer" // Premium voices: alloy, echo, fable, onyx, nova, shimmer
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI TTS API error: ${errText}`);
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString()
      }
    });

  } catch (error: any) {
    console.error("Error in TTS route:", error);
    return NextResponse.json(
      { error: error.message || error },
      { status: 500 }
    );
  }
}
