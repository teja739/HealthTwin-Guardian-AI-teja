import fs from 'fs';
import path from 'path';

// Local log file path
const LOGS_FILE_PATH = path.join(process.cwd(), 'splunk_logs.json');

export interface LogEvent {
  time: number; // epoch milliseconds
  host: string;
  source: string;
  sourcetype: string;
  index: string;
  event: Record<string, any>;
}

// Ensure the local JSON log file exists
function initializeLogStore() {
  if (!fs.existsSync(LOGS_FILE_PATH)) {
    try {
      fs.writeFileSync(LOGS_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to initialize local Splunk log file:', error);
    }
  }
}

/**
 * Write log to local JSON database and forward to live Splunk HEC if configured.
 */
export async function writeLog(payload: {
  sourcetype: string;
  source: string;
  host: string;
  event: Record<string, any>;
}): Promise<{ sentToLiveSplunk: boolean; savedLocally: boolean }> {
  initializeLogStore();

  const timestamp = Date.now();
  const splunkEvent: LogEvent = {
    time: timestamp,
    host: payload.host || 'healthtwin-app',
    source: payload.source || 'nextjs-api',
    sourcetype: payload.sourcetype,
    index: process.env.SPLUNK_INDEX || 'healthtwin',
    event: {
      ...payload.event,
      timestamp: new Date(timestamp).toISOString(),
    },
  };

  // 1. Save locally
  let savedLocally = false;
  try {
    const fileContent = fs.readFileSync(LOGS_FILE_PATH, 'utf-8');
    const logs = JSON.parse(fileContent);
    logs.push(splunkEvent);
    
    // Keep logs to a maximum of 1000 items to prevent file bloat during hackathon
    if (logs.length > 1000) {
      logs.shift();
    }
    
    fs.writeFileSync(LOGS_FILE_PATH, JSON.stringify(logs, null, 2), 'utf-8');
    savedLocally = true;
  } catch (error) {
    console.error('Failed to save log locally:', error);
  }

  // 2. Dispatch to live Splunk HTTP Event Collector (HEC) if keys exist
  let sentToLiveSplunk = false;
  const hecUrl = process.env.SPLUNK_HEC_URL;
  const hecToken = process.env.SPLUNK_HEC_TOKEN;

  if (hecUrl && hecToken) {
    try {
      // HEC expects /services/collector
      // Splunk HEC typically requires authorization headers: "Splunk <token>"
      const response = await fetch(hecUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Splunk ${hecToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          time: timestamp / 1000, // Splunk expects seconds
          host: splunkEvent.host,
          source: splunkEvent.source,
          sourcetype: splunkEvent.sourcetype,
          index: splunkEvent.index,
          event: splunkEvent.event,
        }),
      });

      if (response.ok) {
        sentToLiveSplunk = true;
      } else {
        const bodyText = await response.text();
        console.warn(`[Splunk HEC] Failed to log to Splunk Cloud: ${response.status} ${response.statusText} - ${bodyText}`);
      }
    } catch (error) {
      console.warn('[Splunk HEC] Network/authorization error contacting Splunk HEC:', error);
    }
  }

  return { sentToLiveSplunk, savedLocally };
}

/**
 * Retrieve logs matching the query.
 * If live search API configurations exist, we could query Splunk Search endpoint.
 * Otherwise, we run our custom SPL emulator on local logs.
 */
export async function queryLogs(splQuery: string): Promise<any[]> {
  initializeLogStore();

  let rawLogs: LogEvent[] = [];
  try {
    const fileContent = fs.readFileSync(LOGS_FILE_PATH, 'utf-8');
    rawLogs = JSON.parse(fileContent);
  } catch (error) {
    console.error('Failed to read local logs:', error);
    return [];
  }

  // Fallback to our SPL Query Emulator
  return emulateSPL(rawLogs, splQuery);
}

/**
 * A lightweight SPL (Splunk Processing Language) Query Emulator.
 * Supports:
 * - Simple filter matching: index=healthtwin sourcetype=medicine_scan
 * - Equality and inequality filters: severity=High, status!=warning
 * - Substring search: "conflict", "Lisinopril"
 * - Logical OR / AND (basic)
 * - Basic pipe aggregation: | stats count by sourcetype
 * - Time aggregation: | timechart count, | timechart span=1h avg(heartRate)
 */
