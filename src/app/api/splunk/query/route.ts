import { NextResponse } from 'next/server';
import { queryLogs } from '@/lib/splunk-server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    const results = await queryLogs(query || '');

    return NextResponse.json({
      success: true,
      query: query || '',
      count: results.length,
      results,
    });
  } catch (error: any) {
    console.error('Error in splunk query api route:', error);
    return NextResponse.json(
      { error: `Query failed: ${error.message || error}` },
      { status: 500 }
    );
  }
}
