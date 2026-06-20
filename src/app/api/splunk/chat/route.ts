import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LOGS_FILE_PATH = path.join(process.cwd(), 'splunk_logs.json');

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    if (!geminiKey && !groqKey && !openrouterKey) {
      return NextResponse.json(
        { content: "AI API Key is not configured in .env.local. Please configure `GEMINI_API_KEY`, `GROQ_API_KEY`, or `OPENROUTER_API_KEY` to enable the Splunk AI Agent." },
        { status: 200 }
      );
    }

    // 1. Read recent logs for context (last 50 logs)
    let logsContext = "No logs available.";
    let rawLogs: any[] = [];
    try {
      if (fs.existsSync(LOGS_FILE_PATH)) {
        const fileContent = fs.readFileSync(LOGS_FILE_PATH, 'utf-8');
        rawLogs = JSON.parse(fileContent);
        // Get last 50 logs and format them concisely
        const recentLogs = rawLogs.slice(-50).map((log: any) => ({
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

    let responseText = null;

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
            maxOutputTokens: 1000,
            temperature: 0.2
          }
        };

        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (res.ok) {
          const data = await res.json();
          responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        } else {
          const errText = await res.text();
          console.warn(`Splunk AI Agent Gemini returned error: ${res.status} - ${errText}`);
        }
      } catch (err) {
        console.warn('Splunk AI Agent Gemini failed, trying Groq fallback...', err);
      }
    }

    // 2. Try Groq API (Llama 3.3 70B)
    if (!responseText && groqKey) {
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
            messages: groqMessages
          })
        });

        if (res.ok) {
          const data = await res.json();
          responseText = data.choices?.[0]?.message?.content;
        } else {
          const errText = await res.text();
          console.warn(`Splunk AI Agent Groq returned error: ${res.status} - ${errText}`);
        }
      } catch (err) {
        console.warn('Splunk AI Agent Groq failed, trying OpenRouter fallback...', err);
      }
    }

    // 3. Try OpenRouter API (Gemini 2.5 Flash)
    if (!responseText && openrouterKey) {
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
            messages: orMessages
          })
        });

        if (res.ok) {
          const data = await res.json();
          responseText = data.choices?.[0]?.message?.content;
        } else {
          const errText = await res.text();
          console.warn(`Splunk AI Agent OpenRouter returned error: ${res.status} - ${errText}`);
        }
      } catch (err) {
        console.warn('Splunk AI Agent OpenRouter failed...', err);
      }
    }

    // 4. Local Log Parser Standby fallback
    if (!responseText) {
      console.warn('Splunk AI Agent all LLMs failed. Using local logs parsing analysis.');
      
      let totalLogsCount = rawLogs.length;
      let emergencyCount = 0;
      let scanConflicts = 0;
      let averageHeartRate = 72;
      let heartRateSum = 0;
      let heartRateCount = 0;

      rawLogs.forEach((log: any) => {
        if (log.sourcetype === 'emergency_sos') emergencyCount++;
        if (log.sourcetype === 'medicine_scan' && log.event?.hasConflicts === true) scanConflicts++;
        if (log.sourcetype === 'biometric_telemetry' && log.event?.heartRate) {
          heartRateSum += Number(log.event.heartRate);
          heartRateCount++;
        }
      });
      if (heartRateCount > 0) {
        averageHeartRate = Math.round(heartRateSum / heartRateCount);
      }

      const reply = `### HealthTwin Observability Local Summary (Fallback Active)

Here is a summary parsed directly from your local log index (**splunk_logs.json**):
* **Total Logs Indexed**: ${totalLogsCount}
* **Emergency SOS Triggers**: ${emergencyCount}
* **Medication Scan Safety Conflicts**: ${scanConflicts}
* **Average Heart Rate Recorded**: ${averageHeartRate} BPM

**Suggested SPL verification query:**
\`\`\`splunk
index=healthtwin | stats count by sourcetype
\`\`\`

If you configure a valid API key (Gemini, Groq, or OpenRouter) in your environment variables, I can perform advanced natural language correlation of your telemetry logs. Let me know if you want me to describe any of these metrics!`;

      return NextResponse.json({ content: reply });
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
