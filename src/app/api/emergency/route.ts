import { NextResponse } from 'next/server';
import { writeLog } from '@/lib/splunk-server';

export async function POST(req: Request) {
  try {
    const { name, bloodGroup, allergies, medications, conditions, contacts } = await req.json();

    // 1. Log a Critical Emergency Event in Splunk (at the backend level)
    await writeLog({
      sourcetype: 'emergency_sos',
      source: 'emergency-api-server',
      host: 'healthtwin-backend',
      event: {
        action: 'emergency_sos_triggered',
        patientName: name,
        bloodGroup,
        allergies,
        medications,
        conditions,
        notifiedContacts: contacts,
        severity: 'Critical'
      }
    });

    // 2. Dispatch to Discord Webhook if configured (100% Free & instant for hackathon demo)
    const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
    if (discordWebhook) {
      try {
        const discordMessage = {
          username: "HealthTwin Guardian SOS",
          embeds: [{
            title: "🚨 CRITICAL EMERGENCY SOS ACTIVATED 🚨",
            description: `A critical health emergency has been declared for **${name}**.`,
            color: 15548997, // Red
            fields: [
              { name: "Blood Group", value: bloodGroup || "Unknown", inline: true },
              { name: "Known Conditions", value: conditions.join(', ') || "None reported", inline: false },
              { name: "Allergies", value: allergies.join(', ') || "None reported", inline: false },
              { name: "Active Medications", value: medications.join(', ') || "None reported", inline: false },
              { name: "Notified Contacts", value: contacts.map((c: any) => `${c.name} (${c.role}): ${c.phone}`).join('\n'), inline: false }
            ],
            timestamp: new Date().toISOString()
          }]
        };

        await fetch(discordWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(discordMessage)
        });
      } catch (err) {
        console.error('Failed to send Discord webhook:', err);
      }
    }

    // 3. Dispatch to Twilio SMS if configured
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_FROM_NUMBER;
    const twilioTo = process.env.TWILIO_TO_NUMBER; // Target mobile number (e.g. physician or spouse)

    let smsSent = false;
    if (twilioSid && twilioAuthToken && twilioFrom && twilioTo) {
      try {
        const auth = Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString('base64');
        const bodyParams = new URLSearchParams();
        bodyParams.append('From', twilioFrom);
        bodyParams.append('To', twilioTo);
        bodyParams.append('Body', `🚨 HEALTH TWIN SOS ALERT: Emergency mode activated for ${name}. Blood Group: ${bloodGroup}. Conditions: ${conditions.join(', ')}. Please check on them immediately!`);

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const res = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: bodyParams
        });

        if (res.ok) {
          smsSent = true;
        } else {
          const errText = await res.text();
          console.warn('Twilio API error:', errText);
        }
      } catch (err) {
        console.error('Failed to send Twilio SMS:', err);
      }
    }

    return NextResponse.json({
      success: true,
      discordAlertSent: !!discordWebhook,
      twilioAlertSent: smsSent
    });

  } catch (error: any) {
    console.error('Emergency SOS API Error:', error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
