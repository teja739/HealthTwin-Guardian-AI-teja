'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, Shield, Cpu, Activity, 
  Layers, AlertTriangle, CheckCircle, Flame
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogItem {
  id: string;
  timestamp: string;
  agent: string;
  status: 'info' | 'success' | 'warning' | 'alert';
  message: string;
}

export default function MissionControl() {
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'LOGS' | 'SYSTEM'>('TELEMETRY');
  const [logs, setLogs] = useState<LogItem[]>([]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Counters
  const [reportsCount, setReportsCount] = useState(11);
  const [risksPredicted, setRisksPredicted] = useState(7);
  const [medsTracked, setMedsTracked] = useState(6);
  const [aiDecisions, setAiDecisions] = useState(1324);

  // Simulated live feed generator
  const agents = ['Cardiac Agent', 'Blood Report Agent', 'Prediction Agent', 'Medication Agent', 'Emergency Agent', 'Doc Parser Agent'];
  const logMessages = [
    { agent: 'Cardiac Agent', message: 'Analyzing resting HR (64 bpm). ECG segment stable. QTc: 412ms.', status: 'success' },
    { agent: 'Blood Report Agent', message: 'Fasting glucose correlation computed (92 mg/dL). Hemoglobin A1c steady.', status: 'success' },
    { agent: 'Prediction Agent', message: 'Evaluating long-term cardiac arrhythmia probability vectors. Cumulative score: 1.2%.', status: 'info' },
    { agent: 'Medication Agent', message: 'Checking drug-drug interactions for current regimen: Lisinopril + Metoprolol. Clear.', status: 'success' },
    { agent: 'Doc Parser Agent', message: 'New prescription OCR extraction indexed in database. Entity: Lisinopril, 10mg.', status: 'info' },
    { agent: 'Emergency Agent', message: 'Verifying Emergency SOS contacts ping. Node response time: 42ms.', status: 'success' },
    { agent: 'Prediction Agent', message: 'Circadian shift detected (+45m sleep drift). Recalibrating stress models.', status: 'warning' },
    { agent: 'Cardiac Agent', message: 'Slight blood pressure fluctuation recorded (124/80 mmHg). Evaluating interaction factors.', status: 'warning' },
  ];

  useEffect(() => {
    // Generate initial logs
    const initialLogs: LogItem[] = [];
    const now = new Date();
    for (let i = 0; i < 15; i++) {
      const time = new Date(now.getTime() - (15 - i) * 60000);
      const randMsg = logMessages[Math.floor(Math.random() * logMessages.length)];
      initialLogs.push({
        id: `log-${i}`,
        timestamp: time.toLocaleTimeString(),
        agent: randMsg.agent,
        status: randMsg.status as any,
        message: randMsg.message
      });
    }
    setLogs(initialLogs);

    // Live additions
    const timer = setInterval(() => {
      const timeStr = new Date().toLocaleTimeString();
      const randMsg = logMessages[Math.floor(Math.random() * logMessages.length)];
      
      setLogs(prev => [
        ...prev.slice(1), 
        {
          id: `log-${Date.now()}`,
          timestamp: timeStr,
          agent: randMsg.agent,
          status: randMsg.status as any,
          message: randMsg.message
        }
      ]);

      // Randomly bump stats
      setAiDecisions(prev => prev + Math.floor(Math.random() * 3) + 1);
      if (Math.random() > 0.85) setReportsCount(prev => prev + 1);
      if (Math.random() > 0.9) setMedsTracked(prev => prev + 1);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Reports Analyzed', val: reportsCount, sub: '+1 recent scan' },
          { label: 'Risks Predicted', val: risksPredicted, sub: '0 urgent threats' },
          { label: 'Medications Tracked', val: medsTracked, sub: 'All logs synced' },
          { label: 'AI Decisions / Sec', val: aiDecisions, sub: 'Active calculations' }
        ].map((c, i) => (
          <div key={i} className="glass-panel p-5 rounded-2xl relative overflow-hidden">
            {/* Glowing stripe on top */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-medical-blue/80 to-transparent" />
            <p className="text-xs text-slate-400 font-medium tracking-wider uppercase">{c.label}</p>
            <h2 className="text-3xl font-display font-extrabold text-white mt-2 tracking-tight">
              {c.val}
            </h2>
            <p className="text-[10px] text-medical-teal font-mono mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Console Box */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 flex flex-col h-[500px]">
        {/* Terminal Header */}
        <div className="bg-slate-950/80 px-5 py-3.5 border-b border-white/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono text-slate-400 ml-2">guardian-agent-core@v1.4.2</span>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-white/5 border border-white/5">
            {(['TELEMETRY', 'LOGS', 'SYSTEM'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3 py-1 font-mono text-[10px] rounded transition duration-200",
                  activeTab === tab ? "bg-medical-blue/20 text-medical-blue border border-medical-blue/30" : "text-slate-400 hover:text-white"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content Pane */}
        <div className="flex-1 bg-slate-950/40 p-5 font-mono text-xs overflow-y-auto leading-relaxed select-text">
          {activeTab === 'TELEMETRY' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              {/* Telemetry metrics */}
              <div className="space-y-4">
                <p className="text-medical-blue text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <Activity className="w-3.5 h-3.5" />
                  Live Vital Vectors
                </p>
                <div className="space-y-3">
                  {[
                    { name: 'ECG Segment Variance', val: '0.04 ms', pct: 4 },
                    { name: 'Diastolic/Systolic Pressure', val: '118/74 mmHg', pct: 60 },
                    { name: 'Oxygen Saturation (SpO2)', val: '99%', pct: 99 },
                    { name: 'Autonomic HRV Balance', val: '76 ms', pct: 76 }
                  ].map((vit, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">{vit.name}</span>
                        <span className="text-white font-bold">{vit.val}</span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded overflow-hidden">
                        <div className="bg-medical-blue h-full" style={{ width: `${vit.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Agent Load Stats */}
              <div className="space-y-4">
                <p className="text-medical-teal text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <Cpu className="w-3.5 h-3.5" />
                  Agent Resource Allocation
                </p>
                <div className="space-y-3">
                  {[
                    { name: 'Cardiac Agent Thread', cpu: '2.1%', ram: '14.2 MB' },
                    { name: 'Blood Analytics Node', cpu: '0.0%', ram: '32.1 MB' },
                    { name: 'Predictive Risk Network', cpu: '18.4%', ram: '112 MB' },
                    { name: 'Safety Guard (Emergency Monitor)', cpu: '0.2%', ram: '4.8 MB' }
                  ].map((ag, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white/3 p-2 rounded-lg border border-white/5 text-[11px]">
                      <span className="text-slate-200 font-semibold">{ag.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-medical-teal font-mono">CPU: {ag.cpu}</span>
                        <span className="text-slate-400 font-mono">RAM: {ag.ram}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'LOGS' && (
            <div className="space-y-1.5">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 text-[11px] py-0.5 hover:bg-white/3 transition-colors rounded px-1">
                  <span className="text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
                  <span className={cn(
                    "font-bold shrink-0",
                    log.status === 'success' && 'text-emerald-400',
                    log.status === 'warning' && 'text-amber-400',
                    log.status === 'alert' && 'text-rose-500',
                    log.status === 'info' && 'text-medical-blue'
                  )}>
                    {log.agent}:
                  </span>
                  <span className="text-slate-300 flex-1">{log.message}</span>
                </div>
              ))}
              <div ref={consoleEndRef} />
            </div>
          )}

          {activeTab === 'SYSTEM' && (
            <div className="space-y-4 h-full flex flex-col justify-center items-center text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Shield className="w-8 h-8" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border border-slate-950 animate-ping" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">All Systems Operational</h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Encryption standard: AES-256-GCM. Medical compliance framework: HIPAA, HITECH, GDPR. Agent sync nodes: 7/7 online.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