function emulateSPL(logs: LogEvent[], query: string): any {
  if (!query || query.trim() === '') {
    return logs;
  }

  // Split query by pipe '|'
  const pipeParts = query.split('|').map(p => p.trim());
  const filterPart = pipeParts[0];

  // 1. Process Filtering Part
  let filtered = [...logs];

  if (filterPart && filterPart.toLowerCase() !== 'search') {
    // Parse filters
    // Example: index=healthtwin sourcetype=medicine_scan severity=High "alert text"
    // Regex to extract key=value or "text" search terms
    const termRegex = /([a-zA-Z0-9_\.]+)([\!]*=)([a-zA-Z0-9_\-\.\/]+|"[^"]+")|("([^"]+)"|'([^']+)'|([a-zA-Z0-9_\-\.]+))/g;
    let match;
    const filters: Array<{ key: string; op: string; val: string }> = [];
    const textSearches: string[] = [];

    while ((match = termRegex.exec(filterPart)) !== null) {
      if (match[1]) {
        // Key-value pair (e.g. sourcetype=medicine_scan)
        const key = match[1];
        const op = match[2];
        let val = match[3];
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        }
        filters.push({ key, op, val });
      } else {
        // Free text search term
        const text = match[5] || match[6] || match[7];
        if (text) {
          textSearches.push(text.toLowerCase());
        }
      }
    }

    filtered = logs.filter(log => {
      // Check key-value filters
      for (const filter of filters) {
        let actualVal = log[filter.key as keyof LogEvent] || log.event?.[filter.key];
        
        if (actualVal === undefined) {
          return false;
        }

        const matchVal = String(actualVal).toLowerCase();
        const targetVal = filter.val.toLowerCase();

        if (filter.op === '=') {
          if (matchVal !== targetVal) return false;
        } else if (filter.op === '!=') {
          if (matchVal === targetVal) return false;
        }
      }

      // Check text searches
      for (const text of textSearches) {
        const fullString = JSON.stringify(log).toLowerCase();
        if (!fullString.includes(text)) {
          return false;
        }
      }

      return true;
    });
  }

  // 2. Process Aggregate/Stats Pipes (if present)
  if (pipeParts.length > 1) {
    const pipeCmd = pipeParts[1];
    
    // Check if it's a stats command
    // Format: stats count by <field> or stats avg(<field>) by <field>
    if (pipeCmd.startsWith('stats ')) {
      const statsMatch = pipeCmd.match(/stats\s+([a-zA-Z0-9_\(\)]+)(?:\s+as\s+([a-zA-Z0-9_]+))?\s+by\s+([a-zA-Z0-9_\.]+)/i);
      if (statsMatch) {
        const aggFunc = statsMatch[1].trim().toLowerCase();
        const alias = statsMatch[2];
        const groupField = statsMatch[3].trim();

        const groups: Record<string, any[]> = {};
        filtered.forEach(log => {
          const groupVal = String(log[groupField as keyof LogEvent] || log.event?.[groupField] || 'unknown');
          if (!groups[groupVal]) groups[groupVal] = [];
          groups[groupVal].push(log);
        });

        const result = Object.entries(groups).map(([key, items]) => {
          let aggValue: any = 0;
          if (aggFunc === 'count') {
            aggValue = items.length;
          } else if (aggFunc.startsWith('avg(')) {
            const field = aggFunc.substring(4, aggFunc.length - 1);
            const sum = items.reduce((acc, it) => acc + Number(it.event?.[field] || it[field as keyof LogEvent] || 0), 0);
            aggValue = items.length ? Number((sum / items.length).toFixed(1)) : 0;
          } else if (aggFunc.startsWith('sum(')) {
            const field = aggFunc.substring(4, aggFunc.length - 1);
            aggValue = items.reduce((acc, it) => acc + Number(it.event?.[field] || it[field as keyof LogEvent] || 0), 0);
          } else if (aggFunc.startsWith('max(')) {
            const field = aggFunc.substring(4, aggFunc.length - 1);
            aggValue = Math.max(...items.map(it => Number(it.event?.[field] || it[field as keyof LogEvent] || 0)));
          }

          const outName = alias || aggFunc.replace('(', '_').replace(')', '');
          return {
            [groupField]: key,
            [outName]: aggValue,
          };
        });

        return result;
      }
    }

    // Check if it's a timechart command
    // Format: timechart count or timechart avg(heartRate)
    if (pipeCmd.startsWith('timechart ')) {
      const tcMatch = pipeCmd.match(/timechart\s+([a-zA-Z0-9_\(\)]+)/i);
      if (tcMatch) {
        const aggFunc = tcMatch[1].trim().toLowerCase();
        
        // Group logs into hourly buckets
        const hourBuckets: Record<string, any[]> = {};
        
        // Sort filtered logs chronologically
        const sorted = [...filtered].sort((a, b) => a.time - b.time);
        
        sorted.forEach(log => {
          const date = new Date(log.time);
          // Zero out minutes/seconds for simple hour buckets
          date.setMinutes(0, 0, 0);
          const bucketKey = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          if (!hourBuckets[bucketKey]) hourBuckets[bucketKey] = [];
          hourBuckets[bucketKey].push(log);
        });

        const result = Object.entries(hourBuckets).map(([hour, items]) => {
          let val = 0;
          if (aggFunc === 'count') {
            val = items.length;
          } else if (aggFunc.startsWith('avg(')) {
            const field = aggFunc.substring(4, aggFunc.length - 1);
            const sum = items.reduce((acc, it) => acc + Number(it.event?.[field] || 0), 0);
            val = items.length ? Number((sum / items.length).toFixed(1)) : 0;
          }
          return {
            _time: hour,
            value: val
          };
        });

        return result;
      }
    }
  }

  // Return standard logs (reverse chronological: newest first)
  return [...filtered].reverse();
}
