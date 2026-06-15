import { NextResponse } from 'next/server';
import { writeLog } from '@/lib/splunk-server';

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    const { sourcetype, source, host, event } = payload;

    if (!sourcetype || !event) {
      return NextResponse.json(
        { error: 'Missing required parameters: sourcetype and event are required.' },
        { status: 400 }
      );
    }

    const result = await writeLog({
      sourcetype,
      source: source || 'healthtwin-web-client',
      host: host || 'browser-client',
      event,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error in splunk logging api route:', error);
    return NextResponse.json(
      { error: `Logging failed: ${error.message || error}` },
      { status: 500 }
    );
  }
}
