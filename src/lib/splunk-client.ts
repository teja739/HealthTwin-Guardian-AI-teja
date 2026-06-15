/**
 * Client utility to log events to the Splunk HEC proxy endpoint.
 * This helper sends client-side telemetry, security, and interaction events
 * to /api/splunk/log asynchronously without blocking the user interface.
 */

export interface SplunkLogOptions {
  source?: string;
  host?: string;
  severity?: 'Info' | 'Success' | 'Warning' | 'High' | 'Critical';
}

export async function logToSplunk(
  sourcetype: string,
  event: Record<string, any>,
  options: SplunkLogOptions = {}
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const sessionStr = localStorage.getItem('healthtwin_session');
    let userEmail = 'anonymous';
    let userName = 'Anonymous';

    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        userEmail = session.email || userEmail;
        userName = session.name || userName;
      } catch {}
    }

    const payload = {
      sourcetype,
      source: options.source || 'healthtwin-web-client',
      host: options.host || 'browser-client',
      event: {
        ...event,
        userEmail,
        userName,
        severity: options.severity || 'Info',
        _client_timestamp: new Date().toISOString(),
      },
    };

    // Fire and forget, or return status
    const response = await fetch('/api/splunk/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.warn('[SplunkClient] Failed to dispatch log event:', error);
    return false;
  }
}
