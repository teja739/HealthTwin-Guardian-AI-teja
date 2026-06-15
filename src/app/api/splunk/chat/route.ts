import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LOGS_FILE_PATH = path.join(process.cwd(), 'splunk_logs.json');

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json(
        { content: "Gemini API key is not configured in .env.local. Please configure it to enable the Splunk AI Agent." },
        { status: 200 }
      );
    }

    // 1. Read recent logs for context (last 50 logs)
    let logsContext = "No logs available.";
    try {
      if (fs.existsSync(LOGS_FILE_PATH)) {
        const fileContent = fs.readFileSync(LOGS_FILE_PATH, 'utf-8');
        const logs = JSON.parse(fileContent);
        // Get last 50 logs and format them concisely
        const recentLogs = logs.slice(-50).map((log: any) => ({
          time: new Date(log.time).toISOString(),
          sourcetype: log.sourcetype,
          severity: log.event?.severity || 'Info',
          event: log.event
        }));
        logsContext = JSON.stringify(recentLogs, null, 2);
      }
    } catch (err) {
      console.warn('Failed to read logs for AI agent context:', err);
    }

    const systemPrompt = `You are the HealthTwin Splunk Observability AI Agent. 
You are an expert in medical telemetry, application security monitoring, and Splunk systems.
Your job is to help the user analyze their HealthTwin system logs, identify trends in their vital readings, spot security anomalies, summarize drug safety warnings, and report on SOS emergencies.

Here are the recent Splunk logs from the HealthTwin system (last 50 events):
\`\`\`json
${logsContext}
\`\`\`

CRITICAL RULES:
1. Ground your answers strictly in the logs provided above. If asked about heart rates, sleep, drug conflicts, or alerts, look at the logs and give exact numbers/trends if present.
2. Provide suggestions for SPL queries (Splunk Processing Language) that the user can run to verify your findings (e.g. \`index=healthtwin sourcetype=biometric_telemetry | stats avg(heartRate) by user\`).
3. Keep your tone professional, analytical, yet reassuring.
4. Highlight critical severity warnings or high-risk medication conflicts immediately.

Format your response using clear markdown headers, bold text, lists, or tables where appropriate.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
    
    // Format messages for Gemini API
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
        maxOutputTokens: 1000,
        temperature: 0.2
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
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      throw new Error("Empty response from Gemini API");
    }

    return NextResponse.json({ content: responseText });

  } catch (error: any) {
    console.error('Error in Splunk AI Agent chat route:', error);
    return NextResponse.json(
      { content: `Error: Failed to fetch analysis from Splunk AI Agent: ${error.message || error}` },
      { status: 500 }
    );
  }
}
